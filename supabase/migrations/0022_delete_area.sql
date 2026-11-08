-- 0022: a department without entries can be deleted (story #33).
-- Apply once, in the Supabase SQL Editor, after 0021: first in the test project; in production with
-- 0020 and 0021, before the #33 PR is merged.
-- Never edit after applying: write 0023_... instead. Tests: supabase/tests/operator_lists.sql.

-- Like staff accounts (0018): a department with entries can only be archived, one without entries
-- (e.g. created by mistake) can be deleted. Refused while a staff account has it, archived accounts
-- included: the operator removes it from those accounts first, so no account loses its main
-- department without her knowing. Its common descriptions and notices go with it.

-- Per department: its entries and the accounts that have it. entry_count = 0: it can be deleted.
create function list_area_usage()
returns table (area_id smallint, entry_count integer, account_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  -- Columns are always qualified (a., e., aa.): the output columns above share their names.
  return query
  select a.id,
         (select count(*)::integer from entries e where e.area_id = a.id),
         (select count(*)::integer from account_areas aa where aa.area_id = a.id)
  from areas a
  order by a.id;
end;
$$;

-- Errors: not_admin, area_invalid, area_has_entries, area_has_accounts.
create function delete_area(p_area_id smallint) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select from areas a where a.id = p_area_id) then
    raise exception 'area_invalid';
  end if;
  if exists (select from entries e where e.area_id = p_area_id) then
    raise exception 'area_has_entries';
  end if;
  if exists (select from account_areas aa where aa.area_id = p_area_id) then
    raise exception 'area_has_accounts';
  end if;

  delete from common_descriptions c where c.area_id = p_area_id;
  delete from account_area_notices n where n.area_id = p_area_id;
  delete from areas a where a.id = p_area_id;
end;
$$;

revoke execute on function list_area_usage, delete_area from public, anon;
grant execute on function list_area_usage, delete_area to authenticated;
