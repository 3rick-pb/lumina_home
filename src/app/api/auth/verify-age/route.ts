import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Calculates exact age in completed years today according to calendar date.
 */
function calculateExactAge(birthYear: number, birthMonth: number, birthDay: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }
  return age;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider_token, access_token } = body || {};

    if (!provider_token || !access_token) {
      return NextResponse.json(
        { success: false, error: "Tokens de autenticación requeridos (provider_token, access_token)." },
        { status: 400 }
      );
    }

    // 1. Authenticate Supabase session with the user access token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    });

    const {
      data: { user },
      error: userAuthError,
    } = await supabase.auth.getUser(access_token);

    if (userAuthError || !user) {
      return NextResponse.json(
        { success: false, error: "Sesión de usuario no válida o expirada." },
        { status: 401 }
      );
    }

    // 2. Query Google People API for verified birthday and profile metadata
    const googleRes = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=birthdays,names,emailAddresses,photos",
      {
        headers: {
          Authorization: `Bearer ${provider_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!googleRes.ok) {
      const errText = await googleRes.text().catch(() => "");
      console.error("[verify-age] Google People API error:", googleRes.status, errText);
      return NextResponse.json(
        {
          success: false,
          code: "GOOGLE_API_ERROR",
          error: "No se pudo verificar tu fecha de nacimiento con Google. Asegúrate de conceder el permiso de cumpleaños.",
        },
        { status: 400 }
      );
    }

interface GoogleBirthdayDate {
  year?: number;
  month?: number;
  day?: number;
}

interface GoogleBirthday {
  date?: GoogleBirthdayDate;
}

interface GooglePersonData {
  birthdays?: GoogleBirthday[];
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  photos?: Array<{ url?: string }>;
}

    const googleData = (await googleRes.json()) as GooglePersonData;
    const birthdays = Array.isArray(googleData.birthdays) ? googleData.birthdays : [];

    // Extract valid birthday entry with completed year
    const validBday = birthdays.find(
      (b: GoogleBirthday) =>
        b?.date &&
        typeof b.date.year === "number" &&
        b.date.year > 1900 &&
        typeof b.date.month === "number" &&
        typeof b.date.day === "number"
    );

    // Case 2: Missing birth date or missing year in Google account
    if (!validBday || !validBday.date?.year || !validBday.date?.month || !validBday.date?.day) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_BIRTH_YEAR",
          error:
            "Para ingresar con Google es obligatorio que tu cuenta tenga configurada una fecha de nacimiento válida con año para verificar la mayoría de edad (+18).",
        },
        { status: 403 }
      );
    }

    const { year, month, day } = validBday.date;
    const exactAge = calculateExactAge(year, month, day);

    // Case 1: Underage (< 18 years old)
    if (exactAge < 18) {
      return NextResponse.json(
        {
          success: false,
          code: "UNDERAGE",
          age: exactAge,
          error: `No puedes acceder por ser menor de edad (tienes ${exactAge} años). El acceso es exclusivo para mayores de 18 años.`,
        },
        { status: 403 }
      );
    }

    // Case 3: Legal Age (>= 18 years old) -> Extract profile data & handle unification
    const birthDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 1. Thoroughly extract user full name from Google People API or fallbacks
    const googleNameObj = googleData.names?.[0];
    let fullName = googleNameObj?.displayName?.trim() || "";
    if (!fullName && (googleNameObj?.givenName || googleNameObj?.familyName)) {
      fullName = `${googleNameObj.givenName || ""} ${googleNameObj.familyName || ""}`.trim();
    }
    if (!fullName) {
      fullName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.given_name as string) ||
        user.email?.split("@")[0] ||
        "";
    }

    const avatarUrl =
      googleData.photos?.[0]?.url ||
      (user.user_metadata?.avatar_url as string) ||
      (user.user_metadata?.picture as string) ||
      "";

    const cleanEmail = (user.email || "").toLowerCase().trim();

    // 2. Account Unification Detection:
    // Check if user_profiles or profiles already had a record for this email
    const { data: existingUserProfile } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, email, role, created_at, google_connected")
      .eq("email", cleanEmail)
      .maybeSingle();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, age_verified, google_connected, account_merged, created_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    // Check user identities registered in Supabase Auth
    const identities = user.identities || [];
    const hasEmailIdentity = identities.some((i) => i.provider === "email");
    const hasGoogleIdentity = identities.some((i) => i.provider === "google");

    // Account was previously registered manually if:
    // a) Supabase linked both email/password and google identities to this user
    // b) There was an existing profile under a previous user_id
    // c) Existing profile existed before and was created without google_connected
    const isMergedAccount = Boolean(
      (hasEmailIdentity && hasGoogleIdentity) ||
      (existingUserProfile && existingUserProfile.user_id !== user.id) ||
      (existingProfile && existingProfile.id !== user.id) ||
      (existingUserProfile && !existingUserProfile.google_connected && existingUserProfile.created_at)
    );

    // If an existing profile belonged to an older user_id, migrate related data
    const oldUserId =
      existingUserProfile?.user_id && existingUserProfile.user_id !== user.id
        ? existingUserProfile.user_id
        : existingProfile?.id && existingProfile.id !== user.id
        ? existingProfile.id
        : null;

    if (oldUserId) {
      console.log(`[verify-age] Unifying older account data from ${oldUserId} into ${user.id}`);
      try {
        await supabase.from("orders").update({ user_id: user.id }).eq("user_id", oldUserId);
      } catch (e) {
        console.warn("[verify-age] Notice migrating orders:", e);
      }
      try {
        await supabase.from("user_addresses").update({ user_id: user.id }).eq("user_id", oldUserId);
      } catch (e) {
        console.warn("[verify-age] Notice migrating addresses:", e);
      }
      try {
        await supabase.from("favorites").update({ user_id: user.id }).eq("user_id", oldUserId);
      } catch (e) {
        console.warn("[verify-age] Notice migrating favorites:", e);
      }
    }

    // Preserve existing role if previously assigned (e.g. ADMIN or SUBADMIN)
    const targetRole = existingUserProfile?.role || "USER";

    // Upsert into public.profiles
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: cleanEmail,
      full_name: fullName || existingUserProfile?.display_name || "",
      avatar_url: avatarUrl,
      birth_date: birthDateStr,
      verified_age: exactAge,
      age_verified: true,
      google_connected: true,
      account_merged: isMergedAccount,
      merged_email: isMergedAccount ? cleanEmail : null,
      auth_provider: hasEmailIdentity && hasGoogleIdentity ? "both" : "google",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn("[verify-age] Notice saving to public.profiles:", profileError.message);
    }

    // Upsert into public.user_profiles for application store compatibility
    try {
      const { error: userProfError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          email: cleanEmail,
          display_name: fullName || existingUserProfile?.display_name || cleanEmail.split("@")[0],
          role: targetRole,
          google_connected: true,
          account_merged: isMergedAccount,
          updated_at: new Date().toISOString(),
        });
      if (userProfError) {
        console.warn("[verify-age] Notice saving to public.user_profiles:", userProfError.message);
      }
    } catch (err: unknown) {
      console.warn("[verify-age] Exception saving to public.user_profiles:", err instanceof Error ? err.message : String(err));
    }

    // Update user_metadata in Supabase Auth so client sessions get it immediately
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          avatar_url: avatarUrl,
        },
      });
    } catch (e) {
      console.warn("[verify-age] Notice updating user metadata:", e);
    }

    return NextResponse.json({
      success: true,
      age: exactAge,
      isMerged: isMergedAccount,
      mergedEmail: cleanEmail,
      user: {
        id: user.id,
        email: cleanEmail,
        name: fullName,
        avatarUrl,
        birthDate: birthDateStr,
      },
    });
  } catch (error: unknown) {
    console.error("[verify-age] Unexpected internal error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Error interno al verificar la mayoría de edad." },
      { status: 500 }
    );
  }
}
