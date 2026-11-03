-- 0013: the price of a copy, for the global report (#8).
-- Apply once, in the Supabase SQL Editor, after 0012: first in the test project, then in
-- production before the story's PR is merged (it only adds a table, so it is safe earlier).
-- Never edit after applying: write 0014_... instead.

-- One row only: the primary key can only be true. Anillado prices are in anillado_sizes (0001).
-- In the database, not in the code, so a yearly price change needs no deployment.
create table copy_price (
  one_row boolean primary key default true check (one_row),
  price_centavos integer not null check (price_centavos >= 0)
);

-- Bs 0.30, from docs/05-report-analysis.md.
insert into copy_price (price_centavos) values (30);

-- Read by the logged-in operator only (the global report); the shared device does not need it.
-- Same rule as 0010: revoke all, then grant only what the app uses.
alter table copy_price enable row level security;
revoke all on copy_price from anon, authenticated;
grant select on copy_price to authenticated;
create policy "Logged-in users can read the copy price" on copy_price
  for select to authenticated using (true);
