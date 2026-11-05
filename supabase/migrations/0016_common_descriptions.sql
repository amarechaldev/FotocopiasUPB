-- 0016: common descriptions per department, suggested on the entry forms (story #32, task #74).
-- Apply once, in the Supabase SQL Editor, after 0015: first in the test project, then in production
-- any time before the story's PR is merged (it only adds a table that nothing reads yet).
-- Never edit after applying: write 0017_... instead. Tests: supabase/tests/common_descriptions.sql.

-- The operator's list: docs/description-lists.md. Developer-maintained in the MVP; the operator
-- edits it after the MVP (#33). One row per department and description: a description used by three
-- departments is three rows. A department without rows gets no suggestions; free text is always
-- allowed.
create table common_descriptions (
  area_id smallint not null references areas (id),
  description text not null check (btrim(description) <> ''),
  primary key (area_id, description)
);

-- "Exámenes" and "examenes" are the same description (normalize_name, 0002).
create unique index common_descriptions_unique
  on common_descriptions (area_id, normalize_name(description));

-- Joined to areas by name, not by id. A misspelt name would drop its rows: the tests count them.
insert into common_descriptions (area_id, description)
select a.id, d.description
from (values
  ('Empresariales', 'Exámenes'),
  ('Empresariales', 'Control'),
  ('Empresariales', 'Control de lectura'),
  ('Empresariales', 'Prácticas'),
  ('Ingenierías', 'Exámenes'),
  ('Ingenierías', 'Control'),
  ('Ingenierías', 'Control de lectura'),
  ('Ingenierías', 'Prácticas'),
  ('Marketing', 'Facturas'),
  ('Marketing', 'Cotizaciones'),
  ('Marketing', 'Rendición'),
  ('Marketing', '100 mejores'),
  ('Marketing', 'UPBmatch'),
  ('DAAE Cultura', 'Rendición'),
  ('DAAE Cultura', '100 mejores'),
  ('DAAE Cultura', 'UPBmatch'),
  ('DAAE Cultura', 'Carnet de identidad'),
  ('DAAE Deportes', 'Rendición'),
  ('DAAE Deportes', '100 mejores'),
  ('DAAE Deportes', 'UPBmatch'),
  ('DAAE Deportes', 'Carnet de identidad'),
  ('VRA', 'Cartas'),
  ('VRA', 'Diplomas'),
  ('VRA', 'Títulos'),
  ('VRA', 'Constancia entrega diplomas'),
  ('VRA', 'Constancia entrega títulos')
) as d (area_name, description)
join areas a on a.name = d.area_name;

-- Read by the browser, staff and operator alike, for the suggestions (#75).
-- Same rule as 0010: revoke all, then grant only what the app uses.
alter table common_descriptions enable row level security;
revoke all on common_descriptions from anon, authenticated;
grant select on common_descriptions to anon, authenticated;
create policy "Anyone can read the common descriptions" on common_descriptions
  for select to anon, authenticated using (true);
