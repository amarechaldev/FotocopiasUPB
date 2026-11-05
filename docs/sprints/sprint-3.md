# Sprint 3

**Dates:** October 29 – November 4, 2026 (Review and Retrospective on November 4)

## Plan

**Sprint goal:** The operator can close a billing period and print both reports.

**Stories** (riskiest first):

1. [#52 Flexible billing periods](https://github.com/amarechaldev/FotocopiasUPB/issues/52) (E3, E4): goal
2. [#7 Detailed report](https://github.com/amarechaldev/FotocopiasUPB/issues/7) (E3): goal
3. [#8 Global report](https://github.com/amarechaldev/FotocopiasUPB/issues/8) (E4): goal
4. [#56 Users write their names without an account and don't realize it](https://github.com/amarechaldev/FotocopiasUPB/issues/56) (E5)
5. [#57 After creating an account the entry screen should be shown](https://github.com/amarechaldev/FotocopiasUPB/issues/57) (E5)
6. [#3 Input checks](https://github.com/amarechaldev/FotocopiasUPB/issues/3) (E1)
7. [#32 Suggest common descriptions](https://github.com/amarechaldev/FotocopiasUPB/issues/32) (E1)

With all seven done, every story in the MVP milestone is finished.

**Cut line:** if time runs short, stories are dropped from the end of the list (#32, then #3). The pilot departments do not need them, and the goal does not depend on them.

**Notes:**

- The first pilot billing period closes on November 22: the reports must be ready before then. Finishing them in this sprint leaves two sprints of buffer.
- Reports follow the billing periods: their dates are not chosen freely (#52). #7 and #8 must be consistent with this.
- The operator has provided the lists of common and too-vague descriptions (#3, #32). In the MVP, the developer maintains them.
- The pilot is running: deploy carefully, and test changes on the test database (#44) first.

**Questions for the operator** (ask before accepting #7 and #8):

1. Detailed report (#7): is one page per department what she wants? It is built that way, with a final "Totales del periodo" page.
A: One page per department is good, but do not show departments with a 0 total in the detailed report. The Global Report shows all departments.
2. Reports (#7, #8): how should numbers be written? Thousands separator (12.519 or 12,519) and decimal separator (Bs 12.519,70 or Bs 12,519.70). Use the format the University already sees in her Excel report.
A: The current implementation (A space to separate thousands and comma for decimals is fine.
3. Reports (#7, #8): should the date the report was generated stay at the bottom of each page, or be removed?
A: The date was accepted.

**Capacity:** about 7–10 hours in total, PO and Dev: October 29 (1–2 h), October 31 (2 h), November 1 (2 h), November 3 (1–2 h), November 4 (1–2 h).

| Work | Planned hours | Actual hours |
| --- | --- | --- |
| PO | ~3 | 3.66 |
| Dev | ~5.15 | 5 |
| **Total** | **~7–10** | **8.66** |

**Tasks** (action B1: my own estimates, starting from the Dev assistant's divided by 3):

| # | Task | Story | Dev assistant (h) | Planned hours (÷3) | Actual hours |
| --- | --- | --- | --- | --- | --- |
| 1 (#59) | DB: billing periods with movable end dates, `list_periods`, `set_period_end`; first period from 23/10/2026 | #52 | 1.5 | 0.5 | 0.3 |
| 2 (#60) | Operator screen: periods from the database, end date visible from the first day, "Cambiar cierre" with the reprint warning | #52 | 1.5 | 0.5 | 0.75 |
| 3 (#61) | Test #52 on the test database and preview, PR, migration to production after merge | #52 | 0.5 | 0.15 | 0.6 |
| 4 (#62) | Departments in the order of the Excel report everywhere | #7 | 0.5 | 0.15 | 0.33 |
| 5 (#63) | Report logic with tests: grouping, date order, sizes used, subtotals, totals, open period up to today | #7 | 1 | 0.3 | 0.17 |
| 6 (#64) | pdfmake and the detailed report PDF on letter paper, report buttons | #7 | 1.5 | 0.5 | 0.35 |
| 7 (#65) | Test #7: PDF against the entry list on test data, print one page, PR | #7 | 0.5 | 0.15 | 0.17 |
| 8 (#66) | Copy price in the database, per-department totals in centavos with tests | #8 | 1 | 0.3 | 0.25 |
| 9 (#67) | Global report PDF: one row per department, totals, period dates, space for signatures | #8 | 0.75 | 0.25 | 0.3 |
| 10 (#68) | Test #8 on test data, print one page, PR | #8 | 0.5 | 0.15 | 0.4 |
| 11 (#69) | Name without an account: red box with "Crear cuenta", form locked until a name is chosen; test; PR | #56 | 1 | 0.3 | 0.3 |
| 12 (#70) | After creating an account: entry screen with the message and the name selected; test; PR | #57 | 1 | 0.3 | 0.16 |
| 13 (#71) | DB: too-vague descriptions table, checked when saving | #3 | 1 | 0.3 | 0.16 |
| 14 (#72) | Browser: too-vague message, `current_period()` for staff, period warnings; tests | #3 | 1.5 | 0.5 | 0.16 |
| 15 (#73) | Test #3, PR; production: app first, then migration | #3 | 0.5 | 0.15 | 0.25 |
| 16 (#74) | DB: common descriptions per department | #32 | 0.5 | 0.15 | 0.16 |
| 17 (#75) | Suggestions under the description field; test on tablet; PR | #32 | 1.5 | 0.5 | 0.3 |
| | **Dev total** | | **~16.25** | **~5.15** | |

## Daily Log

At the end of every working session: done / next / blocked / hours worked / goal on track (yes or no).

29/10: did sprint 3 planning with PO and SM / next is planning with dev / no blocks / worked 2 hours / goal on track

30/10 a): Finished sprint planning with dev / next is #59, flexible period dates in the DB / no blocks, but one open question about the start of the first period / worked 1 hour / goal on track

30/10 b): #59 flexible periods in the DB / next is #60, Flexible periods in the operator screen / no blocks / worked 20 minutes / goal on track

30/10 c): #60 tested on dev branch / next is applying 011 abd 012 in production, doing the PR abd checking the live app. / no blocks / worked 45 min / goal on track

31/10 a) #61 finished and with it #52 (flexible periods) / next is #7, detailed report, starting with 62 / no blocks / worked 35 min / goal on track

31/10 b) Finished #62, #63 and #64 / Next is #65 / no blocks / worked 45 minutes / goal on track

02/11 a) #65 finished / Next is #8, detailed report, starting with #66 / no blocks / worked 10 minutes / goal on track

02/11 b) Finished #66 / Next is #67, pdf / no blocks / worked 15 minutes / goal on track

02/11 c) Finished #67, pdf / Next is #68, tests for global pdf / no blocks / worked 20 minutes / goal on track

02/11 d) Finished #68, tests / Next is 56 and 69, a small change / no blocks / worked 25 minutes / goal on track

02/11 e) Finished #56 and #69 / Next is 57 and 70, entry window after creating and account / no blocks / worked 20 minutes / goal on track

02/11 f) Finished #57 and #70 / Next is #3, Input checks, starting with #71 / no blocks / worked 10 minutes / goal on track

04/11 a) PO work, validating the tasks / Next is #82, blank pages in the detailed report / no blocks / worked 40 minutes / goal on track

04/11 b) Finished #82 / Next is #71, too-vague descriptions / worked 10 minutes / goal on track

04/11 c) Finished #71 / Next is #72, front-end for too-vague descriptions / worked 10 minutes / goal on track

04/11 d) Finished #72 / Next is #73, Testing and PR / worked 10 minutes / goal on track

04/11 e) Finished #73 / Next is #32, common descriptions, starting with #74, DB / worked 15 minutes / goal on track

04/11 f) Finished #74 / Next is #75, frontend and PR / worked 10 minutes / goal on track

04/11 g) Finished #75 / Next is finishing the Sprint / worked 20 minutes / goal on track

Time until now: PO: 3 hours 40 minutes, Dev: 5 hours 00 minutes

## Review

*Held on November 4.*

**Sprint goal: met.** The operator can close a billing period and print both reports.

**Accepted by the PO:**

- Goal: [#52 Flexible billing periods](https://github.com/amarechaldev/FotocopiasUPB/issues/52), [#7 Detailed report](https://github.com/amarechaldev/FotocopiasUPB/issues/7), [#8 Global report](https://github.com/amarechaldev/FotocopiasUPB/issues/8).
- Also planned: [#56](https://github.com/amarechaldev/FotocopiasUPB/issues/56) (warning when a name has no account; reopened once at acceptance, so that typing a full name exactly selects it), [#57](https://github.com/amarechaldev/FotocopiasUPB/issues/57) (entry screen after creating an account), [#3 Input checks](https://github.com/amarechaldev/FotocopiasUPB/issues/3), [#32 Suggest common descriptions](https://github.com/amarechaldev/FotocopiasUPB/issues/32).
- Added during the sprint: [#82](https://github.com/amarechaldev/FotocopiasUPB/issues/82) (hide departments with no entries in the detailed report, from the operator's answers) and [#86](https://github.com/amarechaldev/FotocopiasUPB/issues/86) (new department DNDU, requested by the operator).
- Task #62 (departments in the Excel order everywhere) was closed as not needed.
- Nothing was left unfinished, and the cut line was not used.

**The MVP milestone is complete:** no open issues are left in it.

**Operator's answers on the reports:**

- One page per department in the detailed report, without departments that have no entries (#82). The global report keeps all departments.
- Numbers: a space to separate thousands and a comma for decimals, as built.
- The "generated on" date stays at the bottom of the reports.

**Pilot:** running in DAAE Cultura, DAAE Deportes and VRA. The first real billing period ends on November 22: the first reports from the app go to the University then. This is the test of the top risk, University acceptance.

**Process finding (for the Retrospective):** #57 was closed right after its PR was merged, before the PO had checked it, although the DoD says only the PO moves an issue to Done.

**Backlog for the next sprint:** with the MVP complete, the focus moves to supporting the first real report and preparing the full rollout. Candidates from the Full rollout milestone: [#16 Keeping the database alive](https://github.com/amarechaldev/FotocopiasUPB/issues/16) (the pilot runs into the end-of-year holidays), [#51 Local backups](https://github.com/amarechaldev/FotocopiasUPB/issues/51), [#31 Operator edits staff profiles](https://github.com/amarechaldev/FotocopiasUPB/issues/31), [#30 Staff edits own profile](https://github.com/amarechaldev/FotocopiasUPB/issues/30), [#33 Operator edits the lists](https://github.com/amarechaldev/FotocopiasUPB/issues/33), [#58 Operator's computer that does not load the app](https://github.com/amarechaldev/FotocopiasUPB/issues/58).

## Retrospective

*Held on November 4, the last day of the sprint.*

**Sprint 2 actions:**

- **B1 (calibrated, personal estimates): done, and it worked.** Dev total: 5.15 hours planned, 5.0 actual. 12 of 17 tasks were within ±50%. Three of the five misses were testing and deployment tasks (#61 4×, #68 2.7×, #73 1.7×): the work the Developer assistant speeds up least.
- **B2 (close the numbers before the Review): done.** Every Actual column was filled in, from the end-of-session notes.

**Capacity:** about 7–10 hours planned, 8.66 actual (PO 3.66, Dev 5.0).

**What went well:**

- The sprint goal was met, and the MVP milestone is complete: every planned story plus two the operator asked for (#82, #86). The cut line was not needed.
- Seeing the reports: the product came to life, quickly and painlessly.
- The PO check caught a problem: #56 was reopened at acceptance.
- The cadence held: the Review and Retrospective happened on the last day of the sprint.
- The end-of-session notes keep the hours table up to date as I go, and short notes are written while the Developer assistant works, so they cost nothing. They are now a habit, no longer an action.

**What didn't go well:**

- Testing the same change three times (local, preview with the test database, production) felt like a chore that almost never found anything.
- #57 was moved to Done before the PO checked it: a wrong click on the board, not a process problem. No action.

**Insights:**

- The ÷3 rule fits building work, not testing: testing on devices is human time.
- Each test level should catch something different: local only for debugging, the full test on the preview, and a short smoke check in production.
- The full rollout is gated on the University accepting the first report after November 22 (top risk). Preparation can start now; the rollout itself cannot come before that answer.

**Actions for Sprint 4:**

| # | Action | Owner | How it is checked at the next Retrospective |
| --- | --- | --- | --- |
| C1 | **Two estimation rules.** Building tasks: the Dev assistant's estimate ÷ 2.5. Testing, PR and deploy tasks: the Dev assistant's estimate as given. My own judgement has the final word. | Dev | More tasks within ±50% than this sprint's 12 of 17, and no test task over 2×. |
| C2 | **Test once, then check.** Full test on the preview, on real devices; local testing only for debugging; in production, a short smoke check without real entries. The [Definition of Done](../definition-of-done.md) was updated on November 4. | Team (DoD) | Test tasks take less time, and nothing broke in production that the preview would have caught. |
