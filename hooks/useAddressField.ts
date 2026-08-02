import { useCallback, useState } from 'react';
import { resolveCurrentLocation, resolveTypedAddress } from '@/lib/geocode';

export interface AddressCoords {
  city: string | null;
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AddressFieldState {
  address: string;
  setAddress: (v: string) => void;
  loc: AddressCoords;
  verified: boolean;
  /** "De Pijp, Amsterdam" — what we show once the address resolved. */
  label: string | null;
  locating: boolean;
  verifying: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  /** Device GPS → fills the address and the coords. */
  useCurrentLocation: () => Promise<void>;
  /** Geocode what was typed. Returns null (and sets `error`) if it can't. */
  verify: () => Promise<AddressCoords | null>;
  /**
   * What to call on save: returns coords, geocoding first if needed. null means
   * "don't save" — `error` is set and shown under the field.
   */
  resolve: () => Promise<AddressCoords | null>;
}

/**
 * The address capture shared by Preferences and Edit profile. Matching is
 * distance-based, so an address is only useful once it resolves to lat/lng —
 * every screen that lets someone move must write the coords too, not just a
 * free-text city.
 */
export function useAddressField(initial: {
  address: string | null;
  city: string | null;
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
}): AddressFieldState {
  const [address, setAddressRaw] = useState(initial.address ?? '');
  const [loc, setLoc] = useState<AddressCoords>({
    city: initial.city,
    neighbourhood: initial.neighbourhood,
    latitude: initial.latitude,
    longitude: initial.longitude,
  });
  const [locating, setLocating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing the text invalidates the coords it resolved to.
  const setAddress = useCallback((v: string) => {
    setAddressRaw(v);
    setError(null);
    setLoc({ city: null, neighbourhood: null, latitude: null, longitude: null });
  }, []);

  const useCurrentLocation = useCallback(async () => {
    setError(null);
    setLocating(true);
    const r = await resolveCurrentLocation();
    setLocating(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAddressRaw(r.result.address);
    setLoc({
      city: r.result.city,
      neighbourhood: r.result.neighbourhood,
      latitude: r.result.latitude,
      longitude: r.result.longitude,
    });
  }, []);

  const verify = useCallback(async (): Promise<AddressCoords | null> => {
    const addr = address.trim();
    if (!addr) return null;
    if (loc.latitude != null) return loc;
    setError(null);
    setVerifying(true);
    const r = await resolveTypedAddress(addr);
    setVerifying(false);
    if (!r.ok || r.result.latitude == null) {
      setError("we couldn't find that address. check the spelling, or tap the location icon.");
      return null;
    }
    const next = {
      city: r.result.city,
      neighbourhood: r.result.neighbourhood,
      latitude: r.result.latitude,
      longitude: r.result.longitude,
    };
    setLoc(next);
    return next;
  }, [address, loc]);

  const resolve = useCallback(async (): Promise<AddressCoords | null> => {
    if (!address.trim()) {
      setError('your address is needed so we can match you within walking distance.');
      return null;
    }
    return loc.latitude != null ? loc : verify();
  }, [address, loc, verify]);

  return {
    address,
    setAddress,
    loc,
    verified: loc.latitude != null && loc.longitude != null,
    label: loc.neighbourhood ? `${loc.neighbourhood}, ${loc.city ?? ''}`.replace(/, $/, '') : loc.city,
    locating,
    verifying,
    error,
    setError,
    useCurrentLocation,
    verify,
    resolve,
  };
}
