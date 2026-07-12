import * as Location from 'expo-location';

export interface ResolvedAddress {
  address: string;        // Formatted single-line "12 Rue de la Paix, Paris"
  street: string | null;
  city: string | null;
  neighbourhood: string | null;
  latitude: number;
  longitude: number;
}

/** Get the device's current position + reverse-geocode it. */
export async function resolveCurrentLocation(): Promise<
  { ok: true; result: ResolvedAddress } | { ok: false; error: string }
> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { ok: false, error: 'location permission denied' };
  }

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0] ?? null;

    return {
      ok: true,
      result: formatPlace(place, latitude, longitude),
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'failed to read location' };
  }
}

/** Forward-geocode a typed address to lat/lng + extract structured parts. */
export async function resolveTypedAddress(
  query: string,
): Promise<{ ok: true; result: ResolvedAddress } | { ok: false; error: string }> {
  if (!query.trim()) return { ok: false, error: 'empty address' };
  try {
    const matches = await Location.geocodeAsync(query);
    const m = matches[0];
    if (!m) return { ok: false, error: 'no match for that address' };
    const places = await Location.reverseGeocodeAsync({
      latitude: m.latitude,
      longitude: m.longitude,
    });
    return {
      ok: true,
      result: formatPlace(places[0] ?? null, m.latitude, m.longitude, query),
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'geocoding failed' };
  }
}

function formatPlace(
  p: Location.LocationGeocodedAddress | null,
  latitude: number,
  longitude: number,
  fallbackAddress?: string,
): ResolvedAddress {
  const street = p?.streetNumber && p?.street
    ? `${p.streetNumber} ${p.street}`
    : p?.street ?? null;
  const city = p?.city ?? p?.region ?? null;
  // iOS exposes `subregion` (e.g. "De Pijp"), Android often only `district`.
  const neighbourhood = p?.subregion ?? p?.district ?? null;
  const address =
    [street, city].filter(Boolean).join(', ') || fallbackAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  return { address, street, city, neighbourhood, latitude, longitude };
}
