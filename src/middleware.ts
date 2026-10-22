import { NextResponse } from 'next/server';

export function middleware() {
  const response = NextResponse.next();

  // Security Hardening Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Content Security Policy (CSP) - Authorized for PayPhone v2, 3D Secure Cardinal Commerce & ThreatMetrix
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.payphonetodoesposible.com https://pay.payphonetodoesposible.com https://paymentbox.payphonetodoesposible.com https://*.payphonetodoesposible.com https://pay.payphone.com.ec https://songbird.cardinalcommerce.com https://*.cardinalcommerce.com https://h.online-metrix.net https://*.online-metrix.net https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.payphonetodoesposible.com https://*.payphonetodoesposible.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com https://cdn.payphonetodoesposible.com data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://freeipapi.com https://ipwho.is https://ipinfo.io https://*.ipinfo.io https://nominatim.openstreetmap.org https://cdn.payphonetodoesposible.com https://pay.payphonetodoesposible.com https://paymentbox.payphonetodoesposible.com https://*.payphonetodoesposible.com https://pay.payphone.com.ec https://*.cardinalcommerce.com https://*.online-metrix.net https://www.google-analytics.com",
    "frame-src 'self' https://cdn.payphonetodoesposible.com https://pay.payphonetodoesposible.com https://paymentbox.payphonetodoesposible.com https://*.payphonetodoesposible.com https://pay.payphone.com.ec https://songbird.cardinalcommerce.com https://*.cardinalcommerce.com https://h.online-metrix.net https://*.online-metrix.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.payphonetodoesposible.com https://*.cardinalcommerce.com",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
