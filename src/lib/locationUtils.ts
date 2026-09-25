export interface RawGpsHardwareData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  rawCoordsString: string;
  rawPositionJson: string;
  rawDisplayName?: string;
  rawNominatim?: Record<string, unknown>;
}

export interface RefinedCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  rawGps: RawGpsHardwareData;
}

const RAW_GPS_STORAGE_KEY = "lumina_raw_gps_hardware_v1";

export function buildRawGpsHardwareData(
  pos: GeolocationPosition,
  extraGeocode?: { rawDisplayName?: string; rawNominatim?: Record<string, unknown> }
): RawGpsHardwareData {
  const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = pos.coords;
  const rawPayload = {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed,
    },
    timestamp: pos.timestamp,
    ...(extraGeocode?.rawNominatim ? { reverseGeocode: extraGeocode.rawNominatim } : {}),
  };

  const hardwareData: RawGpsHardwareData = {
    latitude,
    longitude,
    accuracy,
    altitude: altitude ?? null,
    altitudeAccuracy: altitudeAccuracy ?? null,
    heading: heading ?? null,
    speed: speed ?? null,
    timestamp: pos.timestamp || Date.now(),
    rawCoordsString: `${latitude},${longitude}`,
    rawPositionJson: JSON.stringify(rawPayload),
    rawDisplayName: extraGeocode?.rawDisplayName,
    rawNominatim: extraGeocode?.rawNominatim,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(RAW_GPS_STORAGE_KEY, JSON.stringify(hardwareData));
    } catch {}
  }

  return hardwareData;
}

export function getStoredRawGpsHardwareData(): RawGpsHardwareData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RAW_GPS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return parsed as RawGpsHardwareData;
    }
  } catch {}
  return null;
}

/**
 * Requests an immediate high-accuracy raw GPS position directly from the hardware chip.
 * Used when opening the Radar/Map view or syncing an existing address.
 */
export async function getImmediateRawGpsPosition(): Promise<RawGpsHardwareData> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Tu navegador no soporta geolocalización.");
  }

  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 8500,
    });
  });

  return buildRawGpsHardwareData(pos);
}

/**
 * Executes a 3-pass internal geolocation sampling with enableHighAccuracy: true
 * and maximumAge: 0. Waits briefly between samples so the device GPS/Wi-Fi radio
 * finishes scanning and calibrates accurately. Returns the most accurate sample
 * along with the complete unformatted RawGpsHardwareData directly from the GPS chip.
 */
export async function getRefinedCoordinates(): Promise<RefinedCoordinates> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Tu navegador no soporta geolocalización.");
  }

  const getSinglePosition = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const samples: GeolocationPosition[] = [];

  for (let i = 1; i <= 3; i++) {
    try {
      // Force fresh GPS reading without using cache
      const pos = await getSinglePosition({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 7000,
      });
      samples.push(pos);
    } catch (err: unknown) {
      const geoErr = err as GeolocationPositionError;
      // If user denied permission explicitly on first attempt, abort immediately
      if (geoErr?.code === 1) {
        throw new Error("Permiso de ubicación denegado. Habilita el acceso en tu navegador o ingresa los datos manualmente.");
      }
      console.warn(`[Geolocation] Lectura interna muestra ${i}:`, err);
    }

    // Give device radio / Wi-Fi scan time to settle between readings
    if (i < 3) {
      await delay(350);
    }
  }

  // Pick the sample with the finest GPS accuracy (or the 3rd sample if tied)
  const chosen =
    samples.length > 0
      ? samples.reduce((best, curr) =>
          curr.coords.accuracy <= best.coords.accuracy ? curr : best
        )
      : null;

  if (!chosen) {
    throw new Error("No se pudo obtener la ubicación con precisión. Por favor, ingresa los datos manualmente.");
  }

  const rawGps = buildRawGpsHardwareData(chosen);

  return {
    latitude: chosen.coords.latitude,
    longitude: chosen.coords.longitude,
    accuracy: chosen.coords.accuracy,
    rawGps,
  };
}
