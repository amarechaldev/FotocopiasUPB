# Fotocopias UPB

A service registration app for the printing and photocopying service at Universidad Privada Boliviana (UPB).

Every month, the service operator must deliver a report of her billable services (copies and anillados per department) to the University. Today, staff write each request in a paper notebook, and the operator adds everything up by hand: a task that takes one to two days and produces errors. Fotocopias UPB lets staff register their requests on a shared phone or tablet at the service, with a personal account and PIN, and produces the monthly reports in minutes, without calculation errors.

## Status

In development: building the MVP, to be piloted in four departments before rolling out to the whole University.

## Product Documents

The [docs](docs) folder records the product work, in the order it was done:

| Document | Contents |
| --- | --- |
| [01-initial-hypotheses.md](docs/01-initial-hypotheses.md) | What was believed before talking to the operator |
| [02-first-interview.md](docs/02-first-interview.md) | Notes from the first interview with the operator |
| [03-interview-synthesis.md](docs/03-interview-synthesis.md) | Key findings, hypotheses status and risks after the interview |
| [04-ReportExample.xlsx](docs/04-ReportExample.xlsx) | A real monthly report, as currently prepared by hand |
| [05-report-analysis.md](docs/05-report-analysis.md) | Analysis of that report: structure, prices and errors found |
| [06-product-brief.md](docs/06-product-brief.md) | Vision, goals, MVP scope, constraints, success metrics and risks |
| [07-epics.md](docs/07-epics.md) | The epics (E1–E5 for the MVP, E6 after) |
| [decision-log.md](docs/decision-log.md) | Key product decisions, with their reasons |
| [definition-of-done.md](docs/definition-of-done.md) | When a story counts as finished |
| [tech-decisions.md](docs/tech-decisions.md) | Technical decisions by the development team |
| [sprints](docs/sprints) | One file per sprint: plan, daily log, review and retrospective |

Start with the [product brief](docs/06-product-brief.md) for an overview.

The product backlog (user stories with acceptance criteria) is managed in this repository's GitHub Issues and Project board.

## Development

**Technology:** a React web app, deployed on Vercel, with Supabase for storage. Staff use it from the browser of a shared phone or tablet.

Requires [Node.js](https://nodejs.org/) 24 or later.

```sh
npm install       # install dependencies
npm run dev       # start the app at http://localhost:5173
npm run build     # production build, into dist/
npm run test      # unit tests
npm run lint      # lint
```
