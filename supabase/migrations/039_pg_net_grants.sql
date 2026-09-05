-- pg_net: what we tried, why it does nothing, and what the real exposure is.
--
-- Recorded so nobody spends this afternoon twice. Two migrations were applied
-- on 2026-09-02 (restrict_pg_net_to_definer_triggers, restrict_pg_net_from_public)
-- and BOTH reported success while changing nothing at all.
--
-- Why: schema `net` and every net.http_* function are owned by `supabase_admin`.
-- We connect as `postgres`. Revoking a privilege you do not administer is a
-- WARNING in Postgres, never an error — so the migration "succeeds" and the ACL
-- is untouched. Verified after each run with has_function_privilege().
--
-- The finding behind the advisory is real: net.http_post carries `=X/supabase_admin`,
-- i.e. PUBLIC may execute, and both anon and authenticated hold USAGE on `net`.
-- That is arbitrary outbound HTTP from the database's network position.
--
-- The exposure is latent, not open. Verified from outside with the publishable
-- key: PostgREST answers PGRST106 "Only the following schemas are exposed:
-- public, graphql_public". `net` is unreachable from the app, and nothing in
-- `public` calls it as the caller — notify_on_message and
-- notify_on_proposal_decided are both SECURITY DEFINER owned by postgres.
--
-- Nor can the extension be moved out of `public`: pg_net is flagged
-- extrelocatable = false, so ALTER EXTENSION ... SET SCHEMA is refused outright,
-- and DROP CASCADE would take both notification triggers with it. The registered
-- schema is bookkeeping regardless — the functions have always lived in `net`.
--
-- Closing it properly needs supabase_admin, which the platform does not hand
-- out. That makes it a support request, not a migration. Left as-is knowingly.
--
-- The statements below are the ones that were applied. Kept verbatim so a
-- fresh-database replay matches the live project; they are harmless no-ops.

revoke usage on schema net from public, anon, authenticated;
grant usage on schema net to postgres, service_role, supabase_functions_admin;

revoke all on all functions in schema net from public, anon, authenticated;
grant execute on all functions in schema net to postgres, service_role, supabase_functions_admin;
