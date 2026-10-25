-- 0004: switch off saving without a PIN.
-- Apply once, in the Supabase SQL Editor, after 0003, and ONLY once the form with name and PIN
-- (register_account_entry) is live in production: until then, production still calls register_entry.
-- Never edit after applying: write 0005_... instead.

-- From now on every entry is saved by register_account_entry (0003), which checks the PIN.
-- Entries saved earlier keep account_id = null.

drop function register_entry(date, smallint, text, text, integer, jsonb);
