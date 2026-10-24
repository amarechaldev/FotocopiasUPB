-- 0003: entries tied to a staff account, PIN checked when the entry is saved.
-- Apply once, in the Supabase SQL Editor, after 0002. Never edit after applying: write 0004_... instead.
-- Additive only: the old register_entry keeps working for the current app until it is dropped (#40).

-- Entries ------------------------------------------------------------------
-- null = saved before accounts existed (Sprint 1 test entries) or through the old
-- register_entry. The name column stays: it keeps the name as it was when the entry was saved.

alter table entries add column account_id bigint references accounts (id);

create index entries_account_id_idx on entries (account_id);

-- Registering an entry with an account --------------------------------------
-- Same as register_entry, but the person is identified by account and PIN, and the
-- name comes from the account. Any department can be chosen: one outside the account
-- is only a warning in the app.
-- Errors are short codes; the app turns them into Spanish messages:
--   account_invalid, pin_wrong

create function register_account_entry(
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
  new_id bigint;
begin
  select * into account from accounts where id = p_account_id;
  if not found then
    raise exception 'account_invalid';
  end if;
  -- crypt() re-hashes the PIN with the salt stored in the hash; equal only for the right PIN.
  if account.pin_hash <> extensions.crypt(coalesce(p_pin, ''), account.pin_hash) then
    raise exception 'pin_wrong';
  end if;

  insert into entries (entry_date, area_id, account_id, name, description, copias)
  values (coalesce(p_entry_date, (now() at time zone 'America/La_Paz')::date),
          p_area_id, account.id, account.name, btrim(p_description), coalesce(p_copias, 0))
  returning id into new_id;

  insert into entry_anillados (entry_id, size_mm, quantity)
  select new_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(p_anillados) as a;

  return new_id;
end;
$$;

revoke execute on function register_account_entry from public;
grant execute on function register_account_entry to anon, authenticated;
