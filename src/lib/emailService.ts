import nodemailer from 'nodemailer';
import { supabaseServer, MASTER_ADMIN_EMAIL } from './serverAuth';

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
    const { data: sysRow } = await supabaseServer
      .from('active_sessions')
      .select('email')
      .eq('user_id', 'SYS_ADMIN_INVITES')
      .maybeSingle();

    if (sysRow?.email) {
      const parsed = JSON.parse(sysRow.email);
      if (Array.isArray(parsed)) {
        parsed.forEach((e: unknown) => {
          if (typeof e === 'string' && e.includes('@')) {
            admins.add(e.toLowerCase().trim());
          }
        });
      }
    }
  } catch (err) {
    console.warn('[emailService] Could not load invited admins, using default:', err);
  }

  return Array.from(admins);
}

/**
 * Creates the nodemailer transporter or returns null if credentials are not configured
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function cleanPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Generates the Customer Invoice HTML template
 */
export function generateCustomerInvoiceHtml(order: OrderEmailData): string {
  const orderId = order.id || 'N/A';
  const trackingNumber = order.trackingNumber || 'En asignación';
  const customerName = order.customerName || order.recipient || 'Estimado Cliente';
  const recipient = order.recipient || order.shippingAddress?.recipient || customerName;
  const idNumber = order.customerIdNumber || order.shippingAddress?.idNumber || 'No especificada';
  const phone = order.customerPhone || order.shippingAddress?.phone || 'No especificado';
  const email = order.customerEmail || order.shippingAddress?.email || 'N/A';
  const addr = order.shippingAddress;
  const formattedAddress = addr
    ? `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}, ${addr.country || 'Ecuador'}`.replace(/^,\s*|,\s*$/g, '')
    : 'Retiro o entrega estándar';
  const total = Number(order.total || 0).toFixed(2);
  const paymentMethod = order.paymentMethod || 'Tarjeta de Crédito / Débito';
  const dateStr = order.date || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = order.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const itemsRows = (order.items || []).map((item) => {
    const title = item.product?.title || 'Producto Lumina';
    const price = Number(item.product?.price || 0).toFixed(2);
    const qty = item.quantity || 1;
    const subtotal = (Number(item.product?.price || 0) * qty).toFixed(2);
    const image = item.product?.imageUrl || '';
    const colorBadge = item.color ? `<span style="display:inline-block;padding:2px 8px;font-size:11px;background-color:#f1f5f9;color:#475569;border-radius:12px;margin-top:4px;">Color: ${item.color}</span>` : '';

    return `
      <tr>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${image ? `<td style="width:56px;padding-right:12px;vertical-align:middle;"><img src="${image}" alt="${title}" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;display:block;" /></td>` : ''}
              <td style="vertical-align:middle;">
                <div style="font-size:14px;font-weight:600;color:#0f172a;line-height:1.3;">${title}</div>
                ${colorBadge}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:14px;color:#475569;vertical-align:middle;">
          ${qty}
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;color:#475569;vertical-align:middle;">
          $${price}
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:700;color:#0f172a;vertical-align:middle;">
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
  <title>Factura de Compra #${orderId}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:40px 36px;text-align:left;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:24px;font-weight:800;letter-spacing:1.5px;color:#ffffff;text-transform:uppercase;">
                      LUMINA <span style="color:#8c9276;font-weight:300;">HOME</span>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">
                      Confirmación de Compra &amp; Factura Digital
                    </div>
                  </td>
                  <td style="text-align:right;">
                    <span style="display:inline-block;padding:6px 14px;background-color:rgba(140,146,118,0.25);border:1px solid rgba(140,146,118,0.5);color:#d1d5db;border-radius:999px;font-size:12px;font-weight:600;">
                      Orden #${orderId}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:36px;">
              
              <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px;">
                ¡Gracias por tu compra, ${customerName}!
              </div>
              <div style="font-size:14px;color:#64748b;line-height:1.5;margin-bottom:28px;">
                Hemos recibido tu pedido con éxito y ya se encuentra en nuestro centro logístico para ser preparado con el mayor cuidado y excelencia. A continuación tienes el detalle de tu factura.
              </div>

              <!-- Tracking Badge Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;border-radius:16px;margin-bottom:32px;">
                <tr>
                  <td style="padding:18px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;">Número de Seguimiento</div>
                          <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:2px;">${trackingNumber}</div>
                        </td>
                        <td style="text-align:right;">
                          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;">Fecha de Emisión</div>
                          <div style="font-size:13px;font-weight:600;color:#0f172a;margin-top:2px;">${dateStr} (${timeStr})</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#334155;margin-bottom:12px;">
                Productos Adquiridos
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f8fafc;">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Producto</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Cant.</th>
                    <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Precio</th>
                    <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Financial Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td width="50%"></td>
                  <td width="50%">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#475569;">
                      <tr>
                        <td style="padding:4px 0;">Método de Pago:</td>
                        <td style="padding:4px 0;text-align:right;font-weight:600;color:#0f172a;">${paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">Envío Asegurado:</td>
                        <td style="padding:4px 0;text-align:right;font-weight:600;color:#10b981;">Gratis</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 4px 0;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #e2e8f0;">Total Facturado:</td>
                        <td style="padding:12px 0 4px 0;text-align:right;font-size:20px;font-weight:800;color:#0f172a;border-top:2px solid #e2e8f0;">$${total}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Delivery & Customer Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:16px;margin-bottom:32px;">
                <tr>
                  <td style="padding:22px;">
                    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#44403c;margin-bottom:14px;">
                      Datos de Entrega &amp; Facturación
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#57534e;line-height:1.6;">
                      <tr>
                        <td style="padding-bottom:6px;width:150px;font-weight:600;">¿Quién recibe?:</td>
                        <td style="padding-bottom:6px;color:#1c1917;font-weight:600;">${recipient}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:6px;font-weight:600;">Cédula / Identificación:</td>
                        <td style="padding-bottom:6px;color:#1c1917;">${idNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:6px;font-weight:600;">WhatsApp / Teléfono:</td>
                        <td style="padding-bottom:6px;color:#1c1917;">${phone}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:6px;font-weight:600;">Correo Notificaciones:</td>
                        <td style="padding-bottom:6px;color:#1c1917;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600;vertical-align:top;">Dirección de Entrega:</td>
                        <td style="color:#1c1917;">${formattedAddress}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Support Footer Message -->
              <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px 20px;text-align:center;">
                <div style="font-size:13px;font-weight:600;color:#1e40af;">
                  ¿Tienes dudas o necesitas asistencia con tu entrega?
                </div>
                <div style="font-size:12px;color:#3b82f6;margin-top:4px;">
                  Nuestro equipo de atención al cliente está siempre a tu disposición en <a href="mailto:soporte@lumina.com" style="color:#1d4ed8;font-weight:600;text-decoration:underline;">soporte@lumina.com</a>
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9;padding:24px 36px;text-align:center;border-top:1px solid #e2e8f0;">
              <div style="font-size:12px;font-weight:600;color:#475569;">
                Lumina Home · Innovación &amp; Mobiliario de Alta Gama
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                Este es un comprobante de compra digital generado automáticamente. Todos los derechos reservados.
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
  const trackingNumber = order.trackingNumber || 'LM-ASIGNADO';
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
  const waText = encodeURIComponent(`Hola ${recipient}, te contactamos de Lumina Home respecto a tu orden #${orderId}.`);
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : '';

  const itemsRows = (order.items || []).map((item) => {
    const title = item.product?.title || 'Producto Lumina';
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
                      Orden: <strong style="color:#ffffff;">#${orderId}</strong> · Guía: <strong style="color:#ffffff;">${trackingNumber}</strong>
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
                ⚠️ <strong>Paso operativo:</strong> Una vez preparado y rotulado el paquete con el número de guía <strong>${trackingNumber}</strong>, ingresar al panel de administración para actualizar el estado a <em>"Enviado"</em>.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 36px;text-align:center;border-top:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#94a3b8;">
                Panel de Administración Lumina Home · Notificación Automática de Despacho
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
    const fromAddress = process.env.SMTP_FROM || 'Lumina Home <ventas@lumina.com>';

    const customerEmail = order.customerEmail || order.shippingAddress?.email;
    const resolvedAdmins = adminEmails && adminEmails.length > 0 ? adminEmails : await getAllAdminEmails();

    const customerHtml = generateCustomerInvoiceHtml(order);
    const adminHtml = generateAdminDispatchNoticeHtml(order);

    if (!transporter) {
      console.log('----------------------------------------------------');
      console.log('📦 [emailService - MOCK/DEV MODE] SMTP not configured. Simulating email delivery:');
      console.log(`✉️ Factura enviada al Cliente: ${customerEmail || '(Sin correo de cliente)'}`);
      console.log(`✉️ Alerta de Despacho enviada a Administradores: ${resolvedAdmins.join(', ')}`);
      console.log(`📋 Orden ID: ${order.id} | Total: $${Number(order.total).toFixed(2)} | Cédula: ${order.customerIdNumber || 'N/A'} | WhatsApp: ${order.customerPhone || 'N/A'}`);
      console.log('----------------------------------------------------');
      return { success: true, customerSent: true, adminsSent: true, mocked: true };
    }

    let customerSent = false;
    let adminsSent = false;

    // 1. Send Customer Invoice
    if (customerEmail && customerEmail.includes('@')) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: customerEmail,
          subject: `Factura y Confirmación de Pedido #${order.id} - Lumina Home`,
          html: customerHtml,
        });
        customerSent = true;
      } catch (custErr) {
        console.error('[emailService] Error sending customer invoice:', custErr);
      }
    }

    // 2. Send Admin Dispatch Alert
    if (resolvedAdmins.length > 0) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: resolvedAdmins.join(', '),
          subject: `📦 [DESPACHO INMEDIATO] Nueva Orden #${order.id} - ${order.customerName || order.recipient || 'Cliente'}`,
          html: adminHtml,
        });
        adminsSent = true;
      } catch (adminErr) {
        console.error('[emailService] Error sending admin dispatch alert:', adminErr);
      }
    }

    return { success: true, customerSent, adminsSent };
  } catch (error) {
    console.error('[emailService] Fatal error in sendOrderEmails:', error);
    return { success: false, customerSent: false, adminsSent: false };
  }
}
