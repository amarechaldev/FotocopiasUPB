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
2. Reports (#7, #8): how should numbers be written? Thousands separator (12.519 or 12,519) and decimal separator (Bs 12.519,70 or Bs 12,519.70). Use the format the University already sees in her Excel report.
3. Reports (#7, #8): should the date the report was generated stay at the bottom of each page, or be removed?

**Capacity:** about 7–10 hours in total, PO and Dev: October 29 (1–2 h), October 31 (2 h), November 1 (2 h), November 3 (1–2 h), November 4 (1–2 h).

| Work | Planned hours | Actual hours |
| --- | --- | --- |
| PO | ~3 | 3 |
| Dev | ~5.15 | |
| **Total** | **~7–10** | |

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
| 13 (#71) | DB: too-vague descriptions table, checked when saving | #3 | 1 | 0.3 | |
| 14 (#72) | Browser: too-vague message, `current_period()` for staff, period warnings; tests | #3 | 1.5 | 0.5 | |
| 15 (#73) | Test #3, PR; production: app first, then migration | #3 | 0.5 | 0.15 | |
| 16 (#74) | DB: common descriptions per department | #32 | 0.5 | 0.15 | |
| 17 (#75) | Suggestions under the description field; test on tablet; PR | #32 | 1.5 | 0.5 | |
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

Time until now: PO: 3 hours, Dev: 4 hours 05 minutes


## Review

*To be completed on November 4.*

## Retrospective

*To be completed on November 4. Check actions B1 and B2 from Sprint 2. Action B2: fill in the Actual columns in the last session, before the Review.*
