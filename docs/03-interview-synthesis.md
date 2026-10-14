# Interview Synthesis

## Context

Synthesis of the first interview with the operator ([02-first-interview.md](02-first-interview.md)), compared against the beliefs recorded before it in [01-initial-hypotheses.md](01-initial-hypotheses.md). It also includes details from the interview that were not captured in the notes in file 02. File 01 is kept unchanged as a snapshot of what was believed before the interview.

## Key Findings

1. **Signatures are the trust mechanism of the whole system.** A signature proves that the service was really used. Each staff member signs each entry in the paper record. Department managers then sign the whole monthly report once, because each department has its own budget. An app without signatures could be rejected by the University (see H5).
2. **The University is a key stakeholder, not a minor one.** The University Administrator and her assistant review the records and collect the managers' signatures. Each month the University Administrator receives a photocopy of the original paper record along with the Excel report, so the University sees every entry, broken down by department, and could reject the app.
3. **The internet constraint is worse than expected.** Both Wi-Fi and mobile data are "extremely unreliable" at the service location. The operator suggested buying a tablet for registration, which is a strong signal, but no solution is chosen yet.
4. **The pain is real, but not quite the one expected.**
   - **Time:** the work itself takes about one hour per month, but it stretches to one or two days because of interruptions.
   - **Errors:** they happen at entry, not when adding up: staff register under the wrong department, or entries are unreadable.
   - **Her own wish:** automate the process, to reduce errors and make the report faster.
5. **Volume:** 300–500 entries per month, from dozens of staff members (internal staff and visiting teachers) across 12 departments. The list of departments is not fixed: departments can be added or removed. Visiting teachers have no department of their own; each one can fall under any of several departments. Teachers have a personal code; anyone without one is internal University staff.
6. **Billing:** monthly; the billing period runs from the 23rd to the 22nd. The invoice shows only quantities, not money amounts. Conversions (e.g. a color copy = 5 simple copies) are internal to the operator and set at her sole discretion: she tells people "write 5 copies" and they write it. She does not want conversions in the app. The app records **copies** and **anillados** as entered (the anillados column stays), and the operator handles all conversions herself.
7. **Workflow:** staff fill in the entry during the service, while their copies are printing. The "descripción" field is free text, usually 1–4 words describing what is copied or printed ("Exams", "Documents for X School visit"). The operator has a computer, which she uses to prepare the Excel report.

## Hypotheses Status

| Hypothesis | Status | Evidence |
| --- | --- | --- |
| **H1:** To approve each invoice, the University requires a record of the requests fulfilled. | **Confirmed, stronger than expected** | The University receives a photocopy of the whole paper record, with signatures, along with the Excel report broken down by department. |
| **H2:** Adding up totals by hand leads to errors in the invoice. | **Reframed** | Errors happen at entry (wrong department, illegible handwriting), not in the addition. See H2'. |

- **H2' (reframed):** Errors at entry (wrong department, illegible handwriting) lead to wrong totals per department.

## New Hypotheses

- **H3:** The University requires some form of proof that each request really happened (today, the staff member's signature) in order to accept the record. *Confirmed: a signature proves that the service was really used.*
- **H4:** Most of the time spent on the invoice comes from interruptions during a long manual task, so reducing the task to minutes would remove most of the delay.
- **H5:** For teachers, a personal teacher code entered at registration is enough proof for the University, replacing the signature. This will only be known once the operator shows an MVP to the University Administrator. Only teachers have a personal code; anyone without one is internal University staff, and no replacement for their signature has been proposed yet.

## Risks

- **R2: The University rejects a record without signatures (top risk).** Each entry is signed today, and managers sign the monthly report. If the app cannot offer equivalent proof that the University accepts, the project may not be adopted at all, regardless of how well it serves the operator. Mitigation under test for teachers: H5 (personal teacher code), validated by showing an MVP to the University Administrator. Internal staff have no personal code, so they are not covered yet.
- **R3: Registration cannot rely on the network.** Both Wi-Fi and mobile data are extremely unreliable, so any registration that depends on a live connection will fail, and staff will fall back to paper (see R1).
- **R4: Staff cannot or will not use their own phones.** Combined with R3, registration on personal phones may not be viable.

R1 (staff refuse to use the tool) from [01-initial-hypotheses.md](01-initial-hypotheses.md) still stands, although it is eased: staff fill in the entry while their copies are printing, so they already have idle time to register.

## Changed Assumptions

| Before (file 01) | After the interview |
| --- | --- |
| The University is a minor stakeholder and does not need to approve the tool. | The University reviews the full record and could reject the app. On the power/interest grid it moves from *Monitor* to *Keep satisfied*, possibly *Manage closely*. |
| The University will not use the tool to check records. | The University already checks the whole paper record each month. |
| Internet is intermittent; staff can switch to mobile data. | Both Wi-Fi and mobile data are extremely unreliable. |
| Staff use their own cellphones to register services. | Uncertain. The operator suggested a shared tablet at the service location. |
| The operator bills the University monthly. | Confirmed: monthly; the billing period runs from the 23rd to the 22nd. |

## Remaining Open Questions

- Can we see her Excel report and a page of the paper record, anonymized? These are effectively the output spec.
- Will the University accept a teacher's personal code instead of a signature? (H5, answered by the MVP demo to the University Administrator.)
- What proof can replace the signature for internal staff, who have no personal code?
