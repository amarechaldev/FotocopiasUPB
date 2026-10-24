# Sprint 2

**Dates:** October 22–28, 2026 (Review and Retrospective on October 28). Planning on October 23-24, so about five working days.

## Plan

**Sprint goal:** Staff register requests with their own account and PIN.

**Stories** (in order):

1. [#28 Create my staff account](https://github.com/amarechaldev/FotocopiasUPB/issues/28) (E5)
2. [#29 Requests require login](https://github.com/amarechaldev/FotocopiasUPB/issues/29) (E5)

**Next in the backlog** (first candidates for Sprint 3, in order): operator login (E5), [#4 Operator sees and filters entries](https://github.com/amarechaldev/FotocopiasUPB/issues/4) (E2), [#5 Operator edits and deletes entries](https://github.com/amarechaldev/FotocopiasUPB/issues/5) (E2). The operator screens need the operator login first.

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
| 1 (#34) | DB: accounts and departments with a default, hashed PIN, unique name (ignoring case and accents), create and list functions | #28 | 1.25 | |
| 2 (#35) | Logic and tests: PIN check, name search; data access code | #28 | 1 | |
| 3 (#36) | "Crear cuenta" screen (departments, default picker, PIN twice, errors, confirmation) | #28 | 1.5 | |
| 4 (#37) | Test #28 on phone and tablet, fix, PR, Ready for review | #28 | 0.75 | |
| 5 (#38) | DB: entries tied to an account, PIN checked on save | #29 | 1 | |
| 6 (#39) | Login step: name search, PIN, default department, warning outside the account, logout after save | #29 | 1.5 | |
| 7 (#40) | Test #29 on phone and tablet, deploy, switch off saving without a PIN, Ready for review | #29 | 0.75 | |
| | **Dev total** | | **~7.75** | |

**Checkpoint:** if #28 is not in Ready for review by Sunday, October 26, #29 is at risk. The PO then decides whether to split the "department outside my account" warning into its own story.

## Daily Log

Action A1: in the last 2 minutes of every working session, add a line: done / next / blocked / hours worked / goal on track (yes or no). Start each session by reading the last line.

## Review

*To be completed on October 28.*

## Retrospective

*To be completed on October 28. Check actions A1 and A2 from Sprint 1.*
