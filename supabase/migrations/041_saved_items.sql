-- 041_saved_items.sql
--
-- Liking spreads from Learn and Watch to Explore and Regulars.
--
-- Until now `saved_tips` only ever held Sanity documents — articles and reels —
-- so `sanity_doc_id` was an honest name. It is about to hold the uuid of a
-- loved_spot and the uuid of a mother, and a column called sanity_doc_id
-- holding neither would mislead every future reader. Renamed while the table
-- holds a handful of rows and nobody outside the app reads it.
--
-- The two new kinds are NOT foreign keys. A saved row should survive the thing
-- it points at being deleted, the same way a saved article survives being
-- unpublished in Sanity — the shelf degrades to an entry that no longer
-- resolves, rather than silently losing the row. Resolution happens at read
-- time, in the app.

alter table saved_tips rename column sanity_doc_id to item_id;

alter table saved_tips drop constraint if exists saved_tips_doc_type_check;
alter table saved_tips add constraint saved_tips_doc_type_check
  check (doc_type in ('read_article', 'watch_reel', 'recommendation', 'loved_spot', 'regular'));
