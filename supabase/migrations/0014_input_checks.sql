-- 0014: too-vague descriptions and dates before the first period are refused (story #3, task #71).
-- Apply once, in the Supabase SQL Editor, after 0013: first in the test project; in production only
-- after the app that understands the new error codes (#72) is deployed: the current app would show
-- them as unknown errors. Never edit after applying: write 0015_... instead.
-- Tests: supabase/tests/input_checks.sql.

-- Too-vague descriptions --------------------------------------------------------------------
-- An entry described only as one of these is useless as proof (decision log 2026-10-21).
-- The operator's list: docs/description-lists.md. Developer-maintained in the MVP.
-- Compared with normalize_name (0002): capitals, accents and spaces do not matter, so "COPIAS"
-- and " fotocópias " are refused, but a longer description ("Copias del examen") is not.

create table vague_descriptions (
  description text primary key check (btrim(description) <> '')
);

create unique index vague_descriptions_unique on vague_descriptions (normalize_name(description));

insert into vague_descriptions (description) values
  ('Copia'),
  ('Copias'),
  ('Fotocopia'),
  ('Fotocopias'),
  ('Documento'),
  ('Documentos');

-- Read by the browser, staff and operator alike, so the form can say so before saving (#72).
-- Same rule as 0010: revoke all, then grant only what the app uses.
alter table vague_descriptions enable row level security;
revoke all on vague_descriptions from anon, authenticated;
grant select on vague_descriptions to anon, authenticated;
create policy "Anyone can read the too-vague descriptions" on vague_descriptions
  for select to anon, authenticated using (true);

create function description_is_vague(p_description text) returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select from vague_descriptions v
    where normalize_name(v.description) = normalize_name(p_description)
  )
$$;

-- The new rules, in one place -----------------------------------------------------------------
-- For every entry saved, by staff or by the operator, new or edited (#3).
-- Errors: date_before_first_period, description_vague.

create function check_date_and_description(p_entry_date date, p_description text) returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if p_entry_date < first_period_start() then
    raise exception 'date_before_first_period';
  end if;
  if description_is_vague(p_description) then
    raise exception 'description_vague';
  end if;
end;
$$;

revoke execute on function description_is_vague, check_date_and_description
  from public, anon, authenticated;

-- Edits and manual entries (same as 0009, plus the new rules) --------------------------------

create or replace function check_entry(
  p_account_id bigint,
  p_entry_date date,
  p_area_id smallint,
  p_description text,
  p_copias integer,
  p_anillados jsonb
) returns text
language plpgsql
stable
set search_path = public
as $$
declare
  account_name text;
begin
  select a.name into account_name from accounts a where a.id = p_account_id;
  if not found then
    raise exception 'account_invalid';
  end if;
  if p_entry_date is null then
    raise exception 'date_required';
  end if;
  if btrim(coalesce(p_description, '')) = '' then
    raise exception 'description_required';
  end if;
  if not exists (select from areas where areas.id = p_area_id) then
    raise exception 'area_invalid';
  end if;
  if entry_is_empty(p_copias, p_anillados) then
    raise exception 'entry_empty';
  end if;
  perform check_date_and_description(p_entry_date, p_description);
  return account_name;
end;
$$;

-- Staff entries (same as 0008, plus the new rules) --------------------------------------------
-- After the PIN check, so a wrong PIN is still reported first. The date checked is the one saved.

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
  if not found then
    raise exception 'account_invalid';
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
