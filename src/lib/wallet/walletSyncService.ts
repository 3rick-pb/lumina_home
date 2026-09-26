import { pushGoogleWalletOrderUpdate, GoogleWalletOrderInput, isGoogleWalletConfigured } from './googleWalletService';
import { notifyRegisteredAppleDevices } from './passDeviceStore';
import { isAppleSigningConfigured } from './applePassSigner';
import { supabaseAdmin } from '../supabaseAdmin';

export interface WalletSyncResult {
  success: boolean;
  status: 'SYNCED' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  googleStatus: 'UPDATED' | 'CREATED' | 'SKIPPED' | 'FAILED';
  appleStatus: 'NOTIFIED' | 'NO_DEVICES' | 'SKIPPED' | 'FAILED';
  timestamp: string;
  details: {
    googleMessage?: string;
    appleMessage?: string;
    errors: string[];
  };
}

/**
 * Executes an async action with exponential backoff retries.
 */
async function retryWithBackoff<T>(
  action: () => Promise<T>,
  retries = 3,
  delayMs = 400
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Central orchestrator for synchronizing order status changes to both Apple Wallet and Google Wallet.
 */
export async function syncOrderToWallets(
  order: GoogleWalletOrderInput
): Promise<WalletSyncResult> {
  const now = new Date().toISOString();
  const errors: string[] = [];
  let googleStatus: 'UPDATED' | 'CREATED' | 'SKIPPED' | 'FAILED' = 'SKIPPED';
  let googleMessage: string | undefined;
  let appleStatus: 'NOTIFIED' | 'NO_DEVICES' | 'SKIPPED' | 'FAILED' = 'SKIPPED';
  let appleMessage: string | undefined;

  // 1. Synchronize Google Wallet GenericObject via REST API
  if (isGoogleWalletConfigured()) {
    try {
      const gResult = await retryWithBackoff(async () => {
        return await pushGoogleWalletOrderUpdate(order);
      }, 2, 300);

      googleStatus = gResult.status;
      googleMessage = gResult.message;
      if (!gResult.success && gResult.status === 'FAILED') {
        errors.push(`Google Wallet: ${gResult.message || 'Fallo desconocido'}`);
      }
    } catch (gErr) {
      googleStatus = 'FAILED';
      googleMessage = String(gErr);
      errors.push(`Google Wallet Exception: ${String(gErr)}`);
    }
  } else {
    googleStatus = 'SKIPPED';
    googleMessage = 'Google Wallet no configurado en variables de entorno.';
  }

  // 2. Synchronize Apple Wallet registered devices via APNs
  const passTypeIdentifier =
    process.env.APPLE_ORDER_PASS_TYPE_IDENTIFIER ||
    process.env.APPLE_PASS_TYPE_IDENTIFIER ||
    'pass.com.luminahome.orders';
  const cleanId = order.orderId.replace(/[^a-zA-Z0-9_-]/g, '');
  const serialNumber = `LH-${cleanId}`;

  try {
    const applePushResult = await notifyRegisteredAppleDevices(passTypeIdentifier, serialNumber);
    if (applePushResult.dispatchedCount > 0) {
      appleStatus = 'NOTIFIED';
      appleMessage = applePushResult.message;
    } else {
      appleStatus = 'NO_DEVICES';
      appleMessage = 'No hay dispositivos Apple registrados actualmente para esta orden.';
    }
  } catch (aErr) {
    appleStatus = 'FAILED';
    appleMessage = String(aErr);
    errors.push(`Apple Wallet Push Exception: ${String(aErr)}`);
  }

  // Determine overall status
  let overallStatus: 'SYNCED' | 'PARTIAL' | 'FAILED' | 'SKIPPED' = 'SYNCED';

  const googleOk = googleStatus === 'UPDATED' || googleStatus === 'CREATED';
  const appleOk = appleStatus === 'NOTIFIED' || appleStatus === 'NO_DEVICES';

  if (!isGoogleWalletConfigured() && !isAppleSigningConfigured()) {
    overallStatus = 'SKIPPED';
  } else if (googleOk && appleOk) {
    overallStatus = 'SYNCED';
  } else if (googleOk || appleOk) {
    overallStatus = 'PARTIAL';
  } else {
    overallStatus = 'FAILED';
  }

  const result: WalletSyncResult = {
    success: overallStatus === 'SYNCED' || overallStatus === 'PARTIAL',
    status: overallStatus,
    googleStatus,
    appleStatus,
    timestamp: now,
    details: {
      googleMessage,
      appleMessage,
      errors,
    },
  };

  // Safely persist audit log in orders table if columns exist
  try {
    await supabaseAdmin
      .from('orders')
      .update({
        wallet_sync_status: overallStatus,
        wallet_last_updated_at: now,
        wallet_sync_error: errors.length > 0 ? errors.join(' | ') : null,
      })
      .eq('id', order.orderId);
  } catch {
    // Non-blocking if columns aren't yet in Supabase schema
  }

  return result;
}
