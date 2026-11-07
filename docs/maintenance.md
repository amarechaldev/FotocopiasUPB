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
