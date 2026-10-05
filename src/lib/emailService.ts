import nodemailer from 'nodemailer';
import { supabaseServer, MASTER_ADMIN_EMAIL } from './serverAuth';
import { brandConfig } from '@/config/brand.config';

export interface OrderEmailItem {
  product: {
    id?: string;
    title: string;
    price: number;
    imageUrl?: string;
    category?: string;
  };
  quantity: number;
  color?: string;
}

export interface OrderEmailData {
  id: string;
  trackingNumber?: string;
  date?: string;
  time?: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerIdNumber?: string;
  customerPhone?: string;
  recipient?: string;
  paymentMethod?: string;
  total: number;
  items: OrderEmailItem[];
  shippingAddress?: {
    recipient?: string;
    idNumber?: string;
    phone?: string;
    email?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Retrieves all authorized administrator emails (Master admin + Invited admins)
 */
export async function getAllAdminEmails(): Promise<string[]> {
  const admins = new Set<string>([MASTER_ADMIN_EMAIL]);

  try {
    const { data: rows } = await supabaseServer
      .from('admin_invitations')
      .select('email')
      .eq('is_active', true);

    if (rows && Array.isArray(rows)) {
      rows.forEach((r: { email?: string }) => {
        if (r.email && r.email.includes('@')) {
          admins.add(r.email.toLowerCase().trim());
        }
      });
    }
  } catch (err) {
    console.warn('[emailService] Could not load invited admins from admin_invitations:', err);
  }

  return Array.from(admins);
}

/**
 * Retrieves the extra dispatch recipient emails (up to 7 emails) configured by administrators.
 * Dedicated for warehouse, logistics, or couriers who do NOT need to be store administrators
 * nor registered accounts.
 * Checks the dedicated table `admin_dispatch_recipients` first, with resilient fallback.
 */
export async function getExtraDispatchRecipientEmails(): Promise<string[]> {
  try {
    const { data: rows, error } = await supabaseServer
      .from('admin_dispatch_recipients')
      .select('email')
      .eq('is_active', true)
      .limit(7);

    if (!error && Array.isArray(rows) && rows.length > 0) {
      const valid = rows
        .map((r: { email?: string }) => String(r.email || '').toLowerCase().trim())
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      if (valid.length > 0) {
        return Array.from(new Set(valid)).slice(0, 7);
      }
    }
  } catch (err) {
    console.warn('[emailService] Could not load from admin_dispatch_recipients:', err);
  }

  return [];
}

/**
 * Returns the FULL consolidated list of recipients for the dispatch order notification:
 * ALWAYS includes:
 * 1. Master Administrator (admin@lumina.com)
 * 2. All active secondary administrators (admin_invitations)
 * PLUS:
 * 3. Up to 7 extra external dispatch emails (warehouse, packing, logistics)
 */
export async function getAllDispatchRecipients(extraEmails?: string[]): Promise<string[]> {
  const [adminEmails, configuredExtras] = await Promise.all([
    getAllAdminEmails(),
    extraEmails && extraEmails.length > 0 ? Promise.resolve(extraEmails) : getExtraDispatchRecipientEmails(),
  ]);

  const combined = new Set<string>();

  // 1. All administrators ALWAYS receive dispatch orders
  for (const adm of adminEmails) {
    if (adm && adm.includes('@')) {
      combined.add(adm.toLowerCase().trim());
    }
  }

  // 2. Up to 7 extra external dispatch emails receive it as well
  for (const ext of configuredExtras) {
    if (ext && ext.includes('@')) {
      combined.add(ext.toLowerCase().trim());
    }
  }

  return Array.from(combined);
}

/**
 * Backwards compatibility alias for getAllDispatchRecipients
 */
export async function getDispatchRecipientEmails(): Promise<string[]> {
  return getAllDispatchRecipients();
}

export const IS_SMTP_SECURE_ENFORCED =
  (process.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';

/**
 * Creates the nodemailer transporter or returns null if credentials are not configured.
 * Enforces SMTP_SECURE=true from root (TLS 1.2+ mandatory encryption & certificate validation).
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const isExplicitSecure = IS_SMTP_SECURE_ENFORCED;
  // Port 465 uses implicit SSL/TLS from byte 0; port 587 uses mandatory STARTTLS upgrade via requireTLS: true
  const secure = port === 465 || (isExplicitSecure && port !== 587 && port !== 2525);

  if (!host || !user || !pass) {
    return null;
  }

  // Active TLS / SSL Hardening configuration enforced from root
  const tlsConfig = {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2' as const,
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:HIGH:!aNULL:!eNULL:!RC4:!MD5',
  };

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: isExplicitSecure, // Enforce TLS negotiation from root; reject plaintext connections
    tls: tlsConfig,
    auth: {
      user,
      pass,
    },
  });
}

function cleanPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');
  // Formato Ecuador: celulares empiezan con 09 (10 dígitos). Convertir a formato internacional 5939...
  if (digits.startsWith('09') && digits.length === 10) {
    digits = '593' + digits.slice(1);
  } else if (digits.startsWith('59309') && digits.length === 13) {
    digits = '593' + digits.slice(4);
  } else if (digits.length === 9 && digits.startsWith('9')) {
    digits = '593' + digits;
  }
  return digits;
}

export interface OrderEmailNotificationRecord {
  id: string;
  order_id: string;
  recipient_email: string;
  recipient_name?: string | null;
  recipient_type: 'customer' | 'admin';
  email_type: 'customer_invoice' | 'admin_dispatch_notice' | 'order_status_update';
  subject: string;
  status: 'sent' | 'failed' | 'simulated_dev';
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  sent_at: string;
}

/**
 * Inserta un registro auditable en la tabla dedicada public.order_email_notifications
 */
export async function logEmailNotification({
  orderId,
  recipientEmail,
  recipientName,
  recipientType,
  emailType,
  subject,
  status,
  errorMessage,
  metadata = {},
}: {
  orderId: string;
  recipientEmail: string;
  recipientName?: string;
  recipientType: 'customer' | 'admin';
  emailType: 'customer_invoice' | 'admin_dispatch_notice' | 'order_status_update';
  subject: string;
  status: 'sent' | 'failed' | 'simulated_dev';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseServer.from('order_email_notifications').insert({
      order_id: orderId,
      recipient_email: recipientEmail.toLowerCase().trim(),
      recipient_name: recipientName || null,
      recipient_type: recipientType,
      email_type: emailType,
      subject,
      status,
      error_message: errorMessage || null,
      metadata,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    // Si la tabla aún no fue creada en Supabase, registrar aviso sin interrumpir el flujo
    console.warn('[emailService] Aviso: no se pudo insertar en order_email_notifications:', err);
  }
}

/**
 * Consulta el historial de notificaciones por correo para una orden específica
 */
export async function getOrderEmailLogs(orderId: string): Promise<OrderEmailNotificationRecord[]> {
  try {
    const { data, error } = await supabaseServer
      .from('order_email_notifications')
      .select('*')
      .eq('order_id', orderId)
      .order('sent_at', { ascending: false });

    if (error) return [];
    return (data as OrderEmailNotificationRecord[]) || [];
  } catch {
    return [];
  }
}

/**
 * Generates the Customer Invoice HTML template
 */
export function generateCustomerInvoiceHtml(order: OrderEmailData): string {
  const orderId = order.id || 'N/A';
  const customerName = order.customerName || order.recipient || order.shippingAddress?.recipient || 'Cliente Exclusivo';
  const idNumber = order.customerIdNumber || order.shippingAddress?.idNumber || 'Consumidor Final';
  const phone = order.customerPhone || order.shippingAddress?.phone || '+593 99 876 5432';
  const email = order.customerEmail || order.shippingAddress?.email || 'N/A';
  const addr = order.shippingAddress;
  const formattedAddress = addr
    ? `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}, ${addr.country || 'Ecuador'}`.replace(/^,\s*|,\s*$/g, '')
    : 'Quito, Pichincha, Ecuador';
  const total = Number(order.total || 0).toFixed(2);
  const paymentMethod = order.paymentMethod || 'PayPhone (Tarjetas Visa / MasterCard)';
  const dateStr = order.date || new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: '2-digit' });
  const timeStr = order.time || new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  const invoiceNum = orderId.toUpperCase().replace(/^ORD-?/, 'INV-');

  let rawSubtotal = 0;
  const itemsRows = (order.items || []).map((item, idx) => {
    const title = item.product?.title || `Pieza de Colección Lumina`;
    const price = Number(item.product?.price || 0);
    const qty = item.quantity || 1;
    const subtotal = price * qty;
    rawSubtotal += subtotal;
    const numStr = String(idx + 1).padStart(2, '0');
    const colorText = item.color ? `Color: ${item.color} • ` : '';

    return `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #e7e5e4;text-align:center;font-family:monospace;font-size:12px;color:#78716c;vertical-align:top;">
          ${numStr}
        </td>
        <td style="padding:12px 12px;border-bottom:1px solid #e7e5e4;vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#1c1917;line-height:1.4;">${title}</div>
          <div style="font-size:11px;color:#78716c;font-style:italic;font-family:Georgia,serif;margin-top:2px;">
            ${colorText}Colección Exclusiva Lumina Home
          </div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #e7e5e4;text-align:center;font-size:12px;color:#44403c;font-family:monospace;vertical-align:top;">
          ${qty}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #e7e5e4;text-align:right;font-size:12px;color:#44403c;font-family:monospace;vertical-align:top;">
          $${price.toFixed(2)}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #e7e5e4;text-align:right;font-size:13px;font-weight:700;color:#1c1917;font-family:monospace;vertical-align:top;">
          $${subtotal.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const finalSubtotal = rawSubtotal > 0 ? rawSubtotal : Number(order.total || 0);
  const tax = (finalSubtotal * 0.15).toFixed(2);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Oficial #${invoiceNum} - Lumina Home</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Document Sheet -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.08);border:1px solid #e4e4e7;">
          
          <!-- Hanging Header Stripe -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:20px;font-weight:900;letter-spacing:3px;color:#ffffff;text-transform:uppercase;">
                      LUMINA <span style="font-weight:300;color:#d4d4d8;">HOME</span>
                    </div>
                    <div style="font-size:10px;color:#a1a1aa;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">
                      Ecuador • Facturación Electrónica SRI
                    </div>
                  </td>
                  <td style="text-align:right;">
                    <div style="display:inline-block;padding:4px 12px;background-color:#27272a;border:1px solid #3f3f46;color:#e4e4e7;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:1px;font-family:monospace;">
                      ${invoiceNum}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Metadata Grid: Billed To & Invoice Details -->
          <tr>
            <td style="padding:28px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- BILLED TO -->
                  <td style="vertical-align:top;width:55%;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#71717a;margin-bottom:4px;">
                      BILLED TO:
                    </div>
                    <div style="font-size:14px;font-weight:800;color:#18181b;">
                      ${customerName}
                    </div>
                    <div style="font-size:11px;color:#52525b;margin-top:2px;">
                      C.I. / R.U.C.: <span style="font-family:monospace;color:#27272a;">${idNumber}</span>
                    </div>
                    <div style="font-size:11px;color:#52525b;margin-top:2px;">
                      ${formattedAddress}
                    </div>
                    <div style="font-size:11px;color:#52525b;margin-top:2px;font-family:monospace;">
                      ${phone} • ${email}
                    </div>
                  </td>

                  <!-- INVOICE DETAILS -->
                  <td style="vertical-align:top;width:45%;text-align:right;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#18181b;">
                      INVOICE #${invoiceNum}
                    </div>
                    <div style="font-size:11px;color:#52525b;margin-top:4px;">
                      <strong style="color:#27272a;">DATE:</strong> ${dateStr} (${timeStr})
                    </div>
                    <div style="font-size:11px;color:#52525b;margin-top:2px;">
                      <strong style="color:#27272a;">DUE DATE:</strong> CONTADO / INMEDIATO
                    </div>
                    <div style="font-size:11px;color:#52525b;margin-top:2px;">
                      <strong style="color:#27272a;">ESTADO:</strong> <span style="color:#047857;font-weight:700;">APROBADO &amp; PAGADO</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:12px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="border-top:1.5px solid #18181b;border-bottom:1.5px solid #18181b;background-color:#fafafa;">
                    <th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:800;letter-spacing:1px;color:#18181b;width:32px;">NO</th>
                    <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;letter-spacing:1px;color:#18181b;">DESCRIPTION</th>
                    <th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:800;letter-spacing:1px;color:#18181b;width:48px;">QTY</th>
                    <th style="padding:8px 8px;text-align:right;font-size:10px;font-weight:800;letter-spacing:1px;color:#18181b;width:72px;">RATE</th>
                    <th style="padding:8px 8px;text-align:right;font-size:10px;font-weight:800;letter-spacing:1px;color:#18181b;width:80px;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Subtotals Section -->
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%"></td>
                  <td width="50%">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:#52525b;">
                      <tr>
                        <td style="padding:3px 0;">Sub Total:</td>
                        <td style="padding:3px 0;text-align:right;font-family:monospace;color:#18181b;">$${finalSubtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;">IVA (15% Ecuador):</td>
                        <td style="padding:3px 0;text-align:right;font-family:monospace;color:#18181b;">$${tax}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;">Envío Nacional Asegurado:</td>
                        <td style="padding:3px 0;text-align:right;font-family:monospace;color:#047857;font-weight:700;">GRATIS</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 2px 0;font-size:15px;font-weight:900;color:#18181b;border-top:2px solid #18181b;">TOTAL:</td>
                        <td style="padding:10px 0 2px 0;text-align:right;font-size:18px;font-weight:900;color:#18181b;border-top:2px solid #18181b;font-family:monospace;">$${total}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer: Bank Details & Cursive Thank You (NO pen, NO signature) -->
          <tr>
            <td style="padding:20px 32px 28px 32px;border-top:1px solid #e4e4e7;background-color:#fafafa;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Bank Details -->
                  <td style="vertical-align:bottom;width:55%;">
                    <div style="font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#71717a;margin-bottom:3px;">
                      BANK / PAYMENT DETAILS
                    </div>
                    <div style="font-size:11px;font-weight:600;color:#27272a;">
                      ${paymentMethod}
                    </div>
                    <div style="font-size:10px;color:#71717a;margin-top:2px;">
                      Referencia SRI: 05102026011792348912001200100100000421234567819
                    </div>
                  </td>

                  <!-- Cursive Script Thank you! -->
                  <td style="vertical-align:bottom;width:45%;text-align:right;">
                    <div style="font-family:'Brush Script MT','Dancing Script','Caveat','Segoe Script',cursive,sans-serif;font-size:32px;color:#18181b;line-height:1;margin-bottom:4px;">
                      Thank you!
                    </div>
                    <div style="font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#3f3f46;">
                      WE APPRECIATE YOUR BUSINESS.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Microcopy -->
          <tr>
            <td style="background-color:#18181b;padding:12px 32px;text-align:center;">
              <div style="font-size:10px;color:#a1a1aa;letter-spacing:0.5px;">
                Lumina Home Ecuador S.A.S. · Av. Shyris &amp; Portugal, Edif. Metropolitan, Piso 12, Quito · www.luminahome.ec
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generates the Store Admin Dispatch Notification HTML template
 */
export function generateAdminDispatchNoticeHtml(order: OrderEmailData): string {
  const orderId = order.id || 'N/A';
  const customerName = order.customerName || order.recipient || 'Cliente';
  const recipient = order.recipient || order.shippingAddress?.recipient || customerName;
  const idNumber = order.customerIdNumber || order.shippingAddress?.idNumber || 'No especificada';
  const phone = order.customerPhone || order.shippingAddress?.phone || '';
  const email = order.customerEmail || order.shippingAddress?.email || 'N/A';
  const addr = order.shippingAddress;
  const formattedAddress = addr
    ? `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}, ${addr.country || 'Ecuador'}`.replace(/^,\s*|,\s*$/g, '')
    : 'Retiro o dirección estándar';
  const total = Number(order.total || 0).toFixed(2);
  const paymentMethod = order.paymentMethod || 'Tarjeta de Crédito / Débito';
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const waText = encodeURIComponent(`Hola ${recipient}, te contactamos de ${brandConfig.name} respecto a tu orden #${orderId}.`);
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : '';

  const itemsRows = (order.items || []).map((item) => {
    const title = item.product?.title || `Pieza ${brandConfig.shortName}`;
    const price = Number(item.product?.price || 0).toFixed(2);
    const qty = item.quantity || 1;
    const subtotal = (Number(item.product?.price || 0) * qty).toFixed(2);
    const image = item.product?.imageUrl || '';
    const colorBadge = item.color ? `<span style="display:inline-block;padding:2px 8px;font-size:11px;background-color:#fef3c7;color:#92400e;border-radius:12px;margin-top:4px;font-weight:600;">Color: ${item.color}</span>` : '';

    return `
      <tr>
        <td style="padding:14px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${image ? `<td style="width:50px;padding-right:10px;vertical-align:middle;"><img src="${image}" alt="${title}" width="50" height="50" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:1px solid #cbd5e1;display:block;" /></td>` : ''}
              <td style="vertical-align:middle;">
                <div style="font-size:13px;font-weight:700;color:#0f172a;">${title}</div>
                ${colorBadge}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:15px;font-weight:700;color:#0f172a;vertical-align:middle;">
          <span style="display:inline-block;padding:4px 10px;background-color:#dbeafe;color:#1e40af;border-radius:8px;">${qty} ud.</span>
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;color:#475569;vertical-align:middle;">
          $${price}
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px;font-weight:700;color:#0f172a;vertical-align:middle;">
          $${subtotal}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ALERTA DE DESPACHO - Orden #${orderId}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
          
          <!-- Top Alert Bar -->
          <tr>
            <td style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);padding:28px 36px;border-bottom:4px solid #10b981;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display:inline-block;padding:4px 10px;background-color:#10b981;color:#ffffff;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-radius:6px;margin-bottom:8px;">
                      NUEVO PEDIDO CONFIRMADO
                    </div>
                    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">
                      Alerta Operativa de Despacho
                    </div>
                    <div style="font-size:13px;color:#94a3b8;margin-top:2px;">
                      Orden: <strong style="color:#ffffff;">#${orderId}</strong> · Estado: <strong style="color:#ffffff;">Procesando (Asignar Guía al Enviar)</strong>
                    </div>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <div style="font-size:24px;font-weight:800;color:#10b981;">
                      $${total}
                    </div>
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;">
                      ${paymentMethod}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 36px;">
              
              <!-- Quick WhatsApp Direct Action -->
              ${cleanPhone ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:16px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <div style="font-size:13px;font-weight:700;color:#166534;">
                            Contacto directo con el Cliente
                          </div>
                          <div style="font-size:12px;color:#15803d;margin-top:2px;">
                            ${recipient} · ${phone}
                          </div>
                        </td>
                        <td style="text-align:right;">
                          <a href="${waUrl}" target="_blank" style="display:inline-block;padding:10px 18px;background-color:#22c55e;color:#ffffff;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;box-shadow:0 2px 8px rgba(34,197,94,0.3);">
                            📲 Abrir WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Customer & Delivery Logistics Card -->
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#334155;margin-bottom:12px;">
                Ficha del Destinatario &amp; Entrega
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.6;color:#334155;">
                      <tr>
                        <td style="width:160px;font-weight:600;color:#64748b;padding-bottom:6px;">Nombre del Cliente:</td>
                        <td style="font-weight:700;color:#0f172a;padding-bottom:6px;">${customerName}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;color:#64748b;padding-bottom:6px;">¿Quién recibe?:</td>
                        <td style="font-weight:700;color:#0f172a;padding-bottom:6px;">${recipient}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;color:#64748b;padding-bottom:6px;">Cédula / Identificación:</td>
                        <td style="font-weight:700;color:#0f172a;padding-bottom:6px;">${idNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;color:#64748b;padding-bottom:6px;">Teléfono WhatsApp:</td>
                        <td style="font-weight:700;color:#0f172a;padding-bottom:6px;">${phone || 'No registrado'}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;color:#64748b;padding-bottom:6px;">Correo Electrónico:</td>
                        <td style="font-weight:600;color:#2563eb;padding-bottom:6px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;color:#64748b;vertical-align:top;">Dirección de Entrega:</td>
                        <td style="font-weight:700;color:#0f172a;">${formattedAddress}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Packing Checklist / Order Items -->
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#334155;margin-bottom:12px;">
                Checklist de Empaque (${order.items?.length || 0} productos)
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f1f5f9;">
                    <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;">Ítem</th>
                    <th style="padding:8px 10px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;">Cantidad</th>
                    <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;">P. Unit</th>
                    <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Total Banner -->
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 20px;text-align:right;margin-bottom:24px;">
                <span style="font-size:13px;color:#64748b;font-weight:600;margin-right:12px;">Total Cobrado:</span>
                <span style="font-size:20px;font-weight:800;color:#0f172a;">$${total}</span>
              </div>

              <!-- Next Action Notice -->
              <div style="font-size:12px;color:#64748b;line-height:1.5;background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:12px 16px;">
                ⚠️ <strong>Paso operativo:</strong> Una vez preparado y rotulado el paquete con la transportadora, ingresar al panel de administración para registrar el código y enlace de rastreo al cambiar el estado a <em>"Enviado"</em>.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 36px;text-align:center;border-top:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#94a3b8;">
                Panel de Administración ${brandConfig.name} · Notificación Automática de Despacho
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Dispatches both Customer Invoice and Store Admin Dispatch emails.
 * Never throws an unhandled error so checkout execution is completely safe.
 * Stores auditable logs in public.order_email_notifications.
 */
export async function sendOrderEmails({
  order,
  adminEmails,
}: {
  order: OrderEmailData;
  adminEmails?: string[];
}): Promise<{ success: boolean; customerSent: boolean; adminsSent: boolean; mocked?: boolean }> {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || `${brandConfig.name} <${brandConfig.contact.supportEmail}>`;

    const customerEmail = order.customerEmail || order.shippingAddress?.email;
    const customerName = order.customerName || order.recipient || 'Cliente';
    // Guarantees ALL store administrators + up to 7 extra dispatch emails always receive the notice
    const resolvedDispatchRecipients = await getAllDispatchRecipients(adminEmails);

    const customerSubject = `🧾 Factura Digital y Confirmación de Pedido #${order.id} - ${brandConfig.name}`;
    const adminSubject = `📦 [DESPACHO INMEDIATO] Nueva Orden #${order.id} - ${customerName} · Total: $${Number(order.total || 0).toFixed(2)}`;

    const customerHtml = generateCustomerInvoiceHtml(order);
    const adminHtml = generateAdminDispatchNoticeHtml(order);

    if (!transporter) {
      console.log('----------------------------------------------------');
      console.log('📦 [emailService - SIMULATED MODE] SMTP no configurado en entorno local.');
      console.log(`✉️ Factura registrada para Cliente: ${customerEmail || '(Sin correo de cliente)'}`);
      console.log(`✉️ Alerta de Despacho registrada para Receptores: ${resolvedDispatchRecipients.join(', ')}`);
      console.log(`📋 Orden: #${order.id} | Total: $${Number(order.total || 0).toFixed(2)} | Cédula: ${order.customerIdNumber || 'N/A'}`);
      console.log('----------------------------------------------------');

      // 1. Registrar simulación de Factura para el Cliente
      if (customerEmail && customerEmail.includes('@')) {
        await logEmailNotification({
          orderId: order.id,
          recipientEmail: customerEmail,
          recipientName: customerName,
          recipientType: 'customer',
          emailType: 'customer_invoice',
          subject: customerSubject,
          status: 'simulated_dev',
          metadata: {
            mode: 'simulated_dev',
            total: order.total,
            itemsCount: order.items?.length || 0,
            note: 'SMTP no configurado en entorno local. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en Vercel para envío real.'
          }
        });
      }

      // 2. Registrar simulación de Alerta de Despacho para cada Receptor
      for (const admEmail of resolvedDispatchRecipients) {
        await logEmailNotification({
          orderId: order.id,
          recipientEmail: admEmail,
          recipientName: 'Receptor de Despacho',
          recipientType: 'admin',
          emailType: 'admin_dispatch_notice',
          subject: adminSubject,
          status: 'simulated_dev',
          metadata: {
            mode: 'simulated_dev',
            total: order.total,
            itemsCount: order.items?.length || 0,
            note: 'SMTP no configurado en entorno local.'
          }
        });
      }

      return { success: true, customerSent: true, adminsSent: true, mocked: true };
    }

    let customerSent = false;
    let adminsSent = false;

    // 1. Envío de Factura al Cliente
    if (customerEmail && customerEmail.includes('@')) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: customerEmail,
          subject: customerSubject,
          html: customerHtml,
        });
        customerSent = true;
        await logEmailNotification({
          orderId: order.id,
          recipientEmail: customerEmail,
          recipientName: customerName,
          recipientType: 'customer',
          emailType: 'customer_invoice',
          subject: customerSubject,
          status: 'sent',
          metadata: { from: fromAddress, total: order.total }
        });
      } catch (custErr: unknown) {
        const errorMsg = custErr instanceof Error ? custErr.message : String(custErr);
        console.error('[emailService] Error enviando factura al cliente:', custErr);
        await logEmailNotification({
          orderId: order.id,
          recipientEmail: customerEmail,
          recipientName: customerName,
          recipientType: 'customer',
          emailType: 'customer_invoice',
          subject: customerSubject,
          status: 'failed',
          errorMessage: errorMsg,
        });
      }
    }

    // 2. Envío Concurrente de Alertas de Despacho a Receptores Autorizados (Elimina bloqueo secuencial)
    if (resolvedDispatchRecipients.length > 0) {
      const dispatchResults = await Promise.allSettled(
        resolvedDispatchRecipients.map(async (admEmail) => {
          try {
            await transporter.sendMail({
              from: fromAddress,
              to: admEmail,
              subject: adminSubject,
              html: adminHtml,
            });
            await logEmailNotification({
              orderId: order.id,
              recipientEmail: admEmail,
              recipientName: 'Receptor de Despacho',
              recipientType: 'admin',
              emailType: 'admin_dispatch_notice',
              subject: adminSubject,
              status: 'sent',
              metadata: { from: fromAddress, total: order.total },
            });
            return true;
          } catch (adminErr: unknown) {
            const errorMsg = adminErr instanceof Error ? adminErr.message : String(adminErr);
            console.error(`[emailService] Error enviando alerta a receptor (${admEmail}):`, adminErr);
            await logEmailNotification({
              orderId: order.id,
              recipientEmail: admEmail,
              recipientName: 'Receptor de Despacho',
              recipientType: 'admin',
              emailType: 'admin_dispatch_notice',
              subject: adminSubject,
              status: 'failed',
              errorMessage: errorMsg,
            });
            return false;
          }
        })
      );

      adminsSent = dispatchResults.some(r => r.status === 'fulfilled' && r.value === true);
    }

    return { success: true, customerSent, adminsSent };
  } catch (error) {
    console.error('[emailService] Fatal error in sendOrderEmails:', error);
    return { success: false, customerSent: false, adminsSent: false };
  }
}

/**
 * Reenvía manualmente la factura del cliente o la alerta de despacho administrativo
 */
export async function resendOrderEmail({
  orderId,
  emailType,
  targetEmail,
}: {
  orderId: string;
  emailType: 'customer_invoice' | 'admin_dispatch_notice';
  targetEmail?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { data: orderRow, error: orderErr } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !orderRow) {
      return { success: false, message: `No se encontró la orden #${orderId}` };
    }

    const mappedOrder: OrderEmailData = {
      id: orderRow.id,
      trackingNumber: orderRow.tracking_number,
      customerName: orderRow.customer_name,
      customerEmail: orderRow.customer_email,
      customerIdNumber: orderRow.customer_id_number,
      customerPhone: orderRow.customer_phone,
      recipient: orderRow.recipient,
      paymentMethod: orderRow.payment_method,
      total: Number(orderRow.total) || 0,
      items: Array.isArray(orderRow.items) ? orderRow.items : [],
      shippingAddress: orderRow.shipping_address,
      date: orderRow.created_at ? new Date(orderRow.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
      time: orderRow.created_at ? new Date(orderRow.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : undefined,
    };

    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || `${brandConfig.name} <${brandConfig.contact.supportEmail}>`;

    if (emailType === 'customer_invoice') {
      const recipient = targetEmail || mappedOrder.customerEmail || mappedOrder.shippingAddress?.email;
      if (!recipient || !recipient.includes('@')) {
        return { success: false, message: 'La orden no tiene un correo de cliente válido configurado.' };
      }
      const subject = `🧾 Factura Digital y Confirmación de Pedido #${mappedOrder.id} - ${brandConfig.name}`;
      const html = generateCustomerInvoiceHtml(mappedOrder);

      if (!transporter) {
        await logEmailNotification({
          orderId: mappedOrder.id,
          recipientEmail: recipient,
          recipientName: mappedOrder.customerName,
          recipientType: 'customer',
          emailType: 'customer_invoice',
          subject: `${subject} [Reenvío]`,
          status: 'simulated_dev',
          metadata: { isResend: true, mode: 'simulated_dev' }
        });
        return { success: true, message: `Factura simulada registrada para ${recipient} (Modo Local sin SMTP).` };
      }

      await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject,
        html,
      });

      await logEmailNotification({
        orderId: mappedOrder.id,
        recipientEmail: recipient,
        recipientName: mappedOrder.customerName,
        recipientType: 'customer',
        emailType: 'customer_invoice',
        subject,
        status: 'sent',
        metadata: { isResend: true, from: fromAddress }
      });

      return { success: true, message: `Factura reenviada exitosamente a ${recipient}.` };
    }

    if (emailType === 'admin_dispatch_notice') {
      const recipientList = targetEmail ? [targetEmail] : await getAllDispatchRecipients();
      if (recipientList.length === 0) {
        return { success: false, message: 'No hay correos de despacho o administradores configurados.' };
      }
      const subject = `📦 [DESPACHO INMEDIATO] Nueva Orden #${mappedOrder.id} - ${mappedOrder.customerName || 'Cliente'} · Total: $${Number(mappedOrder.total).toFixed(2)}`;
      const html = generateAdminDispatchNoticeHtml(mappedOrder);

      if (!transporter) {
        for (const adm of recipientList) {
          await logEmailNotification({
            orderId: mappedOrder.id,
            recipientEmail: adm,
            recipientName: 'Administrador',
            recipientType: 'admin',
            emailType: 'admin_dispatch_notice',
            subject: `${subject} [Reenvío]`,
            status: 'simulated_dev',
            metadata: { isResend: true, mode: 'simulated_dev' }
          });
        }
        return { success: true, message: `Alerta de despacho simulada para ${recipientList.join(', ')} (Modo Local).` };
      }

      for (const adm of recipientList) {
        await transporter.sendMail({
          from: fromAddress,
          to: adm,
          subject,
          html,
        });

        await logEmailNotification({
          orderId: mappedOrder.id,
          recipientEmail: adm,
          recipientName: 'Administrador',
          recipientType: 'admin',
          emailType: 'admin_dispatch_notice',
          subject,
          status: 'sent',
          metadata: { isResend: true, from: fromAddress }
        });
      }

      return { success: true, message: `Alerta de despacho reenviada a ${recipientList.join(', ')}.` };
    }

    return { success: false, message: 'Tipo de correo no reconocido.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al reenviar el correo.';
    return { success: false, message: msg };
  }
}

/**
 * Tests an SMTP connection and sends a test email
 */
export async function verifyAndSendTestEmail({
  host,
  port,
  secure,
  user,
  pass,
  from,
  recipientEmail,
}: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  recipientEmail: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const finalHost = host || process.env.SMTP_HOST;
    const finalUser = user || process.env.SMTP_USER;
    const finalPass = pass || process.env.SMTP_PASS;
    const finalPort = Number(port || process.env.SMTP_PORT) || 587;
    const isExplicitSecure = secure !== undefined ? secure : IS_SMTP_SECURE_ENFORCED;
    const finalSecure = finalPort === 465 || (isExplicitSecure && finalPort !== 587 && finalPort !== 2525);
    const finalFrom = from || process.env.SMTP_FROM || `${brandConfig.name} <${finalUser || brandConfig.contact.supportEmail}>`;

    if (!finalHost || !finalUser || !finalPass) {
      return {
        success: false,
        message: 'Faltan variables SMTP requeridas (SMTP_HOST, SMTP_USER o SMTP_PASS). Configúralas en Vercel para activar el envío real.',
      };
    }

    const tlsConfig = {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2' as const,
      ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:HIGH:!aNULL:!eNULL:!RC4:!MD5',
    };

    const transporter = nodemailer.createTransport({
      host: finalHost,
      port: finalPort,
      secure: finalSecure,
      requireTLS: isExplicitSecure,
      tls: tlsConfig,
      auth: {
        user: finalUser,
        pass: finalPass,
      },
    });

    // 1. Verify handshake
    await transporter.verify();

    // 2. Send test email
    const now = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' });
    const tlsStatusText = isExplicitSecure || finalSecure
      ? '✅ TLS 1.2+ Cifrado Estricto Forzado (SMTP_SECURE=true)'
      : '⚠️ TLS Opcional / Estándar';

    await transporter.sendMail({
      from: finalFrom,
      to: recipientEmail,
      subject: `✅ Conexión SMTP Segura - ${brandConfig.name}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
          <div style="background:#0f172a;padding:24px;border-radius:14px;color:#ffffff;margin-bottom:24px;">
            <div style="font-size:20px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">${brandConfig.name}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Prueba de Servidor SMTP con Cifrado Criptográfico</div>
          </div>
          <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:12px;">¡Tu servidor de correos está protegido y cifrado!</div>
          <p style="font-size:14px;color:#475569;line-height:1.6;margin-bottom:20px;">
            Este es un correo de prueba enviado desde el panel de administración de <strong>${brandConfig.name}</strong>. Se ha verificado que todas las conexiones de correo saliente viajan en un túnel TLS seguro.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;font-size:13px;color:#334155;margin-bottom:24px;">
            <div><strong>Servidor Host:</strong> ${finalHost}</div>
            <div style="margin-top:6px;"><strong>Puerto:</strong> ${finalPort}</div>
            <div style="margin-top:6px;"><strong>Seguridad Criptográfica:</strong> ${tlsStatusText}</div>
            <div style="margin-top:6px;"><strong>Remitente:</strong> ${finalFrom}</div>
            <div style="margin-top:6px;"><strong>Fecha de Prueba:</strong> ${now}</div>
          </div>
          <div style="font-size:12px;color:#64748b;text-align:center;border-top:1px solid #f1f5f9;padding-top:16px;">
            ${brandConfig.name} · ${brandConfig.tagline}
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: `¡Conexión verificada exitosamente! Correo de prueba enviado a ${recipientEmail}.`,
    };
  } catch (error: unknown) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    let friendly = rawMsg;
    if (rawMsg.includes('535') || rawMsg.includes('BadCredentials') || rawMsg.includes('Username and Password not accepted')) {
      friendly = 'Error de autenticación (535): Google rechazó el usuario o la contraseña. Asegúrate de usar una Contraseña de Aplicación de 16 caracteres generada en Google (no tu contraseña personal de Gmail).';
    } else if (rawMsg.includes('ETIMEDOUT') || rawMsg.includes('ECONNREFUSED')) {
      friendly = `Tiempo de espera agotado al conectar con el servidor SMTP (${rawMsg}). Verifica el puerto (587 o 465) y el host.`;
    }
    return {
      success: false,
      message: friendly,
    };
  }
}

