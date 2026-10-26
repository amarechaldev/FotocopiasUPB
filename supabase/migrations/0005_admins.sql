-- 0005: who can open the admin (operator) screens.
-- Apply once, in the Supabase SQL Editor, after 0004. Never edit after applying: write 0006_... instead.

-- The operator logs in with Supabase Auth (email + password); Supabase stores only a bcrypt
-- hash of the password, in auth.users. Being logged in is not enough: only the users listed
-- here are admins. Every admin function starts by checking is_admin(), so a stray auth user
-- (e.g. if public sign-ups were switched on by mistake) can do nothing.
-- Rows are added by hand in the SQL Editor, never in a migration (it would put an email in git):
--   insert into admins (user_id) select id from auth.users where email = '...';

create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- No policies: the browser cannot read or change this table, only call is_admin().
alter table admins enable row level security;
revoke all on admins from anon, authenticated;

-- True when the person calling is logged in and listed in admins.
create function is_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select from admins where user_id = auth.uid())
$$;

revoke execute on function is_admin from public, anon;
grant execute on function is_admin to authenticated;
