# Sprint 4

**Dates:** November 5–11, 2026 (Review and Retrospective on November 11)

## Plan

**Sprint goal:** The app is ready to hand over: it keeps working through weeks without entries, and the operator manages staff accounts herself.

**Stories** (in order):

1. [#16 Keeping the database alive](https://github.com/amarechaldev/FotocopiasUPB/issues/16): goal
2. [#58 Investigate why an operator's computer doesn't load the app](https://github.com/amarechaldev/FotocopiasUPB/issues/58): investigation, timeboxed to 2 hours, when the computer is available
3. [#31 Operator edits staff profiles](https://github.com/amarechaldev/FotocopiasUPB/issues/31) (E5): goal
4. [#30 Staff edits own profile](https://github.com/amarechaldev/FotocopiasUPB/issues/30) (E5)
5. [#114 Operator password reset](https://github.com/amarechaldev/FotocopiasUPB/issues/114) (E5): added on November 5, after the operator forgot her password and it was reset manually. **Closed as won't do on November 6:** the operator prefers a manual reset by the developer if it ever happens again
6. [#33 Operator edits the lists](https://github.com/amarechaldev/FotocopiasUPB/issues/33) (E6): first to be cut if time runs short
7. [#51 Local backups](https://github.com/amarechaldev/FotocopiasUPB/issues/51) (E6): added on November 8, after all the planned stories were in production
8. [#20 Undo button](https://github.com/amarechaldev/FotocopiasUPB/issues/20) (E1): added on November 9, after #51, once the operator confirmed she wants it. Undoing asks for the person's PIN again

**Cut line:** if time runs short, #33 moves to Sprint 5 (November 12–18), which still allows a handover in November. #33 reached production on November 8. #51 was added above the plan: any of its tasks not done by November 11 move to Sprint 5.

**Next in the backlog:** [#20 Undo button](https://github.com/amarechaldev/FotocopiasUPB/issues/20) (E1), the last story of the Handover milestone; pulled into this sprint on November 9.

**PO work:**

- Arrange the University preview with the operator: both reports shown to the University representative before the handover.
- Draft the one-page handover agreement: what is fixed and how fast, for how long, what is not included, who owns the accounts (GitHub, Vercel, Supabase) and who pays any costs.

**Notes:**

- #16: the database must stay active from the end of the pilot (November 22) until the full rollout in January, more than six weeks without entries. This cannot be tested by waiting: the Dev provides evidence of how it works.
- Archive what past entries refer to: departments and anillado sizes. Departments and anillados sizes can be deleted if not used. Entries and descriptions can be deleted (#31, #33).
- Prices (#33): a price change applies from a chosen period; reports for earlier periods keep the old prices.
- Backups (#51, decision log 2026-10-26): the operator starts the backup with one button and keeps the file on her computer; the app reminds her 23 hours after the last one. A backup is restored once on the test database to prove it is complete.
- #58 depends on access to the operator's second computer: arrange a time with her.
- The pilot is running: test on the preview first, then a short check in production (Definition of Done, action C2).

**Capacity:** about 17 hours in total, PO and Dev: November 4 (3 h PO), November 5 (2 h), November 6 (2 h), November 7 (1 h), November 8 (1 h), November 9 (2 h), November 10 (2 h), November 11 (4 h).

| Work | Planned hours | Actual hours |
| --- | --- | --- |
| PO | 6 | 3.5 |
| Dev | 11 | 8.05 |
| **Total** | **~17** | **11.55** |

**Tasks** (action C1: building tasks, the Dev assistant's estimate ÷ 2.5; testing, PR and deploy tasks, the Dev assistant's estimate as given; my own judgement has the final word):

| # | Task | Story | Dev assistant (h) | Planned hours | Actual hours |
| --- | --- | --- | --- | --- | --- |
| 1 (#88) | Evidence: Supabase pause rule, plans of both projects, what counts as activity, data in a paused project | #16 | 0.5 | 0.2 | 0.16 |
| 2 (#89) | Scheduled GitHub Actions job calling both databases every 3 days; one manual run | #16 | 0.75 | 0.3 | 0.25 |
| 3 (#90) | Evidence: job runs over several days, activity in Supabase; tech-decisions row; PR | #16 | 0.5 | 0.5 | 0.25 |
| 4 (#91) | Investigation on the operator's computer (timeboxed to 2 hours) | #58 | 2 | 2 | 0.83 |
| 5 (#92) | DB: PIN reset, operator profile updates, archive/reactivate/delete; SQL tests | #31 | 1.75 | 0.7 | 0.33 |
| 6 (#93) | Operator "Cuentas" screen: list with search, reset marker, edit form, archive/reactivate/delete, confirmation | #31 | 2.25 | 0.9 | 0.4 |
| 7 (#94) | Staff form: a name with a pending PIN reset asks for the new PIN twice | #31 | 1 | 0.4 | 0.16 |
| 8 (#95) | Test #31 on preview and tablet, PR, migration in production | #31 | 0.75 | 0.75 | 0.5 |
| 9 (#96) | DB: staff update their own profile with their PIN, reusing #31's checks; SQL tests | #30 | 0.75 | 0.3 | 0.25 |
| 10 (#97) | "Mi cuenta" screen: log in with name and PIN, edit, new PIN twice, logout message | #30 | 1.5 | 0.6 | 0.25 |
| 11 (#98) | Test #30 on tablet, PR, production | #30 | 0.5 | 0.5 | 0.25 |
| 12 (#99) | DB: copy and anillado prices from a chosen period; reports use each period's prices; anillado sizes archivable; tests | #33 | 2 | 0.8 | 0.5 |
| 13 (#100) | DB: operator functions for departments, sizes, common and too-vague descriptions, with the checks; tests | #33 | 1.5 | 0.6 | 0.3 |
| 14 (#101) | "Listas" screen: copy and anillado prices, each with the period it starts from | #33 | 1.5 | 0.6 | 0.25 |
| 15 (#102) | "Listas" screen: departments, anillado sizes, common descriptions with departments, too-vague descriptions | #33 | 2 | 0.8 | 0.5 |
| 16 (#115) | Staff form: archived department, choose a new default / one-time warning (added on November 8, after the PO's answer on archiving departments; done before #103 so #33 reaches production complete) | #33 | 1.25 | 0.5 | 0.3 |
| 17 (#103) | Test #33 (earlier reports keep old prices), PR, production | #33 | 1 | 1 | 0.75 |
| 18 (#104) | DB: backup function (operator only, every table, PIN hashes included) and date of the last backup; SQL tests (added on November 8 with #51) | #51 | 1.25 | 0.5 | 0.15 |
| 19 (#105) | Operator screen: backup button, file download, last backup date, reminder after 23 hours | #51 | 1.5 | 0.6 | 0.25 |
| 20 (#106) | Restore script: turns a backup file into SQL for the SQL Editor | #51 | 1.5 | 0.6 | 0.16 |
| 21 (#107) | Restore once in the test database and check nothing is missing; PR; production | #51 | 1 | 1 | 0.3 |
| 22 (#108) | DB: undo_entry with the same PIN, only shortly after saving; SQL tests (added on November 9 with #20) | #20 | — | — | 0.25 |
| 23 (#109) | Form: "Deshacer" for 10 seconds, hidden when a new entry starts, removed entry back in the form | #20 | — | — | 0.25 |
| 24 (#110) | Test #20 on phone, PR, production | #20 | — | — | 0.25 |
| | **Dev total** | | **~26.75** (21.5 planned + 5.25 for #51) | **~14.2** (11.5 planned + 2.7 for #51) | **8.05** (the task rows add up to 7.84; the difference is rounding) |

## Daily Log

At the end of every working session: done / next / blocked / hours worked / goal on track (yes or no).

04/11 at night: did the review, retro and sprint planning at night, and took 3 hours. Next time I will split the review and retro for this sprint, and the planning for next sprint on the next day. 
done: review, retro and planning / next is #16 starting with #88 / no blocks / worked 3 hours / yes

05/11 a) Finished #88, investigation to keep the DB alive / next is #89, creating the schedule / no blocks / worked 10 minutes / yes

05/11 b) Finished #89, the github automatic task / next is #31, starting with #92, DB for staff profiles edits / no blocks / worked 15 minutes / yes

05/11 c) Finished #92 / next is #93, frontend for account addition from operator / no blocks / worked 20 minutes / yes

05/11 d) Finished #93, frontend for account edition / next is #94, users reset their PIN / no blocks / worked 25 minutes / yes

05/11 e) Finished #94 / Next is #95, test and PR / no blocks / worked 10 minutes / yes

05/11 f) Finished #95, with big delays because Vercel is unstable / next is #58 / no blocks now / worked 30 minutes / yes

05/11 g) progress in the faulty computers / next is updating firefox / blocked because the computer was in use, will try again later / worked 40 minutes / yes

05/11 h) finished the problem about the faulty computers / next is #30, starting with #96 / no blocks / worked 10 minutes / yes

05/11 i) Finished #30 along with #96, #97 and #98 / next is #33 starting with #99, operator lists / no blocks / worked 45 minutes / yes

07/11 a) Checked #90, keeping the database alive, will check again on the 13th / next is #33 starting with #99, operator lists / blocked on this one until the 13th / worked 10 minutes / yes

07/11 b) #99 and #100, DB on operator lists / next #101, frontend for operators lists / no blocks / worked 50 minutes / yes

08/11 a) #101, 102, 115 and 103, operators lists finished / next is #51 starting with #104 / no blocks / worked 110 minutes / yes

08/11 b) #104, #105, #106, backups / next is #107 test backups and PR / no blocks / worked 45 minutes / yes

09/11 a) #107, check backups / next is #20 starting with #108, undo button / blocked until operator does a backup / worked 20 minutes / yes

09/11 b) #108 and #109 / next is #110, testing / no blocks / worked 30 minutes / yes

13/11 #110 finished / next is handover / no blocks / worked 15 minutes / yes

Total this sprint:
PO: 3 hours 30 minutes
Dev: 8 hours 05 minutes

## Review

*Held on November 13, two days after the sprint ended (work commitments).*

**Sprint goal: met.** The app keeps working through weeks without entries (#16: the keep-alive job ran over several days, with activity visible in both databases), and the operator manages staff accounts herself (#31).

**Accepted by the PO:**

- Goal: [#16 Keeping the database alive](https://github.com/amarechaldev/FotocopiasUPB/issues/16), [#31 Operator edits staff profiles](https://github.com/amarechaldev/FotocopiasUPB/issues/31).
- Also planned: [#58](https://github.com/amarechaldev/FotocopiasUPB/issues/58) (investigation: an up-to-date Firefox fixed one computer; the other probably fails because of an old antivirus, and the operator uses the three computers that work), [#30 Staff edits own profile](https://github.com/amarechaldev/FotocopiasUPB/issues/30), [#33 Operator edits the lists](https://github.com/amarechaldev/FotocopiasUPB/issues/33) (with [#115](https://github.com/amarechaldev/FotocopiasUPB/issues/115), staff choosing a new default when their department is archived).
- Added during the sprint: [#51 Local backups](https://github.com/amarechaldev/FotocopiasUPB/issues/51) (restore proven on the test database) and [#20 Undo button](https://github.com/amarechaldev/FotocopiasUPB/issues/20) (requested by the operator; protected by the person's PIN).
- [#114 Operator password reset](https://github.com/amarechaldev/FotocopiasUPB/issues/114): closed as won't do, at the operator's request; the manual procedure is in [maintenance.md](../maintenance.md).
- The cut line was not used. All features were tested following the plan and are in production.

**The Handover milestone is complete: the product is feature-complete.** The only open issue is an idea without a milestone ([#6](https://github.com/amarechaldev/FotocopiasUPB/issues/6), University access).

**Stakeholders:**

- November 6: the University and all stakeholders accepted the app.
- The pilot is running smoothly with real users.
- The operator chose a phone as the shared device, from January 2027; the tablet option is dropped.

**Ideas raised during the sprint, on hold** (no milestone, to be decided with evidence after the January rollout):

- Registering from staff members' own phones through a QR code, on an entry-only screen, with the shared phone as the fallback.
- Blocking an account after 3 wrong PINs, unblocked by the operator: on hold at the operator's request.

**For the Retrospective:** the sprint closed two days late. The #20 tasks were added without planned estimates.

**Next:** no new features are planned. The handover work replaces a fifth sprint (see the Retrospective, action D2): final checks on the operator's devices (including her old phone), the one-page handover agreement, a January launch checklist with her, and updating the README with the results.

## Retrospective

*Held on November 13, two days after the sprint ended (work commitments). This is the last Retrospective of the sprint cadence.*

**Sprint 3 actions:**

- **C1 (two estimation rules): half met.** Testing, PR and deploy tasks: all between 0.3× and 0.75× of the estimate, none over 2× (target met). Tasks within ±50%: 11 of 20, fewer than Sprint 3's 12 of 17 (target not met). Every miss was an overestimate: building tasks ran at about 0.3–0.45× even after dividing by 2.5. Dev total: 14.2 hours planned, 8.05 actual.
- **C2 (test once, then check): done, and it worked.** Testing was lighter, and no bug reached production.
- **Actual hours before the Review:** Dev hours were filled in before the Review; PO hours (3.5) were added after the closing, for a total of 11.55 hours.

**What went well:**

- The sprint goal was met, and every planned story was done, including #33, the cut candidate. #51 and #20 were added and finished. The cut line was not used.
- The Handover milestone is complete: the app is feature-complete.
- The University and all stakeholders accepted the app on November 6, before the first real report: the top risk is retired.
- The #58 investigation stayed well inside its 2-hour timebox and found a solution for one computer.
- Finishing the app was the best part of the sprint.

**What didn't go well:**

- My main job took November 10–12 completely, so the sprint closed two days late. The only alternative was losing sleep, which is not acceptable: this is a side project, not my main focus.
- #20 was added without planned estimates.

**Insights:**

- I keep getting faster, so the Developer assistant's estimates, even divided by 2.5, no longer fit. My own judgement is the better estimate.
- Accepting the slip was right: a sustainable pace matters more than the calendar date. Recording it honestly is what the process needs.
- Finishing #110 after the end date was a conscious exception: only testing and the PR were left, and it completed the whole app. Strict Scrum would have moved it to the next sprint; bending the rule knowingly, and writing it down, is fine.
- With no features left to build, weekly sprints would be pure overhead. The process should fit the work.

**Actions:**

| # | Action | Owner | How it is checked |
| --- | --- | --- | --- |
| D1 | **Own estimates.** In any future planning, I estimate tasks myself, without the Developer assistant's numbers, and keep comparing planned with actual hours. | Dev | The planned vs. actual comparison in the next sprint I plan, on this project or another. |
| D2 | **The sprints end; a checklist takes over.** Sprint 5 is replaced by a handover checklist: final checks on the operator's devices (including her old phone), the one-page handover agreement, the pilot totals check around November 22, the January launch checklist, and the README. | Team | Every checklist item is ticked or explicitly dropped. |

**Suggestion:** a final project retrospective after the January launch (about an hour): the whole journey from the first hypotheses to real use, what each role taught me, and what I would do differently in a real team.
