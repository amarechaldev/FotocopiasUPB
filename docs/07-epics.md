# Epics

MVP epics, derived from the MVP scope in [06-product-brief.md](06-product-brief.md). Each epic will be split into user stories.

## E1: Service Registration

Staff register each service they use, on the shared tablet at the service.

- **Value:** every request is recorded legibly, under a department chosen from a list, without a paper notebook.
- **Goals served:** 1 (reliable recording), 4 (University acceptance, through proof of each request).
- **Done when:** staff can register any copy or anillado request on the tablet in no more time than on paper, and they always see clearly whether their entry was saved.

**Notes for stories:**

- Fields from the paper notebook: fecha, área, nombre, descripción, copias, anillados.
- Fecha is recorded automatically; the other fields are entered by staff.
- Área is chosen from the list of departments.
- Copias is a number.
- Anillados: a quantity, with a size chosen from the list of 13 sizes.
- Users with a personal code (visiting teachers) enter it; their name, and possibly their department, are filled in from previous entries.
- The list of departments and the anillado sizes are set up by the developer in the MVP.

## E2: Entry Correction

The operator edits individual entries to fix mistakes.

- **Value:** wrong departments, quantities or names can be fixed before the reports are produced, so totals are correct.
- **Goals served:** 1 (reliable recording), 2 and 3 (reports without errors).
- **Done when:** the operator can find any entry of the current billing period and correct it, and the reports reflect the correction.

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