# Product Brief

## Vision

For the operator of the printing service at UPB who must produce a monthly detailed report for the university of her billable services, Fotocopias UPB is a service registration app that reduces the time she takes to do the report from days to minutes and reduces user entry errors like wrong departments, illegible handwriting and calculation errors like skipped cells in sums.

## Problem

Every month, the operator must deliver a report of her billable services to the University: copies and anillados per department, in Bs, which the University checks and department managers sign. Today she builds it by hand from a paper record of 300–500 handwritten entries, a task of about one hour that stretches to one or two days because of interruptions. The process is error-prone at both ends: staff write illegible entries or choose the wrong department, and hand-built sums skip entries (in September 2026, about 117 copies went unbilled).

## Users and Stakeholders

| Who | Role | Why they matter |
| --- | --- | --- |
| **Operator** | Primary user and customer. Reviews entries, manages prices and departments, produces the monthly report. | Owns the problem and decides whether the app is adopted. |
| **Staff** (internal staff and visiting teachers) | Register each service they use, on the shared tablet at the service. Visiting teachers have a personal code; internal staff do not. | If registering is harder than writing on paper, they will keep using paper. |
| **University Administrator** (and her assistant) | Receives the monthly report, checks it and collects the managers' signatures. | Can reject a record that lacks acceptable proof of each request. |
| **Department managers** | Sign the monthly summary for their department, which is charged to their budget. | Need correct totals per department. |

## Goals

- Every service is recorded reliably, without department errors nor illegible handwriting and without writing into a paper notebook.
- The detailed report is printed with a good format and without calculations errors.
- The general report is generated in minutes and without errors.
- The University accepts the new process without physical signatures.

## Non-Goals

Payments are not included in this project, nor accounting. Conversion of services into "copias" is left to the operator.

## MVP Scope

- Staff must be able to insert entries, by choosing their department in a list and typing numbers, without using their own internet (the operator has a private internet connection that she doesn't share with users).
- The operator must be able to print all entries (like the photocopy she currently takes of the paper notebook), totals must be included.
- A general report for department managers must be produced.
- The operator must be able to edit individual entries.

## Planned after MVP

- Some fields like anillados prices and the list of departments won't be editable for now, they change once a year.
- Visiting teachers enter their personal code to identify themselves, replacing the signature (needed before full rollout, not for the pilot). Codes are trusted as entered, just as signatures are today; there is no list of valid codes.
- Name and department are filled in automatically from a teacher's code.
- The university may want to access the app directly to check the records.

## Constraints

- **Internet only through the operator's connection.** Both Wi-Fi and mobile data are extremely unreliable at the service location, but the operator has a private connection that works. The tablet uses that connection; staff never need one of their own. If the connection drops, staff fall back to the paper notebook, and the operator enters those entries in the app later.
- **Shared tablet at the service.** Staff register on a tablet at the service location, provided by the operator. Using staff's own phones was discarded (October 2026). The operator also has a computer, which she uses to prepare the report today.
- **Registration as quick as paper.** Staff register while their copies are printing; it must take no longer than writing on paper.
- **Conversions stay with the operator.** The app records equivalent copies as the operator states them (e.g. a color copy = 5 copies); it does not convert services itself.
- **Prices set by the operator.** One price per copy and one price per anillado size (13 sizes). Prices can change once a year.
- **Departments change.** The list (12 in September 2026) can grow or shrink, and a visiting teacher can be charged to any of several departments.
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
| **The University rejects records without signatures** | Blocks adoption entirely | Start with a pilot in a few small departments without visiting teachers (Internacionalización, Orientación, DAAE Cultura, DAAE Deportes), and show its first report to the University before rolling out to all departments. |
| **Staff resist the change**, especially if registering takes longer than on paper | Paper keeps coming back, and with it the manual work | Learn from the pilot departments before full rollout. Keep paper as a fallback. The operator encourages staff at the counter. |
| **Records are lost** if the connection drops or the device fails | Lost income, and the "no lost records" promise is broken | Staff see clearly whether each entry was saved; if not, they use the paper notebook and the operator enters it later. Regular backup or export. During the pilot, the pilot departments keep a paper record to compare with. |
**Pilot limitations:**

- **Visiting teachers are not tested.** The pilot departments were chosen because they have no visiting teachers, so validation with teacher codes, and whether the University accepts it, will only be tested at full rollout.
- **Small sample.** The four pilot departments had about 27 entries in September 2026. That is enough to check that the app works and that totals are correct, but not to judge registration speed or staff habits under real load.
