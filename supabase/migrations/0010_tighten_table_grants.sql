-- 0010: the browser keeps only the table access the app uses.
-- Apply once, in the Supabase SQL Editor, after 0009: first in the test project, then in
-- production once the preview works. Never edit after applying: write 0011_... instead.

-- Supabase gives new tables every permission for the browser's roles (anon = shared device,
-- authenticated = logged-in operator) and leaves the protection to RLS. RLS blocks rows, but
-- not TRUNCATE (emptying a table), so the safer rule, already used for accounts and admins
-- (0002, 0005), is to remove what is not needed:
--   - entries and entry_anillados: nothing; the app only reaches them through functions,
--     which run with their owner's rights (security definer).
--   - areas and anillado_sizes: reading only, for the forms' lists (policies in 0001 and 0007).
-- New tables in later migrations need the same: revoke all, then grant only what is used.

revoke all on entries, entry_anillados from anon, authenticated;
revoke all on areas, anillado_sizes from anon, authenticated;
grant select on areas, anillado_sizes to anon, authenticated;
