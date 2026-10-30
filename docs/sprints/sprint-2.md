# Sprint 2

**Dates:** October 22–28, 2026 (Review and Retrospective on October 28). Planning on October 23-24, so about five working days.

## Plan

**Sprint goal:** Staff register requests with their own account and PIN.

**Stories** (in order):

1. [#28 Create my staff account](https://github.com/amarechaldev/FotocopiasUPB/issues/28) (E5)
2. [#29 Requests require login](https://github.com/amarechaldev/FotocopiasUPB/issues/29) (E5)

**Added on October 24, after the sprint goal was met** (#28 and #29 accepted), in order: [#41 Operator login](https://github.com/amarechaldev/FotocopiasUPB/issues/41) (E5), [#4 Operator sees and filters entries](https://github.com/amarechaldev/FotocopiasUPB/issues/4) (E2), [#5 Operator edits and deletes entries](https://github.com/amarechaldev/FotocopiasUPB/issues/5) (E2). The operator screens need the operator login first. The sprint goal does not change: these stories are extra, and any not finished by October 28 return to the backlog.

**Added on October 25:** [#46 Operator registers entries for other people](https://github.com/amarechaldev/FotocopiasUPB/issues/46) (E2). Answered at the operator meeting on October 26: only people with an account can use the paper notebook; without an account, the operator does not accept the request. The reports (#7, #8) are left for Sprint 3.

**Added on October 26:** [#50 Page does not scroll to the top after a success](https://github.com/amarechaldev/FotocopiasUPB/issues/50) (bug found by the operator) and [#44 Second database for testing](https://github.com/amarechaldev/FotocopiasUPB/issues/44).

**Notes:**

- Staff accounts are the University's non-negotiable requirement and on the critical path to the pilot. The entry list, which the operator asked for at the Sprint 1 demo, comes right after: tell her so, with the reason.
- Requirement change for the dev team: every entry must be verified against a valid account and PIN, and nobody, including the developer in the database, can read a PIN. This revisits the 2026-10-15 decision in [tech-decisions.md](../tech-decisions.md) that anyone with the URL can save entries.
- Accounts have one or more departments with one marked as default, and the person is logged out after each entry (see [07-epics.md](../07-epics.md), E5).
- Pilot preparation: the date shows as dd/mm/aaaa only if the shared device is set to Spanish (see [tech-decisions.md](../tech-decisions.md)).

**Capacity** (Sprint 1 Retrospective, action A2): about 12 hours in total, split between PO and Dev work. Time is irregular: fast sessions, but not every day.

| Work | Planned hours | Actual hours |
| --- | --- | --- |
| PO | ~3 (1.5 spent on planning, 1.5 left) | |
| Dev | ~7.75 | |
| **Total** | **~10.75** of ~12 available | |

**Tasks** (riskiest first; each one small enough to finish in one session):

| # | Task | Story | Planned hours | Actual hours |
| --- | --- | --- | --- | --- |
| 1 (#34) | DB: accounts and departments with a default, hashed PIN, unique name (ignoring case and accents), create and list functions | #28 | 1.25 | 0.10 |
| 2 (#35) | Logic and tests: PIN check; data access code | #28 | 1 | 0.10 |
| 3 (#36) | "Crear cuenta" screen (departments, default picker, PIN twice, errors, confirmation) | #28 | 1.5 | 0.10 |
| 4 (#37) | Test #28 on phone and tablet, fix, PR, Ready for review | #28 | 0.75 | |
| 5 (#38) | DB: entries tied to an account, PIN checked on save | #29 | 1 | 0.2 |
| 6 (#39) | Login step: name search, PIN, default department, warning outside the account, logout after save | #29 | 1.5 | 0.3 |
| 7 (#40) | Test #29 on phone and tablet, deploy, switch off saving without a PIN, Ready for review | #29 | 0.75 | 0.5 |
| | **Dev total** | | **~7.75** | |

**Checkpoint:** if #28 is not in Ready for review by Sunday, October 25, #29 is at risk. The PO then decides whether to split the "department outside my account" warning into its own story.

## Daily Log

Action A1: in the last 2 minutes of every working session, add a line: done / next / blocked / hours worked / goal on track (yes or no). Start each session by reading the last line.

Oct 23: I finished the Sprint 2 planning with PO, SM and dev. Did some tasks (34, 35, 36) / Next is 37, testing on a tablet. Testing URL was created by vercel. / no block / worked 2 hours, 1.5 on planning, 0.5 with dev / goal on track, only 37 is missing to end 28 which is planned for sunday, 29 not started yet.

Oct 24 a): Finished #28 staff accounts, with tests both in a test build and live build, everything passes. / next is starting #29, staff requires login / no blocks / worked for 40 minutes until now, but I'm not finished for today. / goal is on track, will start #29 now.

Oct 24 b): I finished #29 requests require login / next I'll ask PO the next task, the sprint goal is already finished / no blocks / one hour / goal achieved.

Oct 24 c): Planned new work for this sprint and fixed many details about the stories for the next sprints / Next is #41, operator login / no blocks / This took me 1h30! / goal on track, should finish all remaining extra work on time.

Oct 25 a): analysed the need for backups, will talk about it with the operator / next is #41, operator login / backups are blocked until PO talks with the operator / 60 min / goal on track

Oct 25 b) #41 finished / next is #4, operator sees entries / no blocks on this side / 35 min / goal on track

Oct 25 c) #4 finished, with discussions and fixing about sorting / next is #5, operator edits and deletes entries / no blocks here / 90 min / goal on track

Oct 25 d) #5 is finished / next is #46, operator registers entries for other people / no blocks / 30 min / goal on track

Oct 26 a) Finished #50 and #46, and ackups are not blocked anymore / next is #44, second database for testing / no blocks / 90 min / goal on track

Oct 26 b) did #44, second database / next is planning and executing the pilot / no blocks / 120 min / sprint goal finished

## Review

*Held on October 29, a day after the sprint ended.*

**Sprint goal: met** on October 24, the third day of the sprint.

**Accepted by the PO:**

- Goal: [#28 Create my staff account](https://github.com/amarechaldev/FotocopiasUPB/issues/28), [#29 Requests require login](https://github.com/amarechaldev/FotocopiasUPB/issues/29).
- Added after the goal was met: [#41 Operator login](https://github.com/amarechaldev/FotocopiasUPB/issues/41), [#4 Operator sees and filters entries](https://github.com/amarechaldev/FotocopiasUPB/issues/4), [#5 Operator edits and deletes entries](https://github.com/amarechaldev/FotocopiasUPB/issues/5), [#46 Operator registers entries for other people](https://github.com/amarechaldev/FotocopiasUPB/issues/46), [#50 Page does not scroll to the top after a success](https://github.com/amarechaldev/FotocopiasUPB/issues/50), [#44 Second database for testing](https://github.com/amarechaldev/FotocopiasUPB/issues/44).
- Nothing was left unfinished.

**Meeting with the operator (October 26):**

- She tried the entry list and loves the sorting and filters.
- Her admin account was created with her.
- Decisions: daily backups started by her with one button, kept on her computer; no automatic logout on her computer; people without an account cannot use the paper notebook (see the [decision log](../decision-log.md)).
- She found the scroll problem after creating an account (#50, fixed in this sprint).
- New information: she can close a billing period a day late (e.g. on the 23rd instead of the 22nd). The app must remember where each period ends, so that no day is billed twice or skipped.
- The pilot departments are DAAE Cultura, DAAE Deportes and VRA, chosen by her.
- The app did not load on one of her computers, while another computer on the same network worked. She uses the working one and is happy with it for now; the failing computer will be investigated later, probably after the MVP.

**Pilot launched** at the end of the sprint: four staff members confirmed, a fifth to be contacted by the operator. The PO followed them while they created their accounts and made their first entries, and saw two improvements:

- A warning when the typed name has no account, with a way to go straight to account creation.
- After creating an account, the entry screen opens with the name already selected; the PIN is still typed, as usual.

**Backlog changes:**

- New stories: close a billing period (needed before the first pilot report); the two pilot improvements above.
- [#51 Local backups](https://github.com/amarechaldev/FotocopiasUPB/issues/51) can wait until after the pilot, since the pilot departments keep the paper notebook in parallel.
- [#31 Operator edits staff profiles](https://github.com/amarechaldev/FotocopiasUPB/issues/31) stays for the full rollout: during the pilot, the developer handles account changes and forgotten PINs.
- Sprint 3 candidates: [#7 Detailed report](https://github.com/amarechaldev/FotocopiasUPB/issues/7), [#8 Global report](https://github.com/amarechaldev/FotocopiasUPB/issues/8) and closing a billing period, all needed before the first pilot period closes on November 22.

## Retrospective

*Held on October 29, a day after the sprint ended (travel on October 28).*

**Sprint 1 actions:**

- **A1 (end-of-session note): done.** Eleven notes, each with done / next / blocked / hours / goal on track, one per story on busy days. Much easier than writing from memory. It is now a habit, no longer an action.
- **A2 (plan by real capacity): half done.** Capacity was predicted well (about 10.75 hours planned of ~12 available; about 12.3 hours worked, from the notes). The Actual columns were left empty and had to be rebuilt from the notes. Task estimates were about 5 times too high: the goal's work (#28, #29) took about 1.5–2 hours against 7.75 planned.

**What went well:**

- The sprint goal was met on October 24, the third day. Six more stories were added after it and all were finished: #41, #4, #5, #46, #50, #44.
- Each addition was recorded with its date and reason, and the goal never changed. Work stopped being added on Tuesday so the sprint could finish cleanly.
- My own estimates were better than the Developer assistant's, and I felt in control all the time.
- The operator used the product (entry list, filters, her admin account) and found a bug, which was fixed in the sprint.
- Security evidence was produced for the security stories.
- No risky change was deployed just before the pilot (#52 waited). The pilot launched and went well.

**What didn't go well:**

- The planned vs. actual tables were not filled in.
- The Review and Retrospective happened a day after the sprint ended. This is acceptable given the trip, but the cadence must not drift: Sprint 3 keeps its normal dates.

**Insights:**

- The person who does the work gives the final estimate; the Developer assistant's estimate is only a starting point.
- Ending a sprint a day late is fine once; the risk is that each sprint starts a little later than the last.

**Actions for Sprint 3:**

| # | Action | Owner | How it is checked at the next Retrospective |
| --- | --- | --- | --- |
| B1 | **Calibrated, personal estimates.** At planning, take the Dev assistant's estimate, divide it by 3, then adjust it with my own judgement. My number goes into the plan. | Dev | For each task, planned and actual hours are within about ±50%. |
| B2 | **Close the numbers before the Review.** In the last session of the sprint, fill in the Actual columns of the task and capacity tables from the end-of-session notes. | Dev (SM checks) | Both tables are complete when the Retrospective starts. |
