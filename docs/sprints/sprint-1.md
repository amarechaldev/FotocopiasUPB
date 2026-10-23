# Sprint 1

**Dates:** October 15–21, 2026

## Plan

**Sprint goal:** Staff can register a request on the tablet, and it is saved.

**Stories:**

- [#1 Service registration](https://github.com/amarechaldev/FotocopiasUPB/issues/1) (E1)

**Notes:**

- This sprint also includes the initial technical setup of the project, done through the first story (walking skeleton).
- Technology: React, deployed on Vercel, with Supabase for storage (see the [README](../../README.md#development)).
- Input checks (E1) stay in the backlog for a later sprint. In #1, "required" only means an entry cannot be saved with an empty name or description; other checks and messages belong to #3.
- At the Review, show that an entry was saved (e.g. in the Supabase dashboard), since viewing entries (#4) is not in this sprint.

**Capacity:** about 18 hours (3 hours a day, October 15–20). October 21 is kept for the Review and Retrospective. First React app and first deployment, so all estimates are guesses: this sprint sets the first baseline.

**Tasks** (riskiest first, so that each day leaves something working):

| # | Task | Timebox | Day |
| --- | --- | --- | --- |
| 1 | Learn React basics | 2.5 h | Thu 15 |
| 2 | Spike: deploy a blank "Hola mundo" on Vercel and open it on the tablet | 2 h | Fri 16 |
| 3 | Connect to Supabase and save one hard-coded entry from the deployed app | 3 h | Fri 16 – Sat 17 |
| 4 | Form: date, name, description, department, copies (in Spanish) | 3 h | Sat 17 – Sun 18 |
| 5 | Anillados: add one or more rows, each with a quantity and a size | 3 h | Sun 18 – Mon 19 |
| 6 | Confirmation and failure messages, test against the acceptance criteria and DoD on the tablet, fix bugs | 3 h | Mon 19 – Tue 20 |
| | **Total** | **16.5 h** | |

**Cut line:** if on Sunday the work is clearly behind, task 5 (anillados) is split into its own story for Sprint 2. Copies-only entries, saved and running on the tablet, still meet the sprint goal.

## Daily Log

At the start of each session, 5 minutes: what I finished last time, what I will do today, and what is blocking me. Is the sprint goal still on track?

oct 17: I was blocked for two days because I have other commitments. Going forward with the plan from now on. Today, I will start my journey on REACT, the plan is to have a hello world working today.

Oct 19: Couldn't advance yesterday for personal commitments, but I'm pretty sure that today I will be able to put myself at the correct level.

Oct 20: Yesterday was very productive and everything in sprint 1 is finished, I fixed a couple of bugs and there are no more bugs detected, everything goes well. Will try to add some CSS to make it nicer today.

Oct 21: Added CSS and showed the product to the Operator yesterday. Registered multiple comments on the documents mantained by the PO side.

Oct 21 after planning: ended the sprint with the PO side and made a lof of adjustments to the backlog. Closed the sprint with the SM.

## Review

**Sprint goal: met**, one day early, despite about two days lost to other commitments.

**Accepted by the PO:**

- [#1 Service registration](https://github.com/amarechaldev/FotocopiasUPB/issues/1): Done.
- [#26 Basic visual polish before the first demo](https://github.com/amarechaldev/FotocopiasUPB/issues/26): Done, added after the sprint goal was met; story #1's criteria re-checked.

**Demo to the operator (October 20, a day before the Review):**

- She is very happy with what she saw.
- She expected to see the registered entries in the app, not only in the database. She understood it was planned but not built yet: the entry list should be the next focus.
- The demo ran on a phone, because the tablet could not connect. She is now interested in using an old phone instead of a tablet.
- New requirement from the University, non-negotiable and needed for the MVP: every entry must be made from a personal account protected by a PIN. This becomes epic E5 (Staff Accounts).

**Follow-up meeting with the operator (October 21), on descriptions and operator entries:**

- About 80% of entries use a few common descriptions. The app will suggest them, while still allowing free text. The operator will send the list. In the MVP the developer maintains it; the operator edits it after the MVP.
- Some descriptions are too vague (e.g. "copias", "fotocopias"). Saving them is blocked (an error), with a clear message and suggestions of better descriptions. Determined workarounds (e.g. "coopias") are left to the operator's review. The operator will send the list.
- The operator registers entries on behalf of other people (e.g. paper entries after a connection drop), from her own account. This is not hidden from the University.
- On the operator's screen, entries show a "modified" or "manually entered" status. This status is not printed in the reports.

**Backlog changes:**

- #2 (autofill from previous entries) closed as not planned: personal accounts (E5) fill in name and departments.
- #3 (input checks) revised: the "name associated with another department" warning is removed; the vague-description error is added.
- New stories: suggest common descriptions (E1); staff accounts with PIN (E5); operator registers entries for other people, with the "modified" / "manually entered" status on her screen (E2); operator edits departments, prices and description lists (new epic E6, after the MVP).
- Priorities: the entry list (operator feedback) and staff accounts (University requirement, on the critical path to the pilot) are the candidates for Sprint 2.

**Process finding (for the Retrospective):** the dev side moved issues to Done before the PO checked them. A "Ready for review" column is added to the board: only the PO moves issues to Done.

## Retrospective

*Held on October 21.*

**Actual capacity:** about 12–15 hours, in bursts (some days a lot, some days nothing), shared between PO and Dev work. Planned: 16.5 hours of Dev work, 3 hours a day. Main job and family come first, so irregular time is expected to continue.

**What went well:**

- The sprint goal was met, and a first version was built, deployed and working within a week.
- The plan was visible: tasks as sub-issues (#10–#14), one PR per task, small commits, and technical decisions recorded in [tech-decisions.md](../tech-decisions.md).
- The operator saw the product before the Review, and her feedback reshaped the backlog.
- The polish (#26) was a PO decision that the Dev agreed with: the roles worked as intended.
- The "Done before the PO checked it" problem was spotted and fixed during the sprint (the "Ready for review" column, and the DoD updated).

**What didn't go well:**

- The Daily Log did not help. It was written at the start of a session, from memory, sometimes days after the work, so things were missed.
- Planning assumed 3 even hours a day of Dev work. Real time was irregular, and much of it went to PO work, so the hour estimates did not mean much.
- The 17 October entry raised an impediment (two days lost), but nothing was re-checked: no Sunday cut-line check, and no entry says whether the goal was on track.
- No React was learned: the Developer assistant wrote the code. This was a conscious choice, accepted for now. The trade-off is that bugs can only be found by testing, and fixed with the assistant's help.

**Insights:**

- When a sprint finishes early, the first question is which backlog item is most valuable next. The operator is always available, so check guesses with her (the polish was based on a guess; her real feedback was the entry list).
- The old tablet worked at the demo, but slowly: the Review note says it "could not connect". *PO: correct the Review note.* Slowness matters for "registration as quick as paper" and for choosing between a phone and a tablet.

**Actions for Sprint 2:**

| # | Action | Owner | How it is checked at the next Retrospective |
| --- | --- | --- | --- |
| A1 | **End-of-session note.** In the last 2 minutes of every working session, add a line to the Daily Log: done / next / blocked / hours worked / goal on track (yes or no). Start each session by reading the last note. | Dev | There is a note for every working session, written without relying on memory. |
| A2 | **Plan by real capacity.** In Sprint 2 Planning, plan about 12 hours for the week, split into PO time and Dev time, with no "Day" column. Compare planned with actual hours (from A1). | SM (at planning) | Planned and actual hours are shown side by side in sprint-2.md. |
