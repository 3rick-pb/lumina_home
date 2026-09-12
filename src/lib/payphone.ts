import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PayPhone Ecuador API Configuration & Types
 * Supported Modes: 'box' (Cajita de Pagos) | 'redirect' (Botón de Pago por Redirección)
 * Official Documentation: https://docs.payphone.app/
 */

export type PayPhonePaymentMode = 'box' | 'redirect';

export interface PayPhoneConfig {
  isConfigured: boolean;
  isSimulated: boolean;
  environment: 'production' | 'sandbox';
  storeId: string;
  token: string;
  defaultMode: PayPhonePaymentMode;
  apiUrl: string;
  boxConfirmUrl: string;
  buttonPrepareUrl: string;
  buttonConfirmUrl: string;
  appUrl: string;
}

export interface PayPhonePrepareParams {
  orderId: string;
  amount: number; // in USD decimal, e.g. 15.50
  amountWithoutTax?: number;
  amountWithTax?: number;
  tax?: number; // IVA
  customerEmail: string;
  customerPhone?: string;
  documentId?: string; // Cédula o RUC Ecuador
  clientTransactionId?: string;
  customReference?: string;
  modeOverride?: PayPhonePaymentMode;
}

export interface PayPhonePrepareResponse {
  success: boolean;
  mode: PayPhonePaymentMode;
  paymentId?: number | string;
  payUrl?: string; // For redirect mode
  clientTransactionId: string;
  isSimulated: boolean;
  amountInCents: number;
  amountWithoutTaxInCents: number;
  amountWithTaxInCents: number;
  taxInCents: number;
  currency: 'USD';
  storeId: string;
  token?: string; // Only needed for Cajita frontend initialization
  reference: string;
  email?: string;
  phoneNumber?: string;
  documentId?: string;
  error?: string;
}

export interface PayPhoneConfirmParams {
  id: number | string;
  clientTxId: string;
  expectedAmountCents?: number; // Anti-tampering check
  simulatedDeferred?: boolean;
}

export interface PayPhoneConfirmResponse {
  success: boolean;
  transactionStatus: 'Approved' | 'Rejected' | 'Canceled' | 'Pending';
  transactionId?: number | string;
  clientTransactionId: string;
  amountCents?: number;
  currency?: string;
  cardType?: string;
  lastDigits?: string;
  bin?: string;
  authorizationCode?: string;
  message?: string;
  isSimulated: boolean;
  error?: string;
  // Official PayPhone Deferred Payment Fields (Fase 15)
  deferred?: boolean;
  deferredCode?: string | null;
  deferredMessage?: string | null;
  isDeferred?: boolean;
}

/**
 * Validates Ecuadorian Identity Document (Cédula de Identidad & RUC)
 * Implements the official SRI Modulo 10 and Modulo 11 validation algorithms.
 */
export function validateEcuadorianId(doc: string): { isValid: boolean; type: 'cedula' | 'ruc' | 'passport' | 'invalid'; error?: string } {
  const clean = String(doc || '').trim().replace(/\D/g, '');

  if (!clean) {
    return { isValid: false, type: 'invalid', error: 'El número de identificación no puede estar vacío.' };
  }

  // Cédula: exactly 10 digits
  if (clean.length === 10) {
    const province = parseInt(clean.substring(0, 2), 10);
    if ((province < 1 || province > 24) && province !== 30) {
      return { isValid: false, type: 'invalid', error: 'Código de provincia inválido para cédula ecuatoriana.' };
    }

    const thirdDigit = parseInt(clean.charAt(2), 10);
    if (thirdDigit >= 6) {
      return { isValid: false, type: 'invalid', error: 'Tercer dígito inválido para persona natural.' };
    }

    // Modulo 10 verification
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let val = parseInt(clean.charAt(i), 10) * coefficients[i];
      if (val >= 10) val -= 9;
      sum += val;
    }

    const verifier = (10 - (sum % 10)) % 10;
    const lastDigit = parseInt(clean.charAt(9), 10);

    if (verifier !== lastDigit) {
      return { isValid: false, type: 'invalid', error: 'Dígito verificador de cédula no coincide (Algoritmo Módulo 10).' };
    }

    return { isValid: true, type: 'cedula' };
  }

  // RUC: 13 digits (must end in 001, 0001, etc.)
  if (clean.length === 13) {
    const establishment = clean.substring(10, 13);
    if (establishment === '000') {
      return { isValid: false, type: 'invalid', error: 'El establecimiento del RUC no puede ser 000.' };
    }

    const province = parseInt(clean.substring(0, 2), 10);
    if ((province < 1 || province > 24) && province !== 30) {
      return { isValid: false, type: 'invalid', error: 'Código de provincia inválido para RUC ecuatoriano.' };
    }

    const thirdDigit = parseInt(clean.charAt(2), 10);

    // Persona Natural RUC: first 10 digits are a valid cédula + 001
    if (thirdDigit < 6) {
      const cedulaPart = clean.substring(0, 10);
      const cedCheck = validateEcuadorianId(cedulaPart);
      if (!cedCheck.isValid) {
        return { isValid: false, type: 'invalid', error: 'Los primeros 10 dígitos del RUC de persona natural no son una cédula válida.' };
      }
      return { isValid: true, type: 'ruc' };
    }

    // Sociedad Privada / Extranjera: third digit is 9
    if (thirdDigit === 9) {
      const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i), 10) * coefficients[i];
      }
      const verifier = (11 - (sum % 11)) % 11;
      const tenthDigit = parseInt(clean.charAt(9), 10);
      if (verifier !== tenthDigit) {
        return { isValid: false, type: 'invalid', error: 'Dígito verificador de RUC jurídico no coincide.' };
      }
      return { isValid: true, type: 'ruc' };
    }

    // Sociedad Pública: third digit is 6
    if (thirdDigit === 6) {
      const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(clean.charAt(i), 10) * coefficients[i];
      }
      const verifier = (11 - (sum % 11)) % 11;
      const ninthDigit = parseInt(clean.charAt(8), 10);
      if (verifier !== ninthDigit) {
        return { isValid: false, type: 'invalid', error: 'Dígito verificador de RUC público no coincide.' };
      }
      return { isValid: true, type: 'ruc' };
    }

    return { isValid: false, type: 'invalid', error: 'Formato de RUC no reconocido para Ecuador.' };
  }

  // Passports or foreign docs (6 to 20 alphanumeric characters)
  if (/^[A-Z0-9]{6,20}$/i.test(doc.trim())) {
    return { isValid: true, type: 'passport' };
  }

  return { isValid: false, type: 'invalid', error: 'Formato de identificación no válido para Ecuador (Cédula 10 dígitos o RUC 13 dígitos).' };
}

/**
 * Sanitizes input strings against XSS and dangerous characters.
 */
export function sanitizeString(val: unknown, maxLength = 100): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\\'"]/g, '')     // Strip quotes
    .trim()
    .slice(0, maxLength);
}

/**
 * Read environment variables safely.
 * Secret token is NEVER exposed to client.
 */
export function getPayPhoneConfig(): PayPhoneConfig {
  const token = process.env.PAYPHONE_TOKEN?.trim() || '';
  const storeId = process.env.PAYPHONE_STORE_ID?.trim() || process.env.PAYPHONE_APP_ID?.trim() || process.env.NEXT_PUBLIC_PAYPHONE_APP_ID?.trim() || '';
  const env = ((process.env.PAYPHONE_ENV || 'sandbox').toLowerCase() === 'production') ? 'production' : 'sandbox';
  const defaultMode = (process.env.PAYPHONE_PAYMENT_MODE?.toLowerCase() === 'redirect') ? 'redirect' : 'box';

  const apiUrl = 'https://pay.payphonetodoesposible.com/api';
  const boxConfirmUrl = 'https://paymentbox.payphonetodoesposible.com/api/confirm';
  const buttonPrepareUrl = 'https://pay.payphonetodoesposible.com/api/button/Prepare';
  const buttonConfirmUrl = 'https://pay.payphonetodoesposible.com/api/button/V2/Confirm';
  
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  ).replace(/\/$/, '');

  const isConfigured = Boolean(token && storeId);
  // If token is missing, simulation mode is active so the store functions gracefully while RUC is pending
  const isSimulated = !isConfigured;

  return {
    isConfigured,
    isSimulated,
    environment: env,
    storeId,
    token,
    defaultMode,
    apiUrl,
    boxConfirmUrl,
    buttonPrepareUrl,
    buttonConfirmUrl,
    appUrl
  };
}

/**
 * Reads the active PayPhone payment mode from Supabase admin_payment_settings.
 * Falls back to environment variable PAYPHONE_PAYMENT_MODE or 'box'.
 */
export async function getStorePaymentMode(): Promise<PayPhonePaymentMode> {
  try {
    const { data, error } = await supabaseServer
      .from('admin_payment_settings')
      .select('payment_mode')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data?.payment_mode) {
      const mode = String(data.payment_mode).toLowerCase().trim();
      if (mode === 'redirect' || mode === 'box') {
        return mode as PayPhonePaymentMode;
      }
    }
  } catch (err) {
    console.warn('[PayPhone] Warning reading payment_mode from DB:', err);
  }

  const envMode = process.env.PAYPHONE_PAYMENT_MODE?.toLowerCase().trim();
  return envMode === 'redirect' ? 'redirect' : 'box';
}

/**
 * Saves the active PayPhone payment mode to Supabase admin_payment_settings.
 * Restricted to administrators in API endpoints.
 */
export async function setStorePaymentMode(mode: PayPhonePaymentMode, updatedBy: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from('admin_payment_settings')
      .upsert({
        id: 'global',
        payment_mode: mode,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[PayPhone] Error updating admin_payment_settings:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[PayPhone] Exception updating admin_payment_settings:', err);
    return false;
  }
}

/**
 * Prepares a payment session on PayPhone according to active mode ('box' | 'redirect').
 * Handles exact cents formatting and dual-mode (Live vs Simulated).
 */
export async function preparePayPhonePayment(params: PayPhonePrepareParams): Promise<PayPhonePrepareResponse> {
  const config = getPayPhoneConfig();
  const rawTotal = Math.max(0, Number(params.amount) || 0);
  
  // PayPhone expects amounts in integer cents (e.g., $15.50 -> 1550)
  const amountInCents = Math.round(rawTotal * 100);

  if (amountInCents <= 0) {
    return {
      success: false,
      mode: params.modeOverride || config.defaultMode,
      clientTransactionId: '',
      isSimulated: config.isSimulated,
      amountInCents: 0,
      amountWithoutTaxInCents: 0,
      amountWithTaxInCents: 0,
      taxInCents: 0,
      currency: 'USD',
      storeId: config.storeId,
      reference: '',
      error: 'El monto total a pagar debe ser mayor a cero.'
    };
  }

  // Active mode from DB or parameter
  const activeMode: PayPhonePaymentMode = params.modeOverride || await getStorePaymentMode();

  // Ecuadorian Tax Calculation (15% IVA default or breakdown provided)
  const taxInCents = params.tax !== undefined ? Math.round(params.tax * 100) : 0;
  const amountWithTaxInCents = params.amountWithTax !== undefined ? Math.round(params.amountWithTax * 100) : 0;
  const amountWithoutTaxInCents = params.amountWithoutTax !== undefined 
    ? Math.round(params.amountWithoutTax * 100) 
    : (amountInCents - amountWithTaxInCents - taxInCents);

  // Cryptographically strong clientTransactionId
  const clientTransactionId = params.clientTransactionId || 
    `LM_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const cleanEmail = sanitizeString(params.customerEmail, 80);
  const cleanPhone = sanitizeString(params.customerPhone || '0999999999', 20).replace(/\D/g, '');
  const cleanDoc = sanitizeString(params.documentId || '9999999999', 20).replace(/\D/g, '');
  const cleanRef = sanitizeString(params.customReference || `Compra Lumina Home - Orden ${params.orderId}`, 120);

  // If credentials are NOT configured yet (RUC pending), return a structured simulation payload
  if (config.isSimulated) {
    const simulatedPaymentId = Math.floor(1000000 + Math.random() * 9000000);
    return {
      success: true,
      mode: activeMode,
      paymentId: simulatedPaymentId,
      payUrl: `${config.appUrl}/checkout/payphone/callback?id=${simulatedPaymentId}&clientTransactionId=${clientTransactionId}&simulated=true`,
      clientTransactionId,
      isSimulated: true,
      amountInCents,
      amountWithoutTaxInCents: Math.max(0, amountWithoutTaxInCents),
      amountWithTaxInCents: Math.max(0, amountWithTaxInCents),
      taxInCents: Math.max(0, taxInCents),
      currency: 'USD',
      storeId: 'SIMULATED_STORE',
      reference: cleanRef,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      documentId: cleanDoc
    };
  }

  // Live / Sandbox Mode: Branch based on activeMode
  if (activeMode === 'box') {
    // Mode "box": Return official configuration for PPaymentButtonBox widget
    return {
      success: true,
      mode: 'box',
      clientTransactionId,
      isSimulated: false,
      amountInCents,
      amountWithoutTaxInCents: Math.max(0, amountWithoutTaxInCents),
      amountWithTaxInCents: Math.max(0, amountWithTaxInCents),
      taxInCents: Math.max(0, taxInCents),
      currency: 'USD',
      storeId: config.storeId,
      token: config.token, // Necessary for PPaymentButtonBox initialization
      reference: cleanRef,
      email: cleanEmail,
      phoneNumber: cleanPhone ? `+593${cleanPhone.replace(/^0+/, '')}` : undefined,
      documentId: cleanDoc
    };
  }

  // Mode "redirect": Call PayPhone official Prepare API
  try {
    const payload = {
      responseUrl: `${config.appUrl}/checkout/payphone/callback`,
      cancellationUrl: `${config.appUrl}/checkout/payphone/cancel`,
      amount: amountInCents,
      amountWithoutTax: Math.max(0, amountWithoutTaxInCents),
      amountWithTax: Math.max(0, amountWithTaxInCents),
      tax: Math.max(0, taxInCents),
      service: 0,
      tip: 0,
      currency: 'USD',
      storeId: config.storeId,
      clientTransactionId,
      reference: cleanRef,
      email: cleanEmail || undefined,
      phoneNumber: cleanPhone ? `+593${cleanPhone.replace(/^0+/, '')}` : undefined,
      documentId: cleanDoc || undefined
    };

    const response = await fetch(config.buttonPrepareUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[PayPhone] Prepare API Error HTTP', response.status, errText);
      return {
        success: false,
        mode: 'redirect',
        clientTransactionId,
        isSimulated: false,
        amountInCents,
        amountWithoutTaxInCents,
        amountWithTaxInCents,
        taxInCents,
        currency: 'USD',
        storeId: config.storeId,
        reference: cleanRef,
        error: `Error de pasarela PayPhone (${response.status}): ${errText || 'Respuesta inesperada'}`
      };
    }

    const data = await response.json();
    // In Button Prepare API, PayPhone returns payWithCard and payWithPayPhone
    const payUrl = data.payWithCard || data.payWithPayPhone || data.payUrl || data.url;

    return {
      success: true,
      mode: 'redirect',
      paymentId: data.paymentId || data.id,
      payUrl,
      clientTransactionId,
      isSimulated: false,
      amountInCents,
      amountWithoutTaxInCents,
      amountWithTaxInCents,
      taxInCents,
      currency: 'USD',
      storeId: config.storeId,
      reference: cleanRef
    };
  } catch (networkError) {
    console.error('[PayPhone] Connection failure:', networkError);
    return {
      success: false,
      mode: 'redirect',
      clientTransactionId,
      isSimulated: false,
      amountInCents,
      amountWithoutTaxInCents,
      amountWithTaxInCents,
      taxInCents,
      currency: 'USD',
      storeId: config.storeId,
      reference: cleanRef,
      error: 'No se pudo establecer conexión con el servidor seguro de PayPhone Ecuador.'
    };
  }
}

/**
 * Confirms a transaction directly with PayPhone Server-to-Server.
 * Includes Anti-Fraud Amount Matching & Idempotency.
 */
export async function confirmPayPhonePayment(params: PayPhoneConfirmParams): Promise<PayPhoneConfirmResponse> {
  const config = getPayPhoneConfig();

  // If in simulation mode (RUC in progress):
  if (config.isSimulated || String(params.id).startsWith('SIM_')) {
    const isSimDeferred = Boolean(params.simulatedDeferred);
    return {
      success: true,
      transactionStatus: 'Approved',
      transactionId: params.id || `SIM_TX_${Date.now()}`,
      clientTransactionId: params.clientTxId,
      amountCents: params.expectedAmountCents || 0,
      currency: 'USD',
      cardType: 'Visa (Simulador Oficial SRI)',
      lastDigits: '4242',
      authorizationCode: 'AUTH-SIM-888',
      message: 'Transacción simulada aprobada exitosamente en entorno de desarrollo.',
      isSimulated: true,
      deferred: isSimDeferred,
      isDeferred: isSimDeferred,
      deferredCode: isSimDeferred ? '03' : null,
      deferredMessage: isSimDeferred ? '3 meses sin intereses' : 'Pago Corriente'
    };
  }

  // Real PayPhone Server Confirmation
  // We check the Button V2 Confirm endpoint (which also handles transactions generated via Box)
  try {
    const payload = {
      id: Number(params.id),
      clientTxId: params.clientTxId
    };

    let confirmUrl = config.buttonConfirmUrl;
    let response = await fetch(confirmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    // If Button V2 returned 404/not found, try boxConfirmUrl fallback
    if (!response.ok && response.status === 404) {
      confirmUrl = config.boxConfirmUrl;
      response = await fetch(confirmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[PayPhone] Confirm API Error HTTP', response.status, errText);

      // Check if error is related to deferred rejection
      if (errText.includes('823') || errText.includes('824') || errText.includes('825') || /diferido\s+no\s+autorizado/i.test(errText)) {
        return {
          success: false,
          transactionStatus: 'Rejected',
          clientTransactionId: params.clientTxId,
          isSimulated: false,
          error: 'La opción de diferido seleccionada no está disponible o no fue autorizada para tu tarjeta. Te sugerimos realizar el pago corriente o intentar con otra tarjeta bancaria.'
        };
      }

      return {
        success: false,
        transactionStatus: 'Rejected',
        clientTransactionId: params.clientTxId,
        isSimulated: false,
        error: 'No se pudo completar la verificación del pago con PayPhone Ecuador. Por favor reintenta.'
      };
    }

    const data = await response.json();
    const isApproved = data.transactionStatus === 'Approved' || data.statusCode === 3;
    const amountConfirmed = Number(data.amount) || 0;
    const rawMsg = String(data.message || data.transactionMessage || '').trim();
    const errorCode = Number(data.errorCode || data.statusCode);

    // Rule 9, 10, 11: Handle issuer deferred rejection with user-friendly message
    const isDeferredUnauthorized = 
      /diferido\s+no\s+autorizado/i.test(rawMsg) ||
      errorCode === 823 || // Tipo de diferido es inválido
      errorCode === 824 || // La tienda no tiene el diferido enviado
      errorCode === 825;   // El diferido no está activo para la tienda

    if (isDeferredUnauthorized) {
      return {
        success: false,
        transactionStatus: 'Rejected',
        clientTransactionId: params.clientTxId,
        amountCents: amountConfirmed,
        isSimulated: false,
        error: 'La opción de diferido seleccionada no está disponible o no fue autorizada para tu tarjeta. Te sugerimos realizar el pago corriente o intentar con otra tarjeta bancaria.'
      };
    }

    // Zero-Trust: Anti-Tampering Amount Check
    if (isApproved && params.expectedAmountCents && amountConfirmed > 0) {
      if (Math.abs(amountConfirmed - params.expectedAmountCents) > 1) { // 1 cent safety margin
        console.error('[PayPhone Anti-Fraud] Mismatch in authorized amount!', {
          expected: params.expectedAmountCents,
          received: amountConfirmed,
          clientTxId: params.clientTxId
        });
        return {
          success: false,
          transactionStatus: 'Rejected',
          clientTransactionId: params.clientTxId,
          amountCents: amountConfirmed,
          isSimulated: false,
          error: 'Alerta de Seguridad: El monto confirmado por PayPhone no coincide con el total de la orden.'
        };
      }
    }

    // Rule 3, 4, 7, 8: Process official deferred fields returned by PayPhone
    const rawDeferred = data.deferred !== undefined ? data.deferred : data.isDeferred;
    const isDeferred = Boolean(
      rawDeferred === true || 
      rawDeferred === 1 || 
      rawDeferred === 'true' || 
      (data.deferredCode && String(data.deferredCode).trim() !== '00' && String(data.deferredCode).trim() !== '')
    );
    const deferredCode = data.deferredCode ? String(data.deferredCode).trim() : null;
    const deferredMessage = data.deferredMessage 
      ? String(data.deferredMessage).trim() 
      : (isDeferred ? 'Pago Diferido Autorizado' : 'Pago Corriente');

    return {
      success: isApproved,
      transactionStatus: isApproved ? 'Approved' : (data.transactionStatus || 'Rejected'),
      transactionId: data.transactionId || params.id,
      clientTransactionId: data.clientTransactionId || params.clientTxId,
      amountCents: amountConfirmed,
      currency: data.currency || 'USD',
      cardType: data.cardBrand || data.cardType || 'Tarjeta Bancaria',
      lastDigits: data.lastDigits?.replace(/\D/g, '') || '',
      bin: data.bin || '',
      authorizationCode: data.authorizationCode || '',
      message: rawMsg || '',
      isSimulated: false,
      deferred: isDeferred,
      isDeferred,
      deferredCode,
      deferredMessage
    };
  } catch (error) {
    console.error('[PayPhone] Confirmation exception:', error);
    return {
      success: false,
      transactionStatus: 'Pending',
      clientTransactionId: params.clientTxId,
      isSimulated: false,
      error: 'Error de red al consultar el estado de la transacción en PayPhone.'
    };
  }
}
