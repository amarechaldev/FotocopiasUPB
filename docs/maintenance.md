# Maintenance

How-tos for the developer after the handover. The app has no screen for these, by decision.

## Reset the operator's password

The app has no self-service password reset. The decision log (2026-11-06) says the developer resets it by hand if she forgets it. It takes about 5 minutes and needs access to the Supabase dashboard.

Why this works: Supabase stores passwords as bcrypt hashes in `auth.users.encrypted_password`. The SQL below stores the hash of a new password, made with the same `crypt` / `gen_salt('bf')` functions as the staff PINs. Supabase's login then accepts the new password.

1. With the operator, choose a new password that is long but easy to type, for example three unrelated words and a number. She can't change it herself afterwards. Don't send it by email or chat; agree on it by phone or in person.
2. Open the [Supabase dashboard](https://supabase.com/dashboard) and select the **production** project. Check the project name at the top: the test project has its own login, which is not hers.
3. In **Authentication → Users**, copy the operator's exact email address.
4. In **SQL Editor → New query**, paste the following, replacing both placeholders. Click **Run**.

   ```sql
   update auth.users
   set encrypted_password = extensions.crypt('NEW-PASSWORD-HERE', extensions.gen_salt('bf')),
       updated_at = now()
   where email = 'operator-email-here';
   ```

5. The result must say **1 row** affected. If it says 0 rows, the email doesn't match exactly: copy it again from the Users page.
6. **Delete the query.** The SQL Editor keeps queries, and the password would stay readable in it. In the list of queries on the left, open the query's "…" menu and delete it.
7. She signs in at `/admin` with her email and the new password. Her old password no longer works.

## Restore a backup

The operator downloads a backup every day (story #51): a file named like `copia-de-seguridad-fotocopias_08-11-2026_14-05.json`, kept on her computer. A restore replaces **every** row in the database with the rows of that file, so anything saved after the backup is lost. Use it only when the data is lost or damaged, or in the test project. It takes about 15 minutes, and needs this repo and access to the Supabase dashboard.

Why this works: the file holds every table except `admins`. A script turns it into one SQL file, which empties the tables and refills them from the file in a single transaction. It refuses to run if the database's tables or columns differ from the file's.

1. Get the latest backup file from the operator, on a USB stick or in person. It holds the staff PIN hashes: don't send it by email or chat.
2. If the project itself is gone, create a new Supabase project. In **SQL Editor**, apply every file in `supabase/migrations/` in order, up to the migration named in the backup. The script prints that migration in the next step.
3. In this repo, run `npm run restore-sql -- <path to the file>`. It prints the backup's date, its migration and the rows per table, and writes a `.restore.sql` file next to the backup.
4. Open the [Supabase dashboard](https://supabase.com/dashboard) and select the project to restore. Check the project name at the top.
5. In **SQL Editor → New query**, paste the whole `.restore.sql` file. Click **Run**.
6. The result lists every table, and `rows_in_file` must equal `rows_restored` on every line. If you get an error instead, nothing was changed. "Tables differ" or "other columns" means the database is not at the backup's migration.
7. **Delete the query** (its "…" menu in the list on the left) and the `.restore.sql` file: both hold the PIN hashes.
8. If the project is new, set up her login again (the backup can't hold it):
   1. In **Authentication → Users → Add user**, create her user with her email and a new password, agreed as in "Reset the operator's password".
   2. In **SQL Editor**, run `insert into admins (user_id) select id from auth.users where email = 'operator-email-here';`.
   3. In Vercel, set the Production values of `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the new project, then redeploy.
9. Ask her to log in and make a new backup. Her screen will say one is due: the restored list of backups ends before the file she gave you.
