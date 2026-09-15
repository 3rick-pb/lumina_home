export interface RefinedCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Executes a 3-pass internal geolocation sampling with enableHighAccuracy: true
 * and maximumAge: 0. Waits briefly between samples so the device GPS/Wi-Fi radio
 * finishes scanning and calibrates accurately. Returns the 3rd sample ("a la tercera la vencida")
 * to fill the address form accurately only once, completely internally.
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

  // The 3rd sample is the one used to fill the form ("la tercera es la vencida")
  const chosen = samples[samples.length - 1];

  if (!chosen) {
    throw new Error("No se pudo obtener la ubicación con precisión. Por favor, ingresa los datos manualmente.");
  }

  return {
    latitude: chosen.coords.latitude,
    longitude: chosen.coords.longitude,
    accuracy: chosen.coords.accuracy,
  };
}
