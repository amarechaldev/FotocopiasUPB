-- 0001: departments, anillado sizes, entries, and the function that registers an entry.
-- Apply once, in the Supabase SQL Editor. Never edit after applying: write 0002_... instead.

-- Reference data -----------------------------------------------------------

create table areas (
  id smallint generated always as identity primary key,
  name text not null unique,
  active boolean not null default true  -- false = hidden from the form, kept for old entries
);

insert into areas (name) values
  ('VRA'),
  ('Administración'),
  ('Empresariales'),
  ('Ingenierías'),
  ('DAAE Admisiones'),
  ('DAAE Registros'),
  ('Internacionalización'),
  ('Voluntariado'),
  ('Orientación'),
  ('DAAE Cultura'),
  ('DAAE Deportes'),
  ('Marketing');

create table anillado_sizes (
  size_mm smallint primary key,
  price_centavos integer not null check (price_centavos >= 0)
);

-- Prices from docs/05-report-analysis.md, in centavos (Bs 4.00 = 400).
insert into anillado_sizes (size_mm, price_centavos) values
  (7, 400), (9, 450), (12, 500), (14, 550), (17, 600), (20, 650), (23, 700),
  (25, 750), (29, 800), (33, 850), (40, 1000), (45, 1200), (50, 2000);

-- Entries ------------------------------------------------------------------

create table entries (
  id bigint generated always as identity primary key,
  -- The date the service was used: today in Bolivia by default, editable by staff.
  entry_date date not null default (now() at time zone 'America/La_Paz')::date,
  area_id smallint not null references areas (id),
  name text not null check (btrim(name) <> ''),
  description text not null check (btrim(description) <> ''),
  copias integer not null default 0 check (copias >= 0),
  -- When the row was saved (UTC), independent of entry_date.
  created_at timestamptz not null default now()
);

-- One request can include several anillados of different sizes.
create table entry_anillados (
  id bigint generated always as identity primary key,
  entry_id bigint not null references entries (id) on delete cascade,
  size_mm smallint not null references anillado_sizes (size_mm),
  quantity integer not null check (quantity > 0)
);

create index entry_anillados_entry_id_idx on entry_anillados (entry_id);
create index entries_entry_date_idx on entries (entry_date);

-- Access rules (Row Level Security) ----------------------------------------
-- With RLS on and no policy, the browser's public key can do nothing.
-- We only open what the tablet needs: reading the two lists.

alter table areas enable row level security;
alter table anillado_sizes enable row level security;
alter table entries enable row level security;
alter table entry_anillados enable row level security;

grant select on areas, anillado_sizes to anon;
create policy "Anyone can read areas" on areas for select to anon using (true);
create policy "Anyone can read anillado sizes" on anillado_sizes for select to anon using (true);

-- Registering an entry -----------------------------------------------------
-- The entry and its anillados are saved in one transaction: either all rows are
-- saved or none. The function runs with its owner's rights (security definer),
-- so the browser can register entries without being able to read or change them.

create function register_entry(
  p_entry_date date,
  p_area_id smallint,
  p_name text,
  p_description text,
  p_copias integer,
  p_anillados jsonb default '[]'  -- e.g. [{"size_mm": 12, "quantity": 2}]
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  insert into entries (entry_date, area_id, name, description, copias)
  values (coalesce(p_entry_date, (now() at time zone 'America/La_Paz')::date),
          p_area_id, btrim(p_name), btrim(p_description), coalesce(p_copias, 0))
  returning id into new_id;

  insert into entry_anillados (entry_id, size_mm, quantity)
  select new_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(p_anillados) as a;

  return new_id;
end;
$$;

revoke execute on function register_entry from public;
grant execute on function register_entry to anon, authenticated;
