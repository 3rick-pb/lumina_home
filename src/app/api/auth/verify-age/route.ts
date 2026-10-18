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
  names?: Array<{ displayName?: string }>;
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

    // Case 3: Legal Age (>= 18 years old) -> Persist verified profile to Supabase
    const birthDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const fullName =
      googleData.names?.[0]?.displayName ||
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "";
    const avatarUrl =
      googleData.photos?.[0]?.url ||
      (user.user_metadata?.avatar_url as string) ||
      (user.user_metadata?.picture as string) ||
      "";

    // Upsert into public.profiles
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      birth_date: birthDateStr,
      verified_age: exactAge,
      age_verified: true,
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
          email: user.email,
          display_name: fullName,
          role: "USER",
          updated_at: new Date().toISOString(),
        });
      if (userProfError) {
        console.warn("[verify-age] Notice saving to public.user_profiles:", userProfError.message);
      }
    } catch (err: unknown) {
      console.warn("[verify-age] Exception saving to public.user_profiles:", err instanceof Error ? err.message : String(err));
    }

    return NextResponse.json({
      success: true,
      age: exactAge,
      user: {
        id: user.id,
        email: user.email,
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
