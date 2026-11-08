-- 0023: an anillado size without entries can be deleted (story #33), like a department (0022).
-- Apply once, in the Supabase SQL Editor, after 0022: first in the test project; in production with
-- 0020 to 0022, before the #33 PR is merged.
-- Never edit after applying: write 0024_... instead. Tests: supabase/tests/operator_lists.sql.

-- A size with entries can only be archived; one without entries (e.g. added by mistake) can be
-- deleted, with its prices. No account refers to a size.

-- Per size: the entries that use it. entry_count = 0: it can be deleted.
create function list_size_usage()
returns table (size_mm smallint, entry_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  -- Columns are always qualified (s., a.): the output columns above share their names.
  return query
  select s.size_mm,
         (select count(distinct a.entry_id)::integer from entry_anillados a where a.size_mm = s.size_mm)
  from anillado_sizes s
  order by s.size_mm;
end;
$$;

-- Errors: not_admin, size_invalid (no such size), anillado_size_has_entries.
create function delete_anillado_size(p_size_mm smallint) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select from anillado_sizes s where s.size_mm = p_size_mm) then
    raise exception 'size_invalid';
  end if;
  if exists (select from entry_anillados a where a.size_mm = p_size_mm) then
    raise exception 'anillado_size_has_entries';
  end if;

  delete from anillado_prices p where p.size_mm = p_size_mm;
  delete from anillado_sizes s where s.size_mm = p_size_mm;
end;
$$;

revoke execute on function list_size_usage, delete_anillado_size from public, anon;
grant execute on function list_size_usage, delete_anillado_size to authenticated;
