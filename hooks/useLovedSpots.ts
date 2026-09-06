import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import type {
  Contributor,
  LovedKind,
  LovedCategory,
  LovedPlace,
  LovedSpotWithPoster,
} from '@/types';

// The RPCs (020) return poster fields flattened; we reshape them into the nested
// `poster` object the UI consumes.
interface SpotRow {
  id: string;
  kind: LovedKind;
  poster_id: string;
  name: string;
  category: LovedCategory;
  note: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  booking_url: string | null;
  photo_url: string | null;
  created_at: string;
  poster_name: string | null;
  poster_color: string | null;
  poster_neighbourhood: string | null;
}

function toSpot(r: SpotRow): LovedSpotWithPoster {
  return {
    id: r.id,
    kind: r.kind,
    poster_id: r.poster_id,
    name: r.name,
    category: r.category,
    note: r.note,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    place_id: r.place_id,
    city: r.city,
    phone: r.phone,
    email: r.email,
    booking_url: r.booking_url,
    photo_url: r.photo_url,
    created_at: r.created_at,
    poster: r.poster_name
      ? {
          id: r.poster_id,
          display_name: r.poster_name,
          profile_color: r.poster_color,
          neighbourhood: r.poster_neighbourhood,
        }
      : null,
  };
}

/**
 * Explore map places for one mode (place | person), optionally scoped to a
 * single category. Reads via `discover_places` (028), which groups rows into
 * places: one pin, one row, however many moms have vouched for it.
 */
export function useLovedPlaces(kind: LovedKind, category: LovedCategory | 'all') {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<LovedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('discover_places', {
      p_kind: kind,
      p_category: category === 'all' ? null : category,
    });
    if (err) {
      setError(t('misc.mapLoadFailed'));
      setPlaces([]);
    } else {
      setPlaces((data as LovedPlace[]) ?? []);
    }
    setLoading(false);
  }, [kind, category]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { places, loading, error, refresh };
}

/**
 * One place and every recommendation of it, for the detail screen. Takes a spot
 * id — the route still opens on whichever pin was tapped — and returns the
 * group that spot belongs to.
 */
export function useLovedPlace(id: string | undefined) {
  const { t } = useTranslation();
  const [place, setPlace] = useState<LovedPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('discover_place', { p_id: id });
    if (err) setError(t('misc.recoLoadFailed'));
    else setPlace(((data as LovedPlace[]) ?? [])[0] ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { place, loading, error, refresh };
}

/** A contributor's public profile + their loved spots, for the profile screen. */
export function useContributor(id: string | undefined) {
  const { t } = useTranslation();
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [spots, setSpots] = useState<LovedSpotWithPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const [profileRes, spotsRes] = await Promise.all([
        supabase.rpc('discover_contributor', { p_id: id }),
        supabase.rpc('discover_spots_by_poster', { p_id: id }),
      ]);
      if (cancelled) return;
      if (profileRes.error || spotsRes.error) {
        setError(t('misc.profileLoadFailed'));
      } else {
        const row = (profileRes.data as Contributor[])?.[0] ?? null;
        setContributor(row);
        setSpots(((spotsRes.data as SpotRow[]) ?? []).map(toSpot));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { contributor, spots, loading, error };
}

/** One Regular, as the fourth Discover tab lists them. */
export interface Regular {
  id: string;
  display_name: string;
  profile_color: string | null;
  avatar_url: string | null;
  neighbourhood: string | null;
  city: string | null;
  bio: string | null;
  spot_count: number;
  reel_count: number;
}

/**
 * The Regulars list, with a name search.
 *
 * Search runs in Postgres rather than by filtering a fetched array, so it stays
 * accent-insensitive — "amelie" finds Amélie — which a JS `includes` would not.
 * Debounced, because it fires on every keystroke.
 */
export function useRegulars(query: string) {
  const [regulars, setRegulars] = useState<Regular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('discover_regulars', {
        p_query: query.trim() || null,
      });
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message);
        setRegulars([]);
      } else {
        setError(null);
        setRegulars((data as Regular[]) ?? []);
      }
      setLoading(false);
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { regulars, loading, error };
}
