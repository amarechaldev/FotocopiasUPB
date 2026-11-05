-- 0017: the department DNDU (issue #86).
-- Apply once, in the Supabase SQL Editor, after 0016: first in the test project, then in production.
-- Safe in production at any time: the forms and the report read the departments from this table, so
-- no app change goes with it.
-- Never edit after applying: write 0018_... instead.

-- The next id, so it comes last in the forms and the monthly report (both ordered by id).
-- No common descriptions yet: DNDU's description field gets no suggestions.
insert into areas (name) values ('DNDU');
