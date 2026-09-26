import { pushGoogleWalletOrderUpdate, GoogleWalletOrderInput, isGoogleWalletConfigured } from './googleWalletService';
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
 * Central orchestrator for synchronizing order status changes to Google Wallet.
 */
export async function syncOrderToWallets(
  order: GoogleWalletOrderInput
): Promise<WalletSyncResult> {
  const now = new Date().toISOString();
  const errors: string[] = [];
  let googleStatus: 'UPDATED' | 'CREATED' | 'SKIPPED' | 'FAILED' = 'SKIPPED';
  let googleMessage: string | undefined;
  const appleStatus: 'NOTIFIED' | 'NO_DEVICES' | 'SKIPPED' | 'FAILED' = 'SKIPPED';
  const appleMessage = 'Apple Wallet omitido (sistema optimizado para Google Wallet).';

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

  // Determine overall status
  let overallStatus: 'SYNCED' | 'PARTIAL' | 'FAILED' | 'SKIPPED' = 'SYNCED';

  if (!isGoogleWalletConfigured()) {
    overallStatus = 'SKIPPED';
  } else if (googleStatus === 'UPDATED' || googleStatus === 'CREATED') {
    overallStatus = 'SYNCED';
  } else {
    overallStatus = 'FAILED';
  }

  const result: WalletSyncResult = {
    success: overallStatus === 'SYNCED',
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
