# Sprint 2

**Dates:** October 22–28, 2026 (Review and Retrospective on October 28). Planning on October 23-24, so about five working days.

## Plan

**Sprint goal:** Staff register requests with their own account and PIN.

**Stories** (in order):

1. [#28 Create my staff account](https://github.com/amarechaldev/FotocopiasUPB/issues/28) (E5)
2. [#29 Requests require login](https://github.com/amarechaldev/FotocopiasUPB/issues/29) (E5)

**Added on October 24, after the sprint goal was met** (#28 and #29 accepted), in order: [#41 Operator login](https://github.com/amarechaldev/FotocopiasUPB/issues/41) (E5), [#4 Operator sees and filters entries](https://github.com/amarechaldev/FotocopiasUPB/issues/4) (E2), [#5 Operator edits and deletes entries](https://github.com/amarechaldev/FotocopiasUPB/issues/5) (E2). The operator screens need the operator login first. The sprint goal does not change: these stories are extra, and any not finished by October 28 return to the backlog.

**Added on October 25:** [#46 Operator registers entries for other people](https://github.com/amarechaldev/FotocopiasUPB/issues/46) (E2). Depends on one answer from the operator meeting on October 26: what happens with a paper entry from someone who has no account yet. The reports (#7, #8) are left for Sprint 3.

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

Oct 25 d)#5 is finished / next is #46, operator registers entries for other people / no blocks / 30 min / goal on track
## Review

*To be completed on October 28.*

## Retrospective

*To be completed on October 28. Check actions A1 and A2 from Sprint 1.*
