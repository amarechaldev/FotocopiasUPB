-- 0018: the operator manages staff accounts (story #31, task #92): edit, PIN reset, archive,
-- reactivate, delete.
-- Apply once, in the Supabase SQL Editor, after 0017: first in the test project, then in production.
-- Safe in production before the app that uses it: nothing can be archived or reset until the
-- operator's screen exists (#93), and the current app ignores the new list_accounts column.
-- Never edit after applying: write 0019_... instead. Tests: supabase/tests/account_management.sql.

-- Accounts -------------------------------------------------------------------------------------
-- Archived: hidden from the staff name list and refused for new entries, kept for the entries
-- that refer to it. Its name stays taken: accounts_name_unique (0002) covers every row (PO).
-- PIN reset pending: launched by the operator; the person chooses a new PIN on the shared device
-- the next time they choose their name (#94). Meanwhile the old PIN no longer works.

alter table accounts
  add column archived boolean not null default false,
  add column pin_reset_pending boolean not null default false;

-- The checks shared by the operator's edits and the staff's own edits (#30) ---------------------
-- Same error codes as create_account (0002). A department is valid if it is active, or already one
-- of the account's: an account keeps a department archived later (#33) while other fields change.
-- Returns the cleaned name. Not callable from the browser: only through the functions below.

create function check_account_fields(
  p_account_id bigint,
  p_name text,
  p_area_ids smallint[],
  p_default_area_id smallint
) returns text
language plpgsql
stable
set search_path = public
as $$
declare
  clean_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if clean_name = '' then
    raise exception 'name_required';
  end if;
  if coalesce(cardinality(p_area_ids), 0) = 0 then
    raise exception 'areas_required';
  end if;
  if exists (
    select from unnest(p_area_ids) as chosen(id)
    where not exists (select from areas where areas.id = chosen.id and areas.active)
      and not exists (select from account_areas aa
                      where aa.account_id = p_account_id and aa.area_id = chosen.id)
  ) then
    raise exception 'area_invalid';
  end if;
  if p_default_area_id is null or not (p_default_area_id = any (p_area_ids)) then
    raise exception 'default_invalid';
  end if;
  return clean_name;
end;
$$;

revoke execute on function check_account_fields from public, anon, authenticated;

-- The operator's functions -----------------------------------------------------------------------
-- Admins only (0005); anyone else gets 'not_admin'. Other error codes, turned into Spanish
-- messages by the app: account_invalid, name_required, areas_required, area_invalid,
-- default_invalid, name_taken, account_has_entries.

-- Every account, archived ones included, never the PIN hash. entry_count = 0: it can be deleted.
create function list_accounts_admin()
returns table (
  id bigint,
  name text,
  area_ids smallint[],
  default_area_id smallint,
  archived boolean,
  pin_reset_pending boolean,
  entry_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  -- Columns are always qualified (a., aa., e.): the output columns above share their names.
  return query
  select a.id,
         a.name,
         array_agg(aa.area_id order by aa.area_id),
         (array_agg(aa.area_id) filter (where aa.is_default))[1],
         a.archived,
         a.pin_reset_pending,
         (select count(*)::integer from entries e where e.account_id = a.id)
  from accounts a
  join account_areas aa on aa.account_id = a.id
  group by a.id
  order by normalize_name(a.name);
end;
$$;

-- Name, departments and default department; never the PIN. The new name also goes on all the
-- account's entries, closed periods included (PO, 05/11): entries.name is what reports print.
create function update_account(
  p_account_id bigint,
  p_name text,
  p_area_ids smallint[],
  p_default_area_id smallint
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select from accounts where id = p_account_id) then
    raise exception 'account_invalid';
  end if;
  clean_name := check_account_fields(p_account_id, p_name, p_area_ids, p_default_area_id);

  begin
    update accounts set name = clean_name where id = p_account_id;
  exception when unique_violation then
    raise exception 'name_taken';
  end;
  update entries set name = clean_name where account_id = p_account_id and name <> clean_name;

  delete from account_areas where account_id = p_account_id;
  insert into account_areas (account_id, area_id, is_default)
  select distinct p_account_id, chosen.id, chosen.id = p_default_area_id
  from unnest(p_area_ids) as chosen(id);
end;
$$;

-- Start (true) or cancel (false) a PIN reset. Cancelling puts the old PIN back in use.
create function set_pin_reset(p_account_id bigint, p_pending boolean) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  update accounts set pin_reset_pending = coalesce(p_pending, false) where id = p_account_id;
  if not found then
    raise exception 'account_invalid';
  end if;
end;
$$;

-- Archive (true) or reactivate (false).
create function set_account_archived(p_account_id bigint, p_archived boolean) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  update accounts set archived = coalesce(p_archived, false) where id = p_account_id;
  if not found then
    raise exception 'account_invalid';
  end if;
end;
$$;

-- Only an account without entries; one with entries can only be archived (#31).
create function delete_account(p_account_id bigint) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if exists (select from entries where account_id = p_account_id) then
    raise exception 'account_has_entries';
  end if;
  delete from accounts where id = p_account_id; -- its account_areas go too (on delete cascade)
  if not found then
    raise exception 'account_invalid';
  end if;
end;
$$;

revoke execute on function list_accounts_admin, update_account, set_pin_reset,
  set_account_archived, delete_account from public, anon;
grant execute on function list_accounts_admin, update_account, set_pin_reset,
  set_account_archived, delete_account to authenticated;

-- Staff: choosing a new PIN after a reset -------------------------------------------------------
-- Only while a reset is pending (the operator launched it with the person present, decision log
-- 2026-10-21). "Entered twice" is checked by the form, as when creating an account.
-- Errors: account_invalid, pin_reset_not_pending, pin_invalid.

create function set_new_pin(p_account_id bigint, p_pin text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  account accounts%rowtype;
begin
  select * into account from accounts where id = p_account_id;
  if not found or account.archived then
    raise exception 'account_invalid';
  end if;
  if not account.pin_reset_pending then
    raise exception 'pin_reset_not_pending';
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    raise exception 'pin_invalid';
  end if;
  update accounts
  set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')), pin_reset_pending = false
  where id = p_account_id;
end;
$$;

revoke execute on function set_new_pin from public;
grant execute on function set_new_pin to anon, authenticated;

-- The staff name list (replaces 0002) ----------------------------------------------------------
-- Archived accounts are left out; pin_reset_pending tells the form to ask for a new PIN (#94).
-- Dropped and created again: a function's columns cannot change with create or replace.

drop function list_accounts();

create function list_accounts()
returns table (
  id bigint,
  name text,
  area_ids smallint[],
  default_area_id smallint,
  pin_reset_pending boolean
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
         a.pin_reset_pending
  from accounts a
  join account_areas aa on aa.account_id = a.id
  where not a.archived
  group by a.id
  order by normalize_name(a.name)
$$;

revoke execute on function list_accounts from public;
grant execute on function list_accounts to anon, authenticated;

-- Staff entries (same as 0014, plus archived accounts and pending resets) -----------------------
-- The operator's edits and manual entries (check_entry) are unchanged: she can still fix the
-- entries of an archived account.

create or replace function register_account_entry(
  p_account_id bigint,
  p_pin text,
  p_entry_date date,
  p_area_id smallint,
  p_description text,
  p_copias integer,
  p_anillados jsonb default '[]'  -- e.g. [{"size_mm": 12, "quantity": 2}]
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  account accounts%rowtype;
  saved_date date := coalesce(p_entry_date, (now() at time zone 'America/La_Paz')::date);
  new_id bigint;
begin
  select * into account from accounts where id = p_account_id;
  if not found or account.archived then
    raise exception 'account_invalid';
  end if;
  -- Before the PIN check: the old PIN must not work once a reset is launched.
  if account.pin_reset_pending then
    raise exception 'pin_reset_pending';
  end if;
  -- crypt() re-hashes the PIN with the salt stored in the hash; equal only for the right PIN.
  if account.pin_hash <> extensions.crypt(coalesce(p_pin, ''), account.pin_hash) then
    raise exception 'pin_wrong';
  end if;
  if entry_is_empty(p_copias, p_anillados) then
    raise exception 'entry_empty';
  end if;
  perform check_date_and_description(saved_date, p_description);

  insert into entries (entry_date, area_id, account_id, name, description, copias)
  values (saved_date, p_area_id, account.id, account.name, btrim(p_description),
          coalesce(p_copias, 0))
  returning id into new_id;

  insert into entry_anillados (entry_id, size_mm, quantity)
  select new_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(p_anillados) as a;

  return new_id;
end;
$$;
