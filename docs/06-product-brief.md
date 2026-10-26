# Product Brief

## Vision

For the operator of the printing service at UPB who must produce a monthly detailed report for the university of her billable services, Fotocopias UPB is a service registration app that reduces the time she takes to do the report from days to minutes and reduces user entry errors like wrong departments, illegible handwriting and calculation errors like skipped cells in sums.

## Problem

Every month, the operator must deliver a report of her billable services to the University: copies and anillados per department, in Bs, which the University checks and department managers sign. Today she builds it by hand from a paper record of 300–500 handwritten entries, a task of about one hour that stretches to one or two days because of interruptions. The process is error-prone at both ends: staff write illegible entries or choose the wrong department, and hand-built sums skip entries (in September 2026, about 117 copies went unbilled).

## Users and Stakeholders

| Who | Role | Why they matter |
| --- | --- | --- |
| **Operator** | Primary user and customer. Reviews and corrects entries, registers entries on behalf of others, produces the monthly report. Edits staff profiles, resets forgotten PINs and manages prices, departments and description lists from the full rollout. | Owns the problem and decides whether the app is adopted. |
| **Staff** (internal staff and visiting teachers) | Each one has a personal account (name, one or more departments, PIN) and registers each service they use on the shared phone or tablet at the service. | If registering is harder than writing on paper, they will keep using paper. |
| **University Administrator** (and her assistant) | Receives the monthly report, checks it and collects the managers' signatures. Requires each entry to be made from a personal account protected by a PIN (non-negotiable). | Can reject the record; actively shapes the product. |
| **Department managers** | Sign the monthly summary for their department, which is charged to their budget. | Need correct totals per department. |

## Goals

- Every service is recorded reliably, without department errors nor illegible handwriting and without writing into a paper notebook.
- The detailed report is printed with a good format and without calculations errors.
- The general report is generated in minutes and without errors.
- The University accepts the new process, with PIN-protected personal accounts replacing physical signatures.

## Non-Goals

Payments are not included in this project, nor accounting. Conversion of services into "copias" is left to the operator.

## MVP Scope

- Staff must be able to insert entries, by choosing their department in a list and typing numbers, without using their own internet (the operator has a private internet connection that she doesn't share with users).
- The operator must be able to print all entries (like the photocopy she currently takes of the paper notebook), totals must be included.
- A general report for department managers must be produced.
- The operator must be able to edit individual entries.
- Each staff member creates a personal account (name, one or more departments with one marked as default, PIN) in a separate screen on the shared device, and registers requests with their name and PIN. They are logged out automatically after each entry. Required by the University.
- The operator logs in on her computer with a password; her screens cannot be opened without it. She stays logged in (no automatic logout), as only she uses that computer.
- The database is backed up daily: the operator starts the backup with one button, and the app reminds her when it is due.
- During the pilot, account changes (names, departments, forgotten PINs) are made by the developer directly in the database; a forgotten PIN is replaced by a new one that the developer sets, so the developer knows it until the person can change it. The full rollout brings the operator's profile and PIN-reset screen (#31) and staff editing their own profile (#30), after which nobody, including the operator, can see a PIN.
- Common descriptions are suggested while still allowing free text; descriptions that are too vague (e.g. "copias") are blocked with a clear message.
- The operator can register entries on behalf of other people (e.g. paper entries after a connection drop). On her screen, entries show a "modified" or "manually entered" status, not printed in the reports.

## Planned after MVP

- Some fields like anillados prices and the list of departments won't be editable for now, they change once a year.
- Editing the lists of common and too-vague descriptions: until then, the developer maintains them.
- The operator edits staff profiles and resets forgotten PINs (#31), and staff edit their own profile (#30): full rollout.
- The university may want to access the app directly to check the records.

## Constraints

- **Internet only through the operator's connection.** Both Wi-Fi and mobile data are extremely unreliable at the service location, but the operator has a private connection that works. The shared device uses that connection; staff never need one of their own. If the connection drops, staff fall back to the paper notebook, and the operator enters those entries in the app later.
- **Shared phone or tablet at the service.** Staff register on a shared device at the service location, provided by the operator: an old phone or a tablet, her choice. The app must work well on a phone-sized screen. Using staff's own phones was discarded (October 2026). The operator also has a computer, which she uses to prepare the report today.
- **PIN-protected personal accounts.** The University requires every entry to be made from a personal account protected by a PIN (non-negotiable). Staff use the service only occasionally, so PINs will be forgotten.
- **Registration as quick as paper.** Staff register while their copies are printing; it must take no longer than writing on paper.
- **Conversions stay with the operator.** The app records equivalent copies as the operator states them (e.g. a color copy = 5 copies); it does not convert services itself.
- **Prices set by the operator.** One price per copy and one price per anillado size (13 sizes). Prices can change once a year.
- **Departments change.** The list (12 in September 2026) can grow or shrink, and a staff member can make requests for several departments.
- **Fixed billing period and output.** The period runs from the 23rd to the 22nd. The report must match the current summary: per department, copies, copies amount, anillados, anillados amount and total, plus grand totals.
- **Volume.** 300–500 entries per month.

## Success Metrics

Targets are proposals, to be confirmed with the operator.

| Metric | Baseline (today) | Target | How to measure |
| --- | --- | --- | --- |
| Time to register an entry | Time 5–10 paper entries | No longer than on paper | Time a few staff members during the first week |
| Help needed from the operator | — | Less than 1 in 20 entries after week 2 | The operator keeps a simple tally |
| Time to produce both reports | 1–2 days | 15 minutes or less | The operator times it at the end of the month |
| Calculation errors | About 117 copies missed (September 2026) | 0 | Compare app totals with a manual check for the pilot departments |
| Adoption | 0% | At least 90% of entries in the app by month 2 | Count paper entries vs. app entries |
| Lost records | — | 0 | Compare with a paper record kept by the pilot departments |
| University acceptance | — | First report accepted without paper signatures | Yes or no |

## Top Risks

| Risk | Why it matters | How to handle it |
| --- | --- | --- |
| **The University rejects the record** | Blocks adoption entirely | Meet its requirement: PIN-protected personal accounts in the MVP. Start with a pilot in three departments chosen by the operator (DAAE Cultura, DAAE Deportes, VRA), and show its first report to the University before rolling out to all departments. |
| **Staff resist the change**, especially if registering takes longer than on paper | Paper keeps coming back, and with it the manual work | Learn from the pilot departments before full rollout. Keep paper as a fallback. The operator encourages staff at the counter. |
| **Records are lost** if the connection drops or the device fails | Lost income, and the "no lost records" promise is broken | Staff see clearly whether each entry was saved; if not, they use the paper notebook and the operator enters it later. Daily backup started by the operator, with a reminder in the app; at most one day of entries can be lost. The monthly report PDFs are an extra record. During the pilot, the pilot departments keep a paper record to compare with. |
| **Staff forget their PIN** | Registration stops at the counter; staff go back to paper, and resets add work for the operator | Staff choose their own PIN. During the pilot (2–3 staff), the developer replaces a forgotten PIN in the database and removes it from the SQL history; from the full rollout, the operator launches a reset and the person chooses a new PIN. During the pilot, count how often PINs are forgotten. |

**Pilot limitations:**

- **Visiting teachers are not tested.** Visiting teachers only make requests for Ingenierías and Empresariales, which are not in the pilot, so accounts with several departments will only be tested at full rollout.
- **Small sample.** The three pilot departments had about 38 entries (about 5,700 copies) in September 2026. That is enough to check that the app works and that totals are correct, and to get a first idea of registration speed and staff habits, but not under full load.
