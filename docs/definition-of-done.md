# Definition of Done

A story is done when, in addition to its own acceptance criteria:

- All acceptance criteria are met and ticked in the issue.
- I tested it fully against its acceptance criteria on the preview deployment (test database), on the devices where it will be used:
  - Staff screens: on a phone (my own phone until the operator's shared phone is available).
  - Operator screens: in a computer browser, as on the operator's computer.
- It is deployed to production, and a short smoke check passed there: the app loads and the changed screen opens, without repeating the full test and without creating real entries.
- It works in Spanish.
- No known bugs are left open.
- The code is pushed to GitHub.
- The PO checked it and moved the issue from "Ready for review" to Done.
