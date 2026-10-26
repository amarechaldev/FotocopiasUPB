-- 0007: the logged-in operator can read the departments and anillado sizes too.
-- Apply once, in the Supabase SQL Editor, after 0006. Never edit after applying: write 0008_... instead.

-- 0001 opened these two lists to the anon role only. A logged-in admin (0005) uses the
-- authenticated role instead, so the lists came back refused: no departments in the admin
-- filter, and no departments or sizes in the staff form on a browser where she is logged in.

grant select on areas, anillado_sizes to authenticated;
create policy "Logged-in users can read areas" on areas for select to authenticated using (true);
create policy "Logged-in users can read anillado sizes" on anillado_sizes
  for select to authenticated using (true);
