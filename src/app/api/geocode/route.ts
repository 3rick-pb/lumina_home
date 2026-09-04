import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon } = body;

    if (lat === undefined || lon === undefined || isNaN(Number(lat)) || isNaN(Number(lon))) {
      return NextResponse.json(
        { success: false, error: 'Coordenadas inválidas.' },
        { status: 400 }
      );
    }

    const nLat = Number(lat);
    const nLon = Number(lon);

    const cleanAdmin = (str?: string) => {
      if (!str) return '';
      return str
        .replace(/^Distrito Metropolitano de\s+/i, '')
        .replace(/^Distrito\s+/i, '')
        .replace(/^Cantón\s+/i, '')
        .replace(/^Municipio de\s+/i, '')
        .replace(/^Comunidad de\s+/i, '')
        .replace(/^Provincia de\s+/i, '')
        .replace(/^Departamento de\s+/i, '')
        .trim();
    };

    const headers = {
      'User-Agent': 'LuminaHome-App/1.0 (delivery-routing; contact@luminahome.com)',
      'Accept-Language': 'es'
    };

    // Run parallel queries: Origin + 4 diagonal offsets (~38m) to detect intersecting streets
    const offset = 0.00035;
    const [originRes, off1Res, off2Res, off3Res, off4Res, bdcRes] = await Promise.allSettled([
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat + offset}&lon=${nLon + offset}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat - offset}&lon=${nLon - offset}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat + offset}&lon=${nLon - offset}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat - offset}&lon=${nLon + offset}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLon}&localityLanguage=es`).then(r => r.json())
    ]);

    const origin = originRes.status === 'fulfilled' ? originRes.value : null;
    const off1 = off1Res.status === 'fulfilled' ? off1Res.value : null;
    const off2 = off2Res.status === 'fulfilled' ? off2Res.value : null;
    const off3 = off3Res.status === 'fulfilled' ? off3Res.value : null;
    const off4 = off4Res.status === 'fulfilled' ? off4Res.value : null;
    const bdc = bdcRes.status === 'fulfilled' ? bdcRes.value : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = (origin && (origin as any).address) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off1Addr = (off1 && (off1 as any).address) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off2Addr = (off2 && (off2 as any).address) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off3Addr = (off3 && (off3 as any).address) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off4Addr = (off4 && (off4 as any).address) || {};

    // 1. Primary Road & House Number
    const primaryRoad = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || (bdc && bdc.locality) || '';
    const houseNum = addr.house_number || '';

    // 2. Cross / Intersecting Road Discovery
    let crossRoad = '';
    const candidateStreets: string[] = [
      off1Addr.road,
      off2Addr.road,
      off3Addr.road,
      off4Addr.road,
      off1Addr.pedestrian,
      off2Addr.pedestrian,
      off3Addr.pedestrian,
      off4Addr.pedestrian,
      off1Addr.street,
      off2Addr.street,
      off3Addr.street,
      off4Addr.street,
      off1Addr.footway,
      off2Addr.footway,
      off3Addr.footway,
      off4Addr.footway
    ].filter(Boolean);

    for (const cand of candidateStreets) {
      if (
        primaryRoad &&
        cand.toLowerCase() !== primaryRoad.toLowerCase() &&
        !cand.toLowerCase().includes(primaryRoad.toLowerCase()) &&
        !primaryRoad.toLowerCase().includes(cand.toLowerCase())
      ) {
        crossRoad = cand;
        break;
      }
    }

    // Build enhanced street description (e.g. "10 de Agosto y Quito" or "Av. Amazonas #123 y Colón")
    let street = primaryRoad;
    if (!street) {
      street = addr.suburb || addr.neighbourhood || addr.village || 'Dirección por coordenadas';
    }

    if (houseNum) {
      street += ` #${houseNum}`;
    }

    if (crossRoad) {
      street += ` y ${crossRoad}`;
    }

    // 3. Hierarchical City and Sub-locality / Parish (e.g. "Quito - Guayllabamba")
    const rawCounty = cleanAdmin(addr.county);
    const rawCity = cleanAdmin(addr.city);
    const rawTown = cleanAdmin(addr.town);
    const rawMunicipality = cleanAdmin(addr.municipality);
    const bdcCity = cleanAdmin(bdc && (bdc.city || bdc.principalSubdivision));

    // Determine principal city/canton
    const mainCity = rawCity || rawCounty || rawMunicipality || bdcCity || '';

    // Determine sub-locality, parish, sector or neighbourhood
    const subLocality = (
      addr.village ||
      (rawTown && rawTown.toLowerCase() !== mainCity.toLowerCase() ? rawTown : '') ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.hamlet ||
      (bdc && bdc.locality && bdc.locality.toLowerCase() !== mainCity.toLowerCase() ? bdc.locality : '') ||
      ''
    ).trim();

    // Format hierarchical city name
    let finalCity = mainCity;
    if (
      mainCity &&
      subLocality &&
      mainCity.toLowerCase() !== subLocality.toLowerCase() &&
      !mainCity.toLowerCase().includes(subLocality.toLowerCase()) &&
      !subLocality.toLowerCase().includes(mainCity.toLowerCase())
    ) {
      finalCity = `${mainCity} - ${subLocality}`;
    } else if (!mainCity && subLocality) {
      finalCity = subLocality;
    }

    // 4. State / Province, Postal Code, Country
    const state = addr.state || addr.province || addr.region || (bdc && bdc.principalSubdivision) || '';
    const postalCode = addr.postcode || (bdc && bdc.postcode) || '';
    const country = addr.country || (bdc && bdc.countryName) || 'Ecuador';

    return NextResponse.json({
      success: true,
      data: {
        street,
        city: finalCity || 'Ciudad no determinada',
        state,
        postalCode,
        country
      }
    });
  } catch (error) {
    console.error('Error in /api/geocode:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servicio de geocodificación.' },
      { status: 500 }
    );
  }
}
