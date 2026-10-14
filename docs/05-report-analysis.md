# Report Analysis

## Context

Analysis of the monthly report the operator delivers to the University, using the September 2026 report she provided ([04-ReportExample.xlsx](04-ReportExample.xlsx)), plus a short follow-up conversation with her. The report is the real output of the current process, so it defines what the app must produce.

It also corrects some findings in [03-interview-synthesis.md](03-interview-synthesis.md). File 03 is kept unchanged; corrections are listed here.

## Structure of the Report

The Excel file has two sheets.

### Sheet 1: Summary (checked and signed by department managers)

One row per department, with these columns:

| Column | Meaning |
| --- | --- |
| Áreas | Department (12 departments in September 2026) |
| Fotocopias | Number of copies |
| Bs | Amount for copies (copies × unit price) |
| Anillados | Number of anillados (bindings) |
| Bs | Amount for anillados |
| Total | Copies amount + anillados amount |

A final row adds up every column. The header shows the month and year.

Departments in September 2026: VRA, Administración, Empresariales, Ingenierías, DAAE Admisiones, DAAE Registros, Internacionalización, Voluntariado, Orientación, DAAE Cultura, DAAE Deportes, Marketing.

September 2026 totals: **41,184 copies, 33 anillados, Bs 12,519.70.**

### Sheet 2: Detail (working sheet)

For each department:

- A column (or several columns, for large departments) with the number of copies of each entry, typed in from the paper record, followed by hand-built sums. No dates, names or descriptions are kept: only numbers.
- For departments that used anillados, a small table with one row per binding size: quantity and amount.

The layout differs from one department to the next, and totals are built with formulas written by hand for each block. This sheet is the manual work the app should remove.

## Prices

### Copies

A single unit price: **Bs 0.30 per copy**. Other services (e.g. color) are still converted into equivalent copies by the operator, as described in file 03.

### Anillados

Priced by size, 13 sizes:

| Size (mm) | Price (Bs) | Source |
| --- | --- | --- |
| 7 | 4.00 | Formula |
| 9 | 4.50 | Formula |
| 12 | 5.00 | Deduced from a typed amount (2 × 12 mm = Bs 10) |
| 14 | 5.50 | Deduced from a typed amount |
| 17 | ? | Not found in the file |
| 20 | 6.50 | Formula |
| 23 | 7.00 | Formula |
| 25 | 7.50 | Formula |
| 29 | 8.00 | Deduced from a typed amount |
| 33 | 8.50 | Formula |
| 40 | 10.00 | Formula |
| 45 | 12.00 | Formula |
| 50 | ? | Not found in the file |

Prices marked "deduced" or "?" must be confirmed with the operator.

These prices can change once a year, the operator herself decides the prices.

## Corrections to the Interview Synthesis

| File 03 said | The report shows |
| --- | --- |
| The invoice shows only quantities, not money amounts. | The report shows money amounts (Bs) per department, for copies and for anillados. |
| The app records anillados "as entered", as a simple count. | Anillados have a size, and each size has its own price. Anillados are billed separately from copies. |

Conversions into equivalent copies remain the operator's responsibility; that finding still stands.

## Errors Found in the Current Process (H2 Revisited)

File 03 reframed H2: errors were thought to happen at entry, not when adding up. The report shows that **adding up also produces errors**. Several sum formulas in the detail sheet leave out a row:

- **Empresariales:** one column sum skips its last entry, so **70 copies** are not counted.
- **Ingenierías:** two column sums each skip one entry, so **47 copies** (28 + 19) are not counted.
- **Anillados tables:** the amount total skips the first row (7 mm) in VRA, DAAE Admisiones, Ingenierías, Marketing and Empresariales. In DAAE Admisiones this has an effect: the detail table shows Bs 14, while the summary shows Bs 18 (the correct value, typed by hand).
- **Typed totals:** some cells in the summary (e.g. the totals for Internacionalización and Voluntariado) are typed numbers rather than formulas, so they do not update if an entry changes.

In September 2026, about **117 copies (≈ Bs 35)** appear to be under-billed. The amount is small, but it is lost income for the operator and confirms that the manual process is error-prone. The operator confirmed these are mistakes.

**Updated H2:** Errors happen both at entry (wrong department, illegible handwriting) and when adding up (sums that skip entries, totals typed by hand), leading to wrong totals per department.

## Implications for the Product

- **Required output:** the app must produce the summary in Sheet 1: per department, copies, copies amount, anillados, anillados amount and total, plus grand totals, for one billing period.
- **Anillados by size:** each registration must capture the anillado size, not only a count.
- **Prices:** the app needs the copy price and the price of each anillado size. Whether these change over time, and who updates them, is still unknown.
- **The detail sheet disappears:** totals are computed from the registered entries, removing the manual sums and their errors.
- **Departments:** the list must be editable, since departments can be added or removed (file 03).

## Privacy

The file contains no personal names. It does show the operator's real billing amounts to the University. Before the repository becomes public, ask the operator for permission, or replace the file with a sample using changed numbers.

## Questions for the Operator

1. What are the prices for 17 mm and 50 mm anillados?
2. Can a single request include both copies and anillados? Several anillados of different sizes?
