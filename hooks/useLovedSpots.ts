import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Contributor,
  LovedKind,
  LovedCategory,
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
 * Explore map spots for one mode (place | person), optionally scoped to a single
 * category. Reads via the `discover_spots` RPC so each spot carries its
 * contributor's public attribution despite `users` RLS.
 */
export function useLovedSpots(kind: LovedKind, category: LovedCategory | 'all') {
  const [spots, setSpots] = useState<LovedSpotWithPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('discover_spots', {
      p_kind: kind,
      p_category: category === 'all' ? null : category,
    });
    if (err) {
      setError('Couldn’t load the map. Pull to retry.');
      setSpots([]);
    } else {
      setSpots(((data as SpotRow[]) ?? []).map(toSpot));
    }
    setLoading(false);
  }, [kind, category]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { spots, loading, error, refresh };
}

/** A single loved spot with its contributor, for the detail screen. */
export function useLovedSpot(id: string | undefined) {
  const [spot, setSpot] = useState<LovedSpotWithPoster | null>(null);
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
      const { data, error: err } = await supabase.rpc('discover_spot', { p_id: id });
      if (cancelled) return;
      if (err) {
        setError('Couldn’t load this recommendation.');
      } else {
        const row = (data as SpotRow[])?.[0];
        setSpot(row ? toSpot(row) : null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { spot, loading, error };
}

/** A contributor's public profile + their loved spots, for the profile screen. */
export function useContributor(id: string | undefined) {
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
        setError('Couldn’t load this profile.');
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
