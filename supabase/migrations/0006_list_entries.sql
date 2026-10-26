-- 0006: the operator's list of entries (admin screens).
-- Apply once, in the Supabase SQL Editor, after 0005. Never edit after applying: write 0007_... instead.

-- Entries whose service date (entry_date) is between p_from and p_to, both included,
-- newest saved first, with their anillados and the department name (also for hidden
-- departments). Only for admins (0005); anyone else gets the error code 'not_admin'.

create function list_entries(p_from date, p_to date)
returns table (
  id bigint,
  entry_date date,
  created_at timestamptz,
  area_id smallint,
  area_name text,
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
  select e.id, e.entry_date, e.created_at, e.area_id, ar.name, e.name, e.description, e.copias,
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

revoke execute on function list_entries from public, anon;
grant execute on function list_entries to authenticated;
