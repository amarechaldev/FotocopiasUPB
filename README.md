# Fotocopias UPB

A service registration app for the printing and photocopying service at Universidad Privada Boliviana (UPB), and a product management case study: from the first interview to a product in real use, in four one-week sprints.

> Published with the consent of the service operator and the University. Personal names have been removed, and all figures in the documents are fictitious; the processes, decisions and results are real.

## The problem

The University's printing service is run by a single operator, an external contractor. Staff wrote each request in a paper notebook, and every month the operator added everything up by hand to bill the University: copies and bindings per department, in bolivianos, signed by each department's manager.

The work itself took about an hour, but with constant interruptions at the counter it stretched to one or two days every month. Errors crept in at both ends: illegible handwriting and wrong departments at entry, and hand-built spreadsheet sums that silently skipped rows, so some copies were never billed.

## The result

- Staff register each request on a shared phone at the counter, with a personal account and PIN, while their copies are printing.
- The operator reviews and corrects entries, and prints both monthly reports, the detailed record and the summary signed by managers, in a few clicks, with no manual sums.
- **The MVP was finished in three weeks** and launched in a pilot with three departments.
- **The University and all stakeholders accepted the app** before the first real billing period closed.
- Full rollout to every department is planned for January 2027.

## How it was built

One person played the three Scrum roles, each with an AI assistant:

| Role | Responsibility | Assistant |
| --- | --- | --- |
| Product Owner (me) | Discovery, product brief, backlog, acceptance | Claude, as a product management coach |
| Scrum Master (me) | Planning, capacity, retrospectives, process | Claude, as a Scrum Master |
| Developer (me) | Building, testing, deploying | Claude Code, which wrote the code under my direction |

The product work is in [docs](docs), and the backlog in this repository's [Issues](../../issues) and Project board: 84 issues, organized in epics and milestones, with acceptance criteria and a Definition of Done.

| When | What |
| --- | --- |
| October 13–14 | Discovery: hypotheses, interview with the operator, analysis of a real monthly report, product brief, epics, first stories |
| Sprint 1 (Oct 15–21) | Technical setup and the first registration form, deployed |
| Sprint 2 (Oct 22–28) | Personal accounts with PIN, operator login, entry list and corrections. Pilot launched |
| Sprint 3 (Oct 29–Nov 4) | Billing periods and both reports. MVP complete |
| November 6 | University and stakeholder acceptance |
| Sprint 4 (Nov 5–11) | Account management by the operator; keeping the app alive through the holidays |

## Key decisions

The full reasoning is in the [decision log](docs/decision-log.md). A few that shaped the product:

- **A real report beat the interview.** The operator's actual Excel report showed that she billed money amounts and priced bindings by size, both contrary to what the first interview suggested, and revealed summing errors nobody had mentioned ([report analysis](docs/05-report-analysis.md)).
- **Paper as the fallback, not offline sync.** Internet at the counter is unreliable. Instead of building offline storage, staff fall back to the notebook and the operator types those entries in later: a fraction of the work, for a rare case.
- **A non-negotiable requirement, met without losing the user.** Midway, the University required every entry to come from a personal account protected by a PIN, replacing handwritten signatures. Staff use the service only occasionally, so the design kept registration fast: names chosen from a list, a self-chosen PIN, logout after each entry.
- **The pilot first, with the riskiest work first.** Three departments without visiting teachers started early, while the reports were still being built, so real use and real feedback came weeks sooner.
- **Archive, never delete, what history depends on.** Departments, staff accounts and binding sizes are archived; price changes apply from a chosen period, so already-signed reports never change.
- **Saying no is a decision too.** A self-service password reset was planned, then dropped at the operator's request, with a documented manual procedure instead ([maintenance](docs/maintenance.md)).

## What I learned

- **Watching users finds what interviews miss.** Following the first pilot users while they created accounts revealed two usability problems within minutes.
- **Test the riskiest assumption early.** The University's PIN requirement arrived after the MVP was planned and reshaped it; asking the University earlier would have cost a conversation instead of a sprint.
- **Estimates need calibration.** The assistant's estimates were three to five times too high for my real pace; from Sprint 2, each plan compared planned and actual hours, and the estimation rule was adjusted at every retrospective.
- **Process rules need enforcement, not just writing down.** "Only the PO moves an issue to Done" was in the Definition of Done, but issues were still closed automatically when pull requests were merged, until the workflow itself was changed.
- **Being alone in all three roles has limits.** I could practice discovery, backlog management and acceptance with a real client, but not negotiating with a team, facilitating disagreement, or balancing many competing stakeholders.

## Product documents

The [docs](docs) folder records the product work, in the order it was done:

| Document | Contents |
| --- | --- |
| [01-initial-hypotheses.md](docs/01-initial-hypotheses.md) | What was believed before talking to the operator |
| [02-first-interview.md](docs/02-first-interview.md) | Notes from the first interview with the operator |
| [03-interview-synthesis.md](docs/03-interview-synthesis.md) | Key findings, hypotheses status and risks after the interview |
| [04-ReportExample.xlsx](docs/04-ReportExample.xlsx) | A monthly report as prepared by hand: the real structure and formulas, with fictitious figures |
| [05-report-analysis.md](docs/05-report-analysis.md) | Analysis of that report: structure, prices and errors found |
| [06-product-brief.md](docs/06-product-brief.md) | Vision, goals, MVP scope, timeline, constraints, success metrics and risks |
| [07-epics.md](docs/07-epics.md) | The epics (E1–E5 for the MVP, E6 after) |
| [decision-log.md](docs/decision-log.md) | Key product decisions, with their reasons and the alternatives considered |
| [definition-of-done.md](docs/definition-of-done.md) | When a story counts as finished |
| [description-lists.md](docs/description-lists.md) | Common and too-vague descriptions, provided by the operator |
| [tech-decisions.md](docs/tech-decisions.md) | Technical decisions by the development team |
| [maintenance.md](docs/maintenance.md) | How-tos for the developer after the handover |
| [sprints](docs/sprints) | One file per sprint: plan, daily log, review and retrospective |

Start with the [product brief](docs/06-product-brief.md) for an overview, or a [sprint file](docs/sprints/sprint-3.md) to see a week of work.

## Development

**Technology:** a React web app (Vite, TypeScript), deployed on Vercel, with Supabase for storage. Staff use it from the browser of a shared phone.

Requires [Node.js](https://nodejs.org/) 24 or later.

```sh
npm install       # install dependencies
npm run dev       # start the app at http://localhost:5173
npm run build     # production build, into dist/
npm run test      # unit tests
npm run lint      # lint
```
