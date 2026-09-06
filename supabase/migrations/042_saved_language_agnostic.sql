-- A like belongs to the piece, not to the language it was read in.
--
-- Learn content exists once per language in Sanity — learn-four-month-sleep,
-- -fr, -es — and the heart stored whichever _id was on screen. That was
-- invisible while saves only fed a shelf on the profile; now that they drive
-- the Discover filter, a mother who hearts an article in Spanish and then
-- reads the app in French finds her filter empty. The app now saves under the
-- English original (Sanity's `translationOf`); this brings the existing rows
-- to the same key.
--
-- Rows whose base is already saved by the same user are dropped rather than
-- renamed — the unique (user_id, item_id) is the point, and two likes on one
-- article is one like.
delete from saved_tips a
where a.doc_type in ('read_article', 'watch_reel', 'recommendation')
  and a.item_id ~ '-(fr|es)$'
  and exists (
    select 1 from saved_tips b
    where b.user_id = a.user_id
      and b.item_id = regexp_replace(a.item_id, '-(fr|es)$', '')
  );

update saved_tips
set item_id = regexp_replace(item_id, '-(fr|es)$', '')
where doc_type in ('read_article', 'watch_reel', 'recommendation')
  and item_id ~ '-(fr|es)$';
