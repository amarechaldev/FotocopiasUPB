# Epics

Epics derived from the MVP scope in [06-product-brief.md](06-product-brief.md): E1–E5 are part of the MVP, E6 comes after it. Each epic is split into user stories in GitHub.

## E1: Service Registration

Staff register each service they use, on the shared phone or tablet at the service.

- **Value:** every request is recorded legibly, under a department chosen from a list, without a paper notebook.
- **Goals served:** 1 (reliable recording), 4 (University acceptance, through proof of each request).
- **Done when:** staff can register any copy or anillado request on the shared device in no more time than on paper, and they always see clearly whether their entry was saved.

**Notes for stories:**

- Fields from the paper notebook: fecha, área, nombre, descripción, copias, anillados.
- Fecha is recorded automatically; the other fields are entered by staff.
- Área is chosen from the list of departments.
- Copias is a number.
- Anillados: a quantity, with a size chosen from the list of 13 sizes.
- With personal accounts (E5), name and department come from the account; personal teacher codes are no longer used.
- The list of departments and the anillado sizes are set up by the developer in the MVP.

## E2: Entry Correction

The operator reviews and edits individual entries to fix mistakes, and registers entries on behalf of other people.

- **Value:** wrong departments, quantities or names can be fixed before the reports are produced, so totals are correct; paper entries (e.g. after a connection drop) reach the app.
- **Goals served:** 1 (reliable recording), 2 and 3 (reports without errors).
- **Done when:** the operator can find any entry of the current billing period and correct it, can register an entry for another person, and the reports reflect it.

**Notes for stories:**

- The operator registers entries for others from her own account, choosing the person's name.
- On her screen, entries show a "modified" or "manually entered" status. This status is not printed in the reports.

## E3: Detailed Report

The operator generates a report containing all the individual requests of a billing period.

- **Value:** the University receives a legible, complete record of every request, replacing the photocopy of the paper notebook.
- **Goals served:** 2 (detailed report without errors), 4 (University acceptance).
- **Done when:** the operator can print the detailed report for any billing period (23rd to 22nd), including totals, and the University accepts it.

## E4: Global Report

The operator generates a report with totals and prices per department, to be signed by department managers.

- **Value:** the monthly summary is ready in minutes, with correct totals, replacing the manual Excel report.
- **Goals served:** 3 (general report in minutes, without errors).
- **Done when:** the operator can print the global report for any billing period, matching the current summary format (per department: copies, copies amount, anillados, anillados amount and total, plus grand totals).

**Notes for stories:**

- Prices: Bs 0.30 per copy, and one price per anillado size (see [05-report-analysis.md](05-report-analysis.md)). Set up by the developer in the MVP.

## E5: Staff Accounts

Each staff member has a personal account protected by a PIN, and registers requests with it. Required by the University (non-negotiable).

- **Value:** every entry is tied to a personal account, which the University accepts in place of a handwritten signature.
- **Goals served:** 4 (University acceptance), 1 (reliable recording).
- **Done when:** staff can create an account on the shared device and register requests with their name and PIN; the operator can edit any profile and reset a forgotten PIN.

**Notes for stories:**

- Account fields: name (unique), one or more departments with one marked as default, PIN chosen by the person (entered twice).
- Accounts are created by each person, in a separate screen on the same shared device.
- At registration, the default department is selected; switching to another department of the account needs no warning; a department outside the account shows a warning.
- After each entry is saved, the person is logged out automatically.
- PIN reset: the operator launches it while the person is present, and the person immediately chooses a new PIN. Nobody can see a PIN.
- Staff editing their own profile comes with the full rollout; until then, the operator edits profiles.
- Personal teacher codes are no longer used: everyone has an account and a PIN.

## E6: Settings (after the MVP)

The operator maintains the app's reference lists herself. Until then, the developer updates them.

- **Value:** the operator no longer depends on the developer when prices, departments or descriptions change.
- **Goals served:** 1 (reliable recording), 3 (correct reports).
- **Done when:** the operator can edit the list of departments, the prices (copies and anillado sizes), and the lists of common and too-vague descriptions.
