-- 0002: staff accounts (name, departments with a default one, PIN).
-- Apply once, in the Supabase SQL Editor, after 0001. Never edit after applying: write 0003_... instead.

-- Supabase keeps extensions in their own schema; both are usually installed already.
create extension if not exists pgcrypto with schema extensions;  -- crypt(), gen_salt(): PIN hashing
create extension if not exists unaccent with schema extensions;  -- unaccent(): 'María' -> 'Maria'

-- Names --------------------------------------------------------------------
-- Two names are the same account if they only differ in case, accents or spaces:
-- 'María  López ' and 'maria lopez' both become 'maria lopez'.
-- unaccent() is not marked immutable (its dictionary could change), so it cannot
-- be used in an index directly; this wrapper names the dictionary explicitly.

create function normalize_name(p_name text) returns text
language sql
immutable
strict
parallel safe
as $$
  select lower(regexp_replace(btrim(
    extensions.unaccent('extensions.unaccent'::regdictionary, p_name)), '\s+', ' ', 'g'))
$$;

-- Accounts -----------------------------------------------------------------

create table accounts (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> ''),
  -- bcrypt hash of the 4-digit PIN (salted, one-way). The PIN itself is never stored.
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create unique index accounts_name_unique on accounts (normalize_name(name));

-- The departments of each account; exactly one of them is the default
-- (at most one by the index below, at least one by create_account).
create table account_areas (
  account_id bigint not null references accounts (id) on delete cascade,
  area_id smallint not null references areas (id),
  is_default boolean not null default false,
  primary key (account_id, area_id)
);

create unique index account_areas_one_default on account_areas (account_id) where is_default;

-- Access rules (Row Level Security) ----------------------------------------
-- No policies: the browser cannot read or change these tables at all, only call
-- the functions below. The grants Supabase adds to new tables are also removed,
-- so pin_hash stays out of reach even if RLS were switched off by mistake.

alter table accounts enable row level security;
alter table account_areas enable row level security;
revoke all on accounts, account_areas from anon, authenticated;

-- Creating an account ------------------------------------------------------
-- Errors are short codes; the app turns them into Spanish messages:
--   name_required, pin_invalid, areas_required, area_invalid, default_invalid, name_taken

create function create_account(
  p_name text,
  p_pin text,
  p_area_ids smallint[],
  p_default_area_id smallint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  new_id bigint;
begin
  if clean_name = '' then
    raise exception 'name_required';
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    raise exception 'pin_invalid';
  end if;
  if coalesce(cardinality(p_area_ids), 0) = 0 then
    raise exception 'areas_required';
  end if;
  if exists (
    select from unnest(p_area_ids) as chosen(id)
    where not exists (select from areas where areas.id = chosen.id and areas.active)
  ) then
    raise exception 'area_invalid';
  end if;
  if p_default_area_id is null or not (p_default_area_id = any (p_area_ids)) then
    raise exception 'default_invalid';
  end if;

  begin
    insert into accounts (name, pin_hash)
    values (clean_name, extensions.crypt(p_pin, extensions.gen_salt('bf')))
    returning id into new_id;
  exception when unique_violation then
    raise exception 'name_taken';
  end;

  insert into account_areas (account_id, area_id, is_default)
  select distinct new_id, chosen.id, chosen.id = p_default_area_id
  from unnest(p_area_ids) as chosen(id);

  return new_id;
end;
$$;

-- Listing accounts ---------------------------------------------------------
-- For choosing your name at registration: names and departments, never the PIN hash.

create function list_accounts()
returns table (id bigint, name text, area_ids smallint[], default_area_id smallint)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         a.name,
         array_agg(aa.area_id order by aa.area_id),
         (array_agg(aa.area_id) filter (where aa.is_default))[1]
  from accounts a
  join account_areas aa on aa.account_id = a.id
  group by a.id, a.name
  order by normalize_name(a.name)
$$;

revoke execute on function create_account, list_accounts from public;
grant execute on function create_account, list_accounts to anon, authenticated;
