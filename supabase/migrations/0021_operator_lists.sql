-- 0021: the operator edits the lists (story #33, task #100): departments, anillado sizes, common and
-- too-vague descriptions.
-- Apply once, in the Supabase SQL Editor, after 0020: first in the test project; in production right
-- after 0020 (both before the #33 PR is merged). Before applying, check that no department is
-- inactive (select * from areas where not active): none is expected, see the archived_from update.
-- Never edit after applying: write 0022_... instead. Tests: supabase/tests/operator_lists.sql.

-- Rules (PO, 08/11/2026):
--   - Departments are archived like anillado sizes (0020): from the previous or the current period,
--     refused while an entry dated in that period or later uses the department, reactivated, never
--     deleted. Entries dated before keep it.
--   - Archiving a department is allowed even if active staff accounts have it. Next time they choose
--     their name, the staff form asks those whose default it was to choose another, and warns once
--     those who had it as another department (list_accounts below; the form is a later task).
--   - Each common description appears once, with one or more departments; each too-vague description
--     once; no text is in both lists. Capitals, accents and spaces do not count (normalize_name, 0002).
--   - No empty texts. Prices stay positive (0020).

-- Text as the lists keep it: no spaces around it, single spaces inside (as account names, 0002).
create function clean_list_text(p_text text) returns text
language sql immutable
as $$ select regexp_replace(btrim(coalesce(p_text, '')), '\s+', ' ', 'g') $$;

-- Departments --------------------------------------------------------------------------------------
-- archived_from: the period it is archived from; null = in use. active stays, computed from it, so
-- every reader of active (the forms, check_account_fields in 0018, the tests) keeps working. An
-- archive never starts after the current period, so archived_from is not null = archived today.

alter table areas add column archived_from date check (extract(day from archived_from) = 1);

-- None expected: a department switched off by hand is archived from the current period.
update areas set archived_from = (select month from periods_as_of((now() at time zone 'America/La_Paz')::date)
                                  where is_current)
where not active;

alter table areas drop column active;
alter table areas add column active boolean generated always as (archived_from is null) stored;

-- "Ingenierias" and "Ingenierías" are the same department.
create unique index areas_name_unique on areas (normalize_name(name));

-- The rule, in one place: a department is valid on a date unless it is archived for that date's period.
create function area_valid_on(p_area_id smallint, p_date date) returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select from areas a
    where a.id = p_area_id
      and (a.archived_from is null or period_month_of(p_date) < a.archived_from))
$$;

-- Raises area_not_valid if an entry dated between the two dates has a department archived for it.
create function check_areas(p_from date, p_to date) returns void
language plpgsql stable
set search_path = public
as $$
begin
  if exists (
    select from entries e
    where e.entry_date between p_from and p_to
      and not area_valid_on(e.area_id, e.entry_date)
  ) then
    raise exception 'area_not_valid';
  end if;
end;
$$;

-- The staff whose department is archived ----------------------------------------------------------
-- One row per active account that had the department as one of its other (not default) departments
-- when it was archived: a warning for the staff form, shown until dismissed. A default department is
-- not noted here: list_accounts tells it directly, until the person chooses another.

create table account_area_notices (
  account_id bigint not null references accounts (id) on delete cascade,
  area_id smallint not null references areas (id),
  primary key (account_id, area_id)
);

-- No grants: read through list_accounts, cleared through dismiss_area_notices (see 0010).
alter table account_area_notices enable row level security;
revoke all on account_area_notices from anon, authenticated;

-- Internal functions, with "today" as a parameter for the tests (as 0011, 0020) ---------------------
-- Errors: name_required, area_name_taken, area_invalid, period_locked, area_in_use.

-- The cleaned name, if no other department has it.
create function check_area_name(p_area_id smallint, p_name text) returns text
language plpgsql stable
set search_path = public
as $$
declare
  clean_name text := clean_list_text(p_name);
begin
  if clean_name = '' then
    raise exception 'name_required';
  end if;
  if exists (select from areas a
             where normalize_name(a.name) = normalize_name(clean_name)
               and a.id is distinct from p_area_id) then
    raise exception 'area_name_taken';
  end if;
  return clean_name;
end;
$$;

create function apply_area_archived(p_area_id smallint, p_from date, p_today date) returns void
language plpgsql
set search_path = public
as $$
begin
  if not exists (select from areas where id = p_area_id) then
    raise exception 'area_invalid';
  end if;
  if not exists (select from periods_as_of(p_today) p where p.month = p_from and p.changeable) then
    raise exception 'period_locked';
  end if;
  -- Checked here for a clearer error than the trigger's: the operator must first change those entries.
  if exists (select from entries e where e.area_id = p_area_id and e.entry_date >= period_start(p_from)) then
    raise exception 'area_in_use';
  end if;

  update areas set archived_from = p_from where id = p_area_id;

  insert into account_area_notices (account_id, area_id)
  select aa.account_id, aa.area_id
  from account_areas aa join accounts a on a.id = aa.account_id
  where aa.area_id = p_area_id and not aa.is_default and not a.archived
  on conflict do nothing;
end;
$$;

-- Errors: size_invalid, size_taken, and those of apply_anillado_price (0020). One call: if the price
-- is refused, the size is not created either.
create function apply_new_size(p_size_mm smallint, p_from date, p_price_centavos integer, p_today date)
returns void
language plpgsql
set search_path = public
as $$
begin
  if coalesce(p_size_mm, 0) <= 0 then
    raise exception 'size_invalid';
  end if;
  if exists (select from anillado_sizes where size_mm = p_size_mm) then
    raise exception 'size_taken';
  end if;
  insert into anillado_sizes (size_mm) values (p_size_mm);
  perform apply_anillado_price(p_size_mm, p_from, p_price_centavos, p_today);
end;
$$;

revoke execute on function clean_list_text, area_valid_on, check_areas, check_area_name,
  apply_area_archived, apply_new_size from public, anon, authenticated;

-- For the operator's screens (#101, #102) ---------------------------------------------------------
-- Admins only (0005); anyone else gets 'not_admin'.

-- Last in the forms and the monthly report, which are ordered by id.
create function create_area(p_name text) returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id smallint;
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  insert into areas (name) values (check_area_name(null, p_name)) returning id into new_id;
  return new_id;
end;
$$;

-- The new name shows everywhere, in the reports of earlier periods too: they read it from areas.
create function rename_area(p_area_id smallint, p_name text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  update areas set name = check_area_name(p_area_id, p_name) where id = p_area_id;
  if not found then
    raise exception 'area_invalid';
  end if;
end;
$$;

create function archive_area(p_area_id smallint, p_from date) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  perform apply_area_archived(p_area_id, p_from, (now() at time zone 'America/La_Paz')::date);
end;
$$;

-- Usable again in every period; its warnings are no longer needed.
create function reactivate_area(p_area_id smallint) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  update areas set archived_from = null where id = p_area_id;
  delete from account_area_notices where area_id = p_area_id;
end;
$$;

create function create_anillado_size(p_size_mm smallint, p_from date, p_price_centavos integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  perform apply_new_size(p_size_mm, p_from, p_price_centavos, (now() at time zone 'America/La_Paz')::date);
end;
$$;

-- Common descriptions: one description, its departments. p_old null = a new one; otherwise the one to
-- change (text and departments are replaced together). A department must be in use, unless the
-- description already had it. Errors: description_required, areas_required, area_invalid,
-- description_missing, description_taken (and description_in_both_lists, from the trigger below).
create function save_common_description(p_old text, p_description text, p_area_ids smallint[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_text text := clean_list_text(p_description);
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if clean_text = '' then
    raise exception 'description_required';
  end if;
  if coalesce(cardinality(p_area_ids), 0) = 0 then
    raise exception 'areas_required';
  end if;
  if p_old is not null and not exists (
    select from common_descriptions c where normalize_name(c.description) = normalize_name(p_old)
  ) then
    raise exception 'description_missing';
  end if;
  if exists (
    select from common_descriptions c
    where normalize_name(c.description) = normalize_name(clean_text)
      and (p_old is null or normalize_name(c.description) <> normalize_name(p_old))
  ) then
    raise exception 'description_taken';
  end if;
  if exists (
    select from unnest(p_area_ids) as chosen(id)
    where not exists (select from areas a where a.id = chosen.id and a.archived_from is null)
      and not exists (select from common_descriptions c
                      where c.area_id = chosen.id
                        and normalize_name(c.description) = normalize_name(p_old))
  ) then
    raise exception 'area_invalid';
  end if;

  delete from common_descriptions c where normalize_name(c.description) = normalize_name(p_old);
  insert into common_descriptions (area_id, description)
  select distinct chosen.id, clean_text from unnest(p_area_ids) as chosen(id);
end;
$$;

create function delete_common_description(p_description text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  delete from common_descriptions c where normalize_name(c.description) = normalize_name(p_description);
  if not found then
    raise exception 'description_missing';
  end if;
end;
$$;

-- Too-vague descriptions: same rules, without departments. Entries already saved are not affected.
create function save_vague_description(p_old text, p_description text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_text text := clean_list_text(p_description);
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if clean_text = '' then
    raise exception 'description_required';
  end if;
  if p_old is not null and not exists (
    select from vague_descriptions v where normalize_name(v.description) = normalize_name(p_old)
  ) then
    raise exception 'description_missing';
  end if;
  if exists (
    select from vague_descriptions v
    where normalize_name(v.description) = normalize_name(clean_text)
      and (p_old is null or normalize_name(v.description) <> normalize_name(p_old))
  ) then
    raise exception 'description_taken';
  end if;

  delete from vague_descriptions v where normalize_name(v.description) = normalize_name(p_old);
  insert into vague_descriptions (description) values (clean_text);
end;
$$;

create function delete_vague_description(p_description text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  delete from vague_descriptions v where normalize_name(v.description) = normalize_name(p_description);
  if not found then
    raise exception 'description_missing';
  end if;
end;
$$;

revoke execute on function create_area, rename_area, archive_area, reactivate_area,
  create_anillado_size, save_common_description, delete_common_description, save_vague_description,
  delete_vague_description from public, anon;
grant execute on function create_area, rename_area, archive_area, reactivate_area,
  create_anillado_size, save_common_description, delete_common_description, save_vague_description,
  delete_vague_description to authenticated;

-- For the staff form ------------------------------------------------------------------------------

-- The staff name list (replaces 0018), with two more columns for an archived department:
-- default_area_archived (the form asks for another default; saved with update_own_account, 0019,
-- which lets an account keep departments it already has) and archived_area_names (the warnings
-- still to show). Dropped and created again: a function's columns cannot change with create or replace.
drop function list_accounts();

create function list_accounts()
returns table (
  id bigint,
  name text,
  area_ids smallint[],
  default_area_id smallint,
  pin_reset_pending boolean,
  default_area_archived boolean,
  archived_area_names text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         a.name,
         array_agg(aa.area_id order by aa.area_id),
         (array_agg(aa.area_id) filter (where aa.is_default))[1],
         a.pin_reset_pending,
         coalesce(bool_or(aa.is_default and ar.archived_from is not null), false),
         array(select n_area.name
               from account_area_notices n join areas n_area on n_area.id = n.area_id
               where n.account_id = a.id
               order by n_area.id)
  from accounts a
  join account_areas aa on aa.account_id = a.id
  join areas ar on ar.id = aa.area_id
  where not a.archived
  group by a.id
  order by normalize_name(a.name)
$$;

revoke execute on function list_accounts from public;
grant execute on function list_accounts to anon, authenticated;

-- The person has seen the warnings. No PIN: it only hides a message.
create function dismiss_area_notices(p_account_id bigint) returns void
language sql
security definer
set search_path = public
as $$
  delete from account_area_notices where account_id = p_account_id
$$;

revoke execute on function dismiss_area_notices from public;
grant execute on function dismiss_area_notices to anon, authenticated;

-- Enforcement: triggers -----------------------------------------------------------------------------
-- Departments: deferred to the end of the transaction, like the size triggers of 0020 (same reasons).

-- An entry added, or its department or date changed.
create function entry_area_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_date date;
begin
  select e.entry_date into saved_date from entries e where e.id = new.id;
  if found then  -- deleted later in the same transaction: nothing to check
    perform check_areas(saved_date, saved_date);
  end if;
  return null;
end;
$$;

-- A department archived from another period: every entry with it.
create function area_archived_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select from entries e where e.area_id = new.id and not area_valid_on(e.area_id, e.entry_date)) then
    raise exception 'area_not_valid';
  end if;
  return null;
end;
$$;

-- A period's end moved (replaces 0020): the departments of the entries that changed period too.
create or replace function period_end_sizes_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform check_anillado_sizes(period_start(new.month),
                               period_end((new.month + interval '1 month')::date));
  perform check_areas(period_start(new.month), period_end((new.month + interval '1 month')::date));
  return null;
end;
$$;

-- No text in both description lists, however it is written (not deferred: nothing needs a moment
-- with the text in both).
create function description_lists_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'common_descriptions' then
    if exists (select from vague_descriptions v
               where normalize_name(v.description) = normalize_name(new.description)) then
      raise exception 'description_in_both_lists';
    end if;
  elsif exists (select from common_descriptions c
                where normalize_name(c.description) = normalize_name(new.description)) then
    raise exception 'description_in_both_lists';
  end if;
  return null;
end;
$$;

revoke execute on function entry_area_trigger, area_archived_trigger, description_lists_trigger
  from public, anon, authenticated;

create constraint trigger entries_valid_area
  after insert or update of area_id, entry_date on entries
  deferrable initially deferred
  for each row execute function entry_area_trigger();

create constraint trigger areas_valid_archive
  after update of archived_from on areas
  deferrable initially deferred
  for each row execute function area_archived_trigger();

create trigger common_descriptions_not_vague
  after insert or update of description on common_descriptions
  for each row execute function description_lists_trigger();

create trigger vague_descriptions_not_common
  after insert or update of description on vague_descriptions
  for each row execute function description_lists_trigger();
