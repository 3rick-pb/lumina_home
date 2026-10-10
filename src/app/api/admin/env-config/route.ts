import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';
import { brandConfig } from '@/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
    }

    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes de administrador' }, { status: 403 });
    }

    // Supabase status
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const isSupabaseConfigured = Boolean(supabaseUrl && (hasAnonKey || hasServiceRole));

    // SMTP status
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || '';
    const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `${brandConfig.name} <${smtpUser}>` : '');
    const hasSmtpPass = Boolean(process.env.SMTP_PASS);
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && hasSmtpPass);
    const smtpSecure = (process.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';

    // Google Cloud & Drive status
    const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').replace('YOUR_GOOGLE_CLIENT_ID_HERE', '');
    const hasGoogleSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || '';
    const hasGoogleEncryption = Boolean(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);
    const isGoogleConfigured = Boolean(googleClientId && hasGoogleSecret);

    // PayPhone status
    const payphoneAppId = process.env.NEXT_PUBLIC_PAYPHONE_APP_ID || process.env.PAYPHONE_APP_ID || '';
    const payphoneStoreId = process.env.PAYPHONE_STORE_ID || '';
    const hasPayphoneToken = Boolean(process.env.PAYPHONE_TOKEN);
    const payphoneEnv = process.env.NEXT_PUBLIC_PAYPHONE_ENV || process.env.PAYPHONE_ENV || 'sandbox';
    const payphoneApiUrl = process.env.PAYPHONE_API_URL || 'https://pay.payphonetodoesposible.com/api';
    const isPayphoneConfigured = Boolean(hasPayphoneToken && payphoneAppId);

    // Hosting & Mapbox status
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';
    const hasMapbox = Boolean(mapboxToken);
    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL || '';

    // Mobile Wallets status (Google Wallet)
    const googleWalletIssuerId = process.env.GOOGLE_WALLET_ISSUER_ID || '';
    const googleWalletClientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL || '';
    const hasGoogleWallet = Boolean(googleWalletIssuerId && googleWalletClientEmail);
    const hasWalletSecret = Boolean(process.env.WALLET_SECRET_KEY);

    return NextResponse.json({
      success: true,
      services: {
        supabase: {
          configured: isSupabaseConfigured,
          url: supabaseUrl,
          hasAnonKey,
          hasServiceRole,
        },
        smtp: {
          configured: isSmtpConfigured,
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          from: smtpFrom,
          secure: smtpSecure,
          hasPassword: hasSmtpPass,
        },
        googleDrive: {
          configured: isGoogleConfigured,
          clientId: googleClientId,
          hasClientSecret: hasGoogleSecret,
          redirectUri: googleRedirectUri,
          hasEncryptionKey: hasGoogleEncryption,
        },
        payphone: {
          configured: isPayphoneConfigured,
          appId: payphoneAppId,
          storeId: payphoneStoreId,
          hasToken: hasPayphoneToken,
          env: payphoneEnv,
          apiUrl: payphoneApiUrl,
        },
        hosting: {
          siteUrl,
          hasMapbox,
          mapboxToken,
          masterAdminEmail,
        },
        wallets: {
          configured: hasGoogleWallet,
          hasGoogleWallet,
          googleWalletIssuerId,
          googleWalletClientEmail,
          hasWalletSecret,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
