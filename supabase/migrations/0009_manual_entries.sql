-- 0009: the operator registers entries for other people (e.g. from the paper notebook).
-- Apply once, in the Supabase SQL Editor, after 0008. Never edit after applying: write 0010_... instead.
-- Safe before the app that uses it: the current app ignores the new list column, and the
-- current undo only calls restore_entry, whose new parameter has a default.

-- Manually entered entries ---------------------------------------------------------
-- true = registered by the operator on someone's behalf. Shown as "Ingreso manual" in her
-- list only, never in the reports (decision log 2026-10-21).

alter table entries add column manual boolean not null default false;

-- The checks shared by edits and manual entries -------------------------------------
-- Same rules as a new staff entry; returns the account's name for the entry.
-- Not callable from the browser: only through the admin functions below.

create function check_entry(
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
  return account_name;
end;
$$;

revoke execute on function check_entry from public, anon, authenticated;

-- Editing (same as 0008, with the checks moved to check_entry) ----------------------

create or replace function update_entry(
  p_id bigint,
  p_account_id bigint,
  p_entry_date date,
  p_area_id smallint,
  p_description text,
  p_copias integer,
  p_anillados jsonb default '[]'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  account_name text;
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  account_name := check_entry(p_account_id, p_entry_date, p_area_id, p_description,
                              p_copias, p_anillados);

  update entries
  set entry_date = p_entry_date,
      area_id = p_area_id,
      account_id = p_account_id,
      name = account_name,
      description = btrim(p_description),
      copias = coalesce(p_copias, 0),
      modified_at = now()
  where id = p_id;
  if not found then
    raise exception 'entry_missing';
  end if;

  delete from entry_anillados where entry_id = p_id;
  insert into entry_anillados (entry_id, size_mm, quantity)
  select p_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(coalesce(p_anillados, '[]')) as a;
end;
$$;

-- Registering an entry for someone else ---------------------------------------------
-- No PIN: the operator is logged in, and the person wrote the request in the notebook.
-- Errors: not_admin plus the check_entry codes.

create function register_manual_entry(
  p_account_id bigint,
  p_entry_date date,
  p_area_id smallint,
  p_description text,
  p_copias integer,
  p_anillados jsonb default '[]'
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  account_name text;
  new_id bigint;
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  account_name := check_entry(p_account_id, p_entry_date, p_area_id, p_description,
                              p_copias, p_anillados);

  insert into entries (entry_date, area_id, account_id, name, description, copias, manual)
  values (p_entry_date, p_area_id, p_account_id, account_name, btrim(p_description),
          coalesce(p_copias, 0), true)
  returning id into new_id;

  insert into entry_anillados (entry_id, size_mm, quantity)
  select new_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(coalesce(p_anillados, '[]')) as a;

  return new_id;
end;
$$;

-- The operator's list (replaces 0008: one more column, so it must be dropped first) --

drop function list_entries(date, date);

create function list_entries(p_from date, p_to date)
returns table (
  id bigint,
  entry_date date,
  created_at timestamptz,
  modified_at timestamptz,
  manual boolean,
  area_id smallint,
  area_name text,
  account_id bigint,
  name text,
  description text,
  copias integer,
  anillados jsonb  -- e.g. [{"size_mm": 12, "quantity": 2}], smallest size first
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

  -- Columns are always qualified (e., ar., a.): the output columns above share their names.
  return query
  select e.id, e.entry_date, e.created_at, e.modified_at, e.manual, e.area_id, ar.name,
         e.account_id, e.name, e.description, e.copias,
         coalesce(
           (select jsonb_agg(jsonb_build_object('size_mm', a.size_mm, 'quantity', a.quantity)
                             order by a.size_mm)
            from entry_anillados a
            where a.entry_id = e.id),
           '[]'::jsonb)
  from entries e
  join areas ar on ar.id = e.area_id
  where e.entry_date between p_from and p_to
  order by e.created_at desc;
end;
$$;

-- Undo (replaces 0008: also puts back the manual flag) ------------------------------

drop function restore_entry(bigint, date, timestamptz, timestamptz, smallint, bigint, text,
                            text, integer, jsonb);

create function restore_entry(
  p_id bigint,
  p_entry_date date,
  p_created_at timestamptz,
  p_modified_at timestamptz,
  p_area_id smallint,
  p_account_id bigint,
  p_name text,
  p_description text,
  p_copias integer,
  p_anillados jsonb,
  p_manual boolean default false
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  delete from entries where id = p_id;  -- the edited version, if any
  -- overriding system value: reuse the old number instead of taking a new one.
  insert into entries (id, entry_date, created_at, modified_at, manual, area_id, account_id,
                       name, description, copias)
  overriding system value
  values (p_id, p_entry_date, p_created_at, p_modified_at, coalesce(p_manual, false),
          p_area_id, p_account_id, p_name, p_description, p_copias);

  insert into entry_anillados (entry_id, size_mm, quantity)
  select p_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(coalesce(p_anillados, '[]')) as a;
end;
$$;

revoke execute on function list_entries, register_manual_entry, restore_entry from public, anon;
grant execute on function list_entries, register_manual_entry, restore_entry to authenticated;
