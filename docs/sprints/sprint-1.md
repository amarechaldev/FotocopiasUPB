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

## Review

*To be completed on October 21: which stories were accepted, what was shown to the operator, and her feedback.*

## Retrospective

*To be completed on October 21.*

- **What went well:**
- **What didn't go well:**
- **What I will change:**
