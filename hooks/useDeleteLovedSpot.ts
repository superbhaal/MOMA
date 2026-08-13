import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Take back a recommendation you posted.
 *
 * RLS (019) already restricted deletes to the poster, so this needed no new
 * permission — only a screen. The row goes; the place does not, because a place
 * is a place and other moms may have vouched for it too. Deleting yours
 * shouldn't erase what they said.
 *
 * The photo stays in the bucket. Cleaning it up means a storage call that can
 * fail on its own, and an orphaned object costs bytes where a failed delete
 * would cost the user her intent.
 */
export function useDeleteLovedSpot() {
  const [deleting, setDeleting] = useState(false);

  async function remove(id: string): Promise<{ error: string | null }> {
    setDeleting(true);
    const { error } = await supabase.from('loved_spots').delete().eq('id', id);
    setDeleting(false);
    return { error: error ? 'Please try again.' : null };
  }

  return { remove, deleting };
}
