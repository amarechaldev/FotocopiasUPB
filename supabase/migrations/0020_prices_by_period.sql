-- 0020: prices that start from a chosen period, and anillado sizes that can be archived (story #33,
-- task #99).
-- Apply once, in the Supabase SQL Editor, after 0019: first in the test project. In production, only
-- right before the #33 PR is merged: the live app still reads copy_price and
-- anillado_sizes.price_centavos, which are dropped here, so its global report fails in between.
-- Never edit after applying: write 0021_... instead. Tests: supabase/tests/prices.sql.

-- Rules (PO, 08/11/2026):
--   - A price change starts in the previous or the current period (the periods whose end can still be
--     moved, 0011), never later. Reports for earlier periods keep the old prices.
--   - An anillado size is archived from a period (previous or current) and can be reactivated, never
--     deleted. Archiving is refused while an entry dated in that period or later uses the size.
--   - A size is valid on a date if it has a price in effect for that date's period and is not archived
--     for it: from its first price's period up to the period before archived_from. This holds for every
--     way an entry can change (new, edited, restored by undo, or moved to another period by moving a
--     period's end), enforced by the triggers at the end of this file.

-- Prices ------------------------------------------------------------------------------------------
-- A period is named by its month (0011). The price of a period is the row with the latest from_month
-- on or before it. Looked up in the browser (src/domain/prices.ts).

create table copy_prices (
  from_month date primary key check (extract(day from from_month) = 1),
  price_centavos integer not null check (price_centavos > 0)
);

create table anillado_prices (
  size_mm smallint not null references anillado_sizes (size_mm),
  from_month date not null check (extract(day from from_month) = 1),
  price_centavos integer not null check (price_centavos > 0),
  primary key (size_mm, from_month)
);

-- The current prices, from the first period on (Nov 2026 in production; Jul 2026 in the test
-- project, whose first period was moved back by supabase/dev/first_period_june.sql).
insert into copy_prices (from_month, price_centavos)
select first_period_month(), price_centavos from copy_price;

insert into anillado_prices (size_mm, from_month, price_centavos)
select size_mm, first_period_month(), price_centavos from anillado_sizes;

-- One place for prices: no old copy left to read by mistake.
drop table copy_price;
alter table anillado_sizes drop column price_centavos;

-- Read by the logged-in operator only (the global report, the "Listas" screen); the shared device
-- does not need them. Same rule as 0010: revoke all, then grant only what the app uses.
alter table copy_prices enable row level security;
alter table anillado_prices enable row level security;
revoke all on copy_prices, anillado_prices from anon, authenticated;
grant select on copy_prices, anillado_prices to authenticated;
create policy "Logged-in users can read copy prices" on copy_prices
  for select to authenticated using (true);
create policy "Logged-in users can read anillado prices" on anillado_prices
  for select to authenticated using (true);

-- Archived sizes ----------------------------------------------------------------------------------
-- The period it is archived from; null = active. Readable like the rest of the table (0010).

alter table anillado_sizes add column archived_from date
  check (extract(day from archived_from) = 1);

-- The rule, in one place --------------------------------------------------------------------------

-- The period that contains a date (its month), or null before the first period. Ends can move up to
-- a month (0012), so only the month before, the date's own month and the month after can contain it.
create function period_month_of(p_date date) returns date
language sql stable
set search_path = public
as $$
  select m::date
  from generate_series(date_trunc('month', p_date::timestamp) - interval '1 month',
                       date_trunc('month', p_date::timestamp) + interval '1 month',
                       interval '1 month') as m
  where m >= first_period_month()
    and p_date between period_start(m::date) and period_end(m::date)
$$;

create function size_valid_on(p_size_mm smallint, p_date date) returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select from anillado_sizes s
    where s.size_mm = p_size_mm
      and (s.archived_from is null or period_month_of(p_date) < s.archived_from)
      and exists (select from anillado_prices p
                  where p.size_mm = s.size_mm and p.from_month <= period_month_of(p_date)))
$$;

-- Raises anillado_size_not_valid if an entry dated between the two dates has a size not valid on its
-- date. Reads the rows as they are now, so it is right however they were changed.
create function check_anillado_sizes(p_from date, p_to date) returns void
language plpgsql stable
set search_path = public
as $$
begin
  if exists (
    select from entries e join entry_anillados a on a.entry_id = e.id
    where e.entry_date between p_from and p_to
      and not size_valid_on(a.size_mm, e.entry_date)
  ) then
    raise exception 'anillado_size_not_valid';
  end if;
end;
$$;

-- Internal functions, with "today" as a parameter for the tests (as apply_period_end, 0011) --------
-- Errors: price_not_positive, period_locked (not the previous or current period),
-- anillado_size_in_use. An unknown size fails on the foreign key.

create function apply_copy_price(p_from date, p_price_centavos integer, p_today date) returns void
language plpgsql
set search_path = public
as $$
begin
  if coalesce(p_price_centavos, 0) <= 0 then
    raise exception 'price_not_positive';
  end if;
  if not exists (select from periods_as_of(p_today) p where p.month = p_from and p.changeable) then
    raise exception 'period_locked';
  end if;

  insert into copy_prices (from_month, price_centavos) values (p_from, p_price_centavos)
  on conflict (from_month) do update set price_centavos = excluded.price_centavos;
end;
$$;

create function apply_anillado_price(p_size_mm smallint, p_from date, p_price_centavos integer,
                                     p_today date) returns void
language plpgsql
set search_path = public
as $$
begin
  if coalesce(p_price_centavos, 0) <= 0 then
    raise exception 'price_not_positive';
  end if;
  if not exists (select from periods_as_of(p_today) p where p.month = p_from and p.changeable) then
    raise exception 'period_locked';
  end if;

  insert into anillado_prices (size_mm, from_month, price_centavos)
  values (p_size_mm, p_from, p_price_centavos)
  on conflict (size_mm, from_month) do update set price_centavos = excluded.price_centavos;
end;
$$;

create function apply_size_archived(p_size_mm smallint, p_from date, p_today date) returns void
language plpgsql
set search_path = public
as $$
begin
  if not exists (select from periods_as_of(p_today) p where p.month = p_from and p.changeable) then
    raise exception 'period_locked';
  end if;
  -- Checked here for a clearer error than the trigger's: the operator must first change those entries.
  if exists (
    select from entries e join entry_anillados a on a.entry_id = e.id
    where a.size_mm = p_size_mm and e.entry_date >= period_start(p_from)
  ) then
    raise exception 'anillado_size_in_use';
  end if;

  update anillado_sizes set archived_from = p_from where size_mm = p_size_mm;
end;
$$;

revoke execute on function period_month_of, size_valid_on, check_anillado_sizes, apply_copy_price,
  apply_anillado_price, apply_size_archived from public, anon, authenticated;

-- For the operator's screens (#101, #102) ---------------------------------------------------------
-- Admins only (0005); anyone else gets 'not_admin'.

create function set_copy_price(p_from date, p_price_centavos integer) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  perform apply_copy_price(p_from, p_price_centavos, (now() at time zone 'America/La_Paz')::date);
end;
$$;

create function set_anillado_price(p_size_mm smallint, p_from date, p_price_centavos integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  perform apply_anillado_price(p_size_mm, p_from, p_price_centavos,
                               (now() at time zone 'America/La_Paz')::date);
end;
$$;

create function archive_anillado_size(p_size_mm smallint, p_from date) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  perform apply_size_archived(p_size_mm, p_from, (now() at time zone 'America/La_Paz')::date);
end;
$$;

-- Usable again in every period it has a price for.
create function reactivate_anillado_size(p_size_mm smallint) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  update anillado_sizes set archived_from = null where size_mm = p_size_mm;
end;
$$;

revoke execute on function set_copy_price, set_anillado_price, archive_anillado_size,
  reactivate_anillado_size from public, anon;
grant execute on function set_copy_price, set_anillado_price, archive_anillado_size,
  reactivate_anillado_size to authenticated;

-- Enforcement: triggers checked at the end of each transaction ------------------------------------
-- Deferred, so that a function may change an entry's date before replacing its anillados
-- (update_entry, 0009) without a false error in between. At the end, the rows as they are then are
-- checked; one failure undoes the whole call. Every path is covered, including those that do not go
-- through check_entry (restore_entry, 0009) and the ones still to be written.

-- An entry's anillados added or changed, or its date changed: that entry.
create function entry_sizes_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_id bigint;
  saved_date date;
begin
  -- Two statements, not one case expression: PL/pgSQL checks every field named on NEW, even in a
  -- branch that is not taken, and entries has no entry_id.
  if tg_table_name = 'entries' then
    changed_id := new.id;
  else
    changed_id := new.entry_id;
  end if;
  select e.entry_date into saved_date from entries e where e.id = changed_id;
  if found then  -- deleted later in the same transaction: nothing to check
    perform check_anillado_sizes(saved_date, saved_date);
  end if;
  return null;
end;
$$;

-- A period's end moved: the entries of that period and the next one may have changed period.
create function period_end_sizes_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform check_anillado_sizes(period_start(new.month),
                               period_end((new.month + interval '1 month')::date));
  return null;
end;
$$;

-- A size archived from another period: every entry with it.
create function size_archived_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select from entries e join entry_anillados a on a.entry_id = e.id
    where a.size_mm = new.size_mm and not size_valid_on(a.size_mm, e.entry_date)
  ) then
    raise exception 'anillado_size_not_valid';
  end if;
  return null;
end;
$$;

-- Prices are only added or changed in amount, which never makes a size invalid: no trigger.

revoke execute on function entry_sizes_trigger, period_end_sizes_trigger, size_archived_trigger
  from public, anon, authenticated;

create constraint trigger entry_anillados_valid_size
  after insert or update on entry_anillados
  deferrable initially deferred
  for each row execute function entry_sizes_trigger();

create constraint trigger entries_valid_size
  after update of entry_date on entries
  deferrable initially deferred
  for each row execute function entry_sizes_trigger();

create constraint trigger period_ends_valid_size
  after insert or update on period_ends
  deferrable initially deferred
  for each row execute function period_end_sizes_trigger();

create constraint trigger anillado_sizes_valid_size
  after update of archived_from on anillado_sizes
  deferrable initially deferred
  for each row execute function size_archived_trigger();
