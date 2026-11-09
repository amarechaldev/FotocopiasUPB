-- Tests for prices by period and archived anillado sizes (0020). Paste into the SQL Editor of the
-- TEST project only, after 0020. Everything runs in one transaction that is rolled back: no data is
-- left behind. The first failed check stops the script with its message; success = no error at the end.
-- Dates are pretended with p_today: "today" is 10/03/2027, so the current period is March 2027
-- (23/02–22/03), the previous one February (23/01–22/02). The project needs a row in admins.
-- The size checks are triggers deferred to the end of the transaction, which never comes here (the
-- script rolls back): the helpers force them with "set constraints all immediate" after each call.

begin;

delete from period_ends; -- default periods (undone by the rollback)

-- Helpers (pg_temp: they disappear with the session) --------------------------------------

create function pg_temp.as_operator() returns void
language sql as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', (select user_id from admins limit 1))::text, true)
$$;

create function pg_temp.as_stranger() returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid())::text, true)
$$;

-- The statement must work, including the deferred checks.
create function pg_temp.ok(p_sql text) returns void
language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;
  set constraints all deferred;
end;
$$;

-- The statement, or the deferred checks after it, must fail with this exact error code.
create function pg_temp.expect_error(p_sql text, p_code text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
    set constraints all immediate;
  exception when others then
    set constraints all deferred;
    assert sqlerrm = p_code, format('%s: expected %s, got %s', p_sql, p_code, sqlerrm);
    return;
  end;
  set constraints all deferred;
  raise exception '%: expected %, but it worked', p_sql, p_code;
end;
$$;

-- An operator's manual entry of the test account on that date; returns its id.
create function pg_temp.manual(p_date date, p_anillados jsonb) returns bigint
language plpgsql as $$
declare
  new_id bigint;
begin
  new_id := register_manual_entry((select account_id from t), p_date, (select area_id from t),
                                  'Prueba precios 0020', 0, p_anillados);
  set constraints all immediate;
  set constraints all deferred;
  return new_id;
end;
$$;

do $$ begin
  assert exists (select from admins), 'no admin in this project: log in once as the operator';
end $$;

-- Seeded prices ---------------------------------------------------------------------------------

do $$ begin
  assert (select count(*) from copy_prices) = 1, 'one copy price';
  assert (select from_month from copy_prices) = first_period_month(), 'copy price from the first period';
  assert (select count(*) from anillado_prices) = (select count(*) from anillado_sizes),
    'one price per size';
  assert not exists (select from anillado_prices where from_month <> first_period_month()),
    'anillado prices from the first period';
  assert not exists (select from anillado_sizes where archived_from is not null), 'no size archived';
end $$;

-- Test data: a size of 99 mm, priced from the current period, and a staff account ---------------

insert into anillado_sizes (size_mm) values (99);
select apply_anillado_price(99::smallint, '2027-03-01', 900, '2027-03-10');

create temp table t as
select (select min(id) from areas where active) as area_id,
       create_account('Prueba Precios Uno', '4444', array[(select min(id) from areas where active)],
                      (select min(id) from areas where active)) as account_id;

-- Not the operator: every operator function refuses --------------------------------------------

select pg_temp.as_stranger();
select pg_temp.expect_error($$select set_copy_price('2027-03-01', 40)$$, 'not_admin');
select pg_temp.expect_error($$select set_anillado_price(99::smallint, '2027-03-01', 950)$$, 'not_admin');
select pg_temp.expect_error($$select archive_anillado_size(99::smallint, '2027-03-01')$$, 'not_admin');
select pg_temp.expect_error($$select reactivate_anillado_size(99::smallint)$$, 'not_admin');

select pg_temp.as_operator();

-- Prices: from the previous or the current period only, positive ---------------------------------

select pg_temp.ok($$select apply_copy_price('2027-02-01', 40, '2027-03-10')$$);
select pg_temp.ok($$select apply_copy_price('2027-03-01', 45, '2027-03-10')$$);
select pg_temp.ok($$select apply_copy_price('2027-03-01', 50, '2027-03-10')$$); -- corrected
select pg_temp.expect_error($$select apply_copy_price('2027-01-01', 40, '2027-03-10')$$, 'period_locked');
select pg_temp.expect_error($$select apply_copy_price('2027-04-01', 40, '2027-03-10')$$, 'period_locked');
select pg_temp.expect_error($$select apply_copy_price('2027-03-15', 40, '2027-03-10')$$, 'period_locked');
select pg_temp.expect_error($$select apply_copy_price('2027-03-01', 0, '2027-03-10')$$, 'price_not_positive');
select pg_temp.expect_error($$select apply_copy_price('2027-03-01', -5, '2027-03-10')$$, 'price_not_positive');
select pg_temp.expect_error($$select apply_copy_price('2027-03-01', null, '2027-03-10')$$, 'price_not_positive');

select pg_temp.ok($$select apply_anillado_price(12::smallint, '2027-03-01', 600, '2027-03-10')$$);
select pg_temp.expect_error($$select apply_anillado_price(12::smallint, '2027-01-01', 600, '2027-03-10')$$,
                            'period_locked');
select pg_temp.expect_error($$select apply_anillado_price(12::smallint, '2027-03-01', 0, '2027-03-10')$$,
                            'price_not_positive');

do $$ begin
  assert (select price_centavos from copy_prices where from_month = '2027-02-01') = 40, 'copy Feb';
  assert (select price_centavos from copy_prices where from_month = '2027-03-01') = 50, 'copy Mar corrected';
  assert (select price_centavos from copy_prices where from_month = first_period_month()) = 30,
    'the first price is untouched';
  assert (select count(*) from anillado_prices where size_mm = 12) = 2, 'size 12: old and new price';
end $$;

-- A size is valid only from its first price's period ---------------------------------------------

-- The test entries, one row each by label: a statement "from e" must pick one with "where e.label",
-- or it runs once per entry.
create temp table e (label text primary key, id bigint);
insert into e values ('mar', pg_temp.manual('2027-03-01', '[{"size_mm": 99, "quantity": 1}]'));

-- Registering in February, by the operator or by staff: no price there yet.
select pg_temp.expect_error($$select pg_temp.manual('2027-02-10', '[{"size_mm": 99, "quantity": 1}]')$$,
                            'anillado_size_not_valid');
select pg_temp.expect_error(format($$select register_account_entry(%s, '4444', '2027-02-10', %s::smallint,
  'Prueba precios 0020', 0, '[{"size_mm": 99, "quantity": 1}]')$$, t.account_id, t.area_id),
  'anillado_size_not_valid') from t;
-- Editing an entry back into February.
select pg_temp.expect_error(format($$select update_entry(%s, %s, '2027-02-10', %s::smallint,
  'Prueba precios 0020', 0, '[{"size_mm": 99, "quantity": 1}]')$$, e.id, t.account_id, t.area_id),
  'anillado_size_not_valid') from e, t where e.label = 'mar';
-- Moving February's end later, which would put the 01/03 entry in February.
select pg_temp.expect_error($$select apply_period_end('2027-02-01', '2027-03-05', '2027-03-10')$$,
                            'anillado_size_not_valid');

-- Priced from February too: now it can be used there.
select pg_temp.ok($$select apply_anillado_price(99::smallint, '2027-02-01', 900, '2027-03-10')$$);
insert into e values ('feb15', pg_temp.manual('2027-02-15', '[{"size_mm": 99, "quantity": 1}]'));

-- Archiving --------------------------------------------------------------------------------------

-- Refused while an entry in March or later uses it, and never from an old period.
select pg_temp.expect_error($$select apply_size_archived(99::smallint, '2027-03-01', '2027-03-10')$$,
                            'anillado_size_in_use');
select pg_temp.expect_error($$select apply_size_archived(99::smallint, '2027-01-01', '2027-03-10')$$,
                            'period_locked');

-- The operator changes the March entry first, then archiving works.
select pg_temp.ok(format($$select update_entry(%s, %s, '2027-03-01', %s::smallint,
  'Prueba precios 0020', 0, '[{"size_mm": 12, "quantity": 1}]')$$, e.id, t.account_id, t.area_id))
from e, t where e.label = 'mar';
select pg_temp.ok($$select apply_size_archived(99::smallint, '2027-03-01', '2027-03-10')$$);
do $$ begin
  assert (select archived_from from anillado_sizes where size_mm = 99) = '2027-03-01', 'archived from March';
end $$;

-- From March on it cannot be used; before March it still can.
select pg_temp.expect_error($$select pg_temp.manual('2027-03-05', '[{"size_mm": 99, "quantity": 1}]')$$,
                            'anillado_size_not_valid');
insert into e values ('feb20', pg_temp.manual('2027-02-20', '[{"size_mm": 99, "quantity": 2}]'));

-- Moving a February entry with that size into March: refused until the size is removed.
select pg_temp.expect_error(format($$select update_entry(%s, %s, '2027-03-02', %s::smallint,
  'Prueba precios 0020', 0, '[{"size_mm": 99, "quantity": 2}]')$$, e.id, t.account_id, t.area_id),
  'anillado_size_not_valid') from e, t where e.label = 'feb20';
select pg_temp.ok(format($$select update_entry(%s, %s, '2027-03-02', %s::smallint,
  'Prueba precios 0020', 3, '[]')$$, e.id, t.account_id, t.area_id)) from e, t where e.label = 'feb20';

-- Moving February's end earlier, which would put the 15/02 entry in March.
select pg_temp.expect_error($$select apply_period_end('2027-02-01', '2027-02-12', '2027-03-10')$$,
                            'anillado_size_not_valid');
select pg_temp.ok($$select apply_period_end('2027-02-01', '2027-02-18', '2027-03-10')$$); -- 15/02 stays

-- Archiving from February directly in the table, bypassing the function: the trigger refuses it.
select pg_temp.expect_error($$update anillado_sizes set archived_from = '2027-02-01' where size_mm = 99$$,
                            'anillado_size_not_valid');

-- Reactivating: usable again in March.
select pg_temp.ok($$select reactivate_anillado_size(99::smallint)$$);
select pg_temp.manual('2027-03-05', '[{"size_mm": 99, "quantity": 1}]');

-- Reached only if every check above passed (the SQL Editor shows the last result).
select 'All price tests passed' as result;

rollback;
