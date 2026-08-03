import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LovedKind, LovedCategory } from '@/types';

export interface NewLovedSpot {
  kind: LovedKind;
  name: string;
  category: LovedCategory;
  note: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  city: string | null;
}

/**
 * Publish a loved spot to the Explore map. RLS (019) enforces the permission
 * model server-side: the insert only succeeds for a contributor/admin posting
 * as themselves. Returns the new row id, or throws so the composer can keep the
 * user on the preview step with their input intact.
 */
export function useCreateLovedSpot() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(input: NewLovedSpot): Promise<string> {
    setSubmitting(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      const msg = 'You need to be signed in to post.';
      setError(msg);
      throw new Error(msg);
    }
    const { data, error: err } = await supabase
      .from('loved_spots')
      .insert({ ...input, poster_id: user.id })
      .select('id')
      .single();
    setSubmitting(false);
    if (err || !data) {
      const msg = 'Couldn’t publish — please try again.';
      setError(msg);
      throw new Error(err?.message ?? msg);
    }
    return data.id as string;
  }

  return { create, submitting, error };
}
