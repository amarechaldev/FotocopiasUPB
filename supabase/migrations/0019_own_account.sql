-- 0019: staff edit their own profile with their name and PIN (story #30, task #96).
-- Apply once, in the Supabase SQL Editor, after 0018: first in the test project, then in production.
-- Safe in production before the app that uses it: it only adds functions (update_account keeps
-- its behaviour), and the current app calls none of the new ones.
-- Never edit after applying: write 0020_... instead. Tests: supabase/tests/own_account.sql (and
-- supabase/tests/account_management.sql again, for update_account).

-- Staff "log in": name + PIN -------------------------------------------------------------------
-- No session: the PIN is checked again on every call. Same errors, in the same order, as
-- register_account_entry (0018): account_invalid, pin_reset_pending, pin_wrong. Saving an entry
-- already tells a wrong PIN apart, so this gives nobody anything new to guess with.

create function check_own_pin(p_account_id bigint, p_pin text) returns void
language plpgsql
stable
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
  -- Before the PIN check: the old PIN must not work once a reset is launched.
  if account.pin_reset_pending then
    raise exception 'pin_reset_pending';
  end if;
  -- crypt() re-hashes the PIN with the salt stored in the hash; equal only for the right PIN.
  if account.pin_hash <> extensions.crypt(coalesce(p_pin, ''), account.pin_hash) then
    raise exception 'pin_wrong';
  end if;
end;
$$;

-- Saving name and departments: one place for the operator (#31) and the person (#30) -----------
-- The body of update_account (0018), moved here so both screens follow the same rules. The new
-- name also goes on all the account's entries, closed periods included (PO, 05/11, for both).
-- Not callable from the browser: only through update_account and update_own_account.

create function save_account_fields(
  p_account_id bigint,
  p_name text,
  p_area_ids smallint[],
  p_default_area_id smallint
) returns void
language plpgsql
set search_path = public
as $$
declare
  clean_name text := check_account_fields(p_account_id, p_name, p_area_ids, p_default_area_id);
begin
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

revoke execute on function save_account_fields from public, anon, authenticated;

-- The operator's edit (replaces 0018, same behaviour) -----------------------------------------

create or replace function update_account(
  p_account_id bigint,
  p_name text,
  p_area_ids smallint[],
  p_default_area_id smallint
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select from accounts where id = p_account_id) then
    raise exception 'account_invalid';
  end if;
  perform save_account_fields(p_account_id, p_name, p_area_ids, p_default_area_id);
end;
$$;

-- The person's own edit ("Mi cuenta", #97) ----------------------------------------------------
-- Name, departments, default department and, if p_new_pin is not null, the PIN. "Entered twice"
-- is checked by the form, as when creating an account. One transaction: a refusal (e.g.
-- name_taken) changes nothing, not even the PIN.
-- Errors: those of check_own_pin, pin_invalid, and those of check_account_fields and name_taken.

create function update_own_account(
  p_account_id bigint,
  p_pin text,
  p_name text,
  p_area_ids smallint[],
  p_default_area_id smallint,
  p_new_pin text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform check_own_pin(p_account_id, p_pin);
  if p_new_pin is not null and p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'pin_invalid';
  end if;

  perform save_account_fields(p_account_id, p_name, p_area_ids, p_default_area_id);
  if p_new_pin is not null then
    update accounts
    set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf'))
    where id = p_account_id;
  end if;
end;
$$;

revoke execute on function check_own_pin, update_own_account from public;
grant execute on function check_own_pin, update_own_account to anon, authenticated;
