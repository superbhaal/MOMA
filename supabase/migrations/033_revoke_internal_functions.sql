-- 033_revoke_internal_functions.sql
-- Hardening. No behaviour change: none of these are called by the app, and the
-- ones that matter run under SECURITY DEFINER from triggers.
--
-- The distinction that matters: a function used INSIDE an RLS policy is
-- evaluated with the CALLER's privileges, so `authenticated` must keep EXECUTE
-- on is_member_of / is_discover_contributor / shares_group_with or every
-- protected read fails. They lose only `anon`, which has no policy path to them.
--
-- The one with teeth was `decide_proposal_if_quorum`: anyone who knew a
-- proposal id could lock a group's meetup in, signed in or not.
--
-- Applied via the `revoke_internal_functions` migration; this file is the
-- record. Verified afterwards by reading five protected tables as a simulated
-- authenticated user — the policies still evaluate.

REVOKE ALL ON FUNCTION public.refresh_group_name() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_group_names_for_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_message() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_proposal_decided() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_votes_maybe_decide() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_last_active_on_message() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.decide_proposal_if_quorum(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.group_initials(uuid) FROM public, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_member_of(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_discover_contributor(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.shares_group_with(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.discover_contributor(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_discover_contributor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_group_with(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discover_contributor(uuid) TO authenticated;

ALTER FUNCTION public.proposal_going_quorum(integer) SET search_path = public;
