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

**Cut line:** if time runs short, #33 moves to Sprint 5 (November 12–18), which still allows a handover in November.

**Next in the backlog** (top of Sprint 5): [#51 Local backups](https://github.com/amarechaldev/FotocopiasUPB/issues/51) (E6), [#20 Undo button](https://github.com/amarechaldev/FotocopiasUPB/issues/20) (E1).

**PO work:**

- Arrange the University preview with the operator: both reports shown to the University representative before the handover.
- Draft the one-page handover agreement: what is fixed and how fast, for how long, what is not included, who owns the accounts (GitHub, Vercel, Supabase) and who pays any costs.

**Notes:**

- #16: the database must stay active from the end of the pilot (November 22) until the full rollout in January, more than six weeks without entries. This cannot be tested by waiting: the Dev provides evidence of how it works.
- Archive, never delete, what past entries refer to: departments, staff profiles and anillado sizes. Entries and descriptions can be deleted (#31, #33).
- Prices (#33): a price change applies from a chosen period; reports for earlier periods keep the old prices.
- #58 depends on access to the operator's second computer: arrange a time with her.
- The pilot is running: test on the preview first, then a short check in production (Definition of Done, action C2).

**Capacity:** about 17 hours in total, PO and Dev: November 4 (3 h PO) November 5 (2 h), November 6 (2 h), November 7 (1 h), November 8 (1 h), November 9 (2 h), November 10 (2 h), November 11 (4 h).

| Work | Planned hours | Actual hours |
| --- | --- | --- |
| PO | 6 | |
| Dev | 11 | |
| **Total** | **~17** | |

**Tasks** (action C1: building tasks, the Dev assistant's estimate ÷ 2.5; testing, PR and deploy tasks, the Dev assistant's estimate as given; my own judgement has the final word):

| # | Task | Story | Dev assistant (h) | Planned hours | Actual hours |
| --- | --- | --- | --- | --- | --- |
| 1 (#88) | Evidence: Supabase pause rule, plans of both projects, what counts as activity, data in a paused project | #16 | 0.5 | 0.2 | 0.16 |
| 2 (#89) | Scheduled GitHub Actions job calling both databases every 3 days; one manual run | #16 | 0.75 | 0.3 | 0.25 |
| 3 (#90) | Evidence: job runs over several days, activity in Supabase; tech-decisions row; PR | #16 | 0.5 | 0.5 | |
| 4 (#91) | Investigation on the operator's computer (timeboxed to 2 hours) | #58 | 2 | 2 | |
| 5 (#92) | DB: PIN reset, operator profile updates, archive/reactivate/delete; SQL tests | #31 | 1.75 | 0.7 | 0.33 |
| 6 (#93) | Operator "Cuentas" screen: list with search, reset marker, edit form, archive/reactivate/delete, confirmation | #31 | 2.25 | 0.9 | 0.4 |
| 7 (#94) | Staff form: a name with a pending PIN reset asks for the new PIN twice | #31 | 1 | 0.4 | 0.16 |
| 8 (#95) | Test #31 on preview and tablet, PR, migration in production | #31 | 0.75 | 0.75 | 0.5 |
| 9 (#96) | DB: staff update their own profile with their PIN, reusing #31's checks; SQL tests | #30 | 0.75 | 0.3 | 0.25 |
| 10 (#97) | "Mi cuenta" screen: log in with name and PIN, edit, new PIN twice, logout message | #30 | 1.5 | 0.6 | 0.25 |
| 11 (#98) | Test #30 on tablet, PR, production | #30 | 0.5 | 0.5 | 0.25 |
| 12 (#99) | DB: copy and anillado prices from a chosen period; reports use each period's prices; anillado sizes archivable; tests | #33 | 2 | 0.8 | |
| 13 (#100) | DB: operator functions for departments, sizes, common and too-vague descriptions, with the checks; tests | #33 | 1.5 | 0.6 | |
| 14 (#101) | "Listas" screen: copy and anillado prices, each with the period it starts from | #33 | 1.5 | 0.6 | |
| 15 (#102) | "Listas" screen: departments, anillado sizes, common descriptions with departments, too-vague descriptions | #33 | 2 | 0.8 | |
| 16 (#103) | Test #33 (earlier reports keep old prices), PR, production | #33 | 1 | 1 | |
| | **Dev total** | | **~20** | **~11** | |

## Daily Log

At the end of every working session: done / next / blocked / hours worked / goal on track (yes or no).

04/11 at night: did the review, retro and sprint planning at night, and took 3 hours. Next time I will split the review and retro for this sprint, and the planning for next sprint on the next day. 
done: review, retro and planning / next is #16 starting with #88 / no blocks / worked 3 hours / yes

05/11 a) Finished #88, investigation to keep the DDB alive / next is #89, creating the schedule / no blocks / worked 10 minutes / yes

05/11 b) Finished #89, the github automatic task / next is #31, starting with #92, DB for staff profiles edits / no blocks / worked 15 minutes / yes

05/11 c) Finished #92 / next is #93, frontend for account adition from operator / no blocks / worked 20 minutes / yes

05/11 d) Finished #93, frontend for account edition / next is #94, users reset their PIN / no blocks / worked 25 minutes / yes

05/11 e) Finished #94 / Next is #95, test and PR / no blocks / worked 10 minutes / yes

05/11 f) Finished #95, with big delays because Vercel is unstable / next is #58 / no blocks now / worked 30 minutes / yes

05/11 g) progress in the faulty computers / next is updating firefox / blocked because the computer was in use, will try again later / worked 40 minutes / yes

05/11 h) finished the problem about the faulty computers / next is #30, starting with #96 / no blocks / worked 10 minutes / yes

05/11 i) Finished #30 along with #96, #97 and #98 / next is #33 starting with #99, operator lists / no blocks / worked 45 minutes / yes

Total this sprint:
PO: 3 hours
Dev: 3 hours 25 minutes

Started work on #96: 17:34

## Review

*To be completed on November 11.*

## Retrospective

*To be completed on November 11. Check actions C1 and C2 from Sprint 3. Fill in the Actual columns in the last session, before the Review.*
