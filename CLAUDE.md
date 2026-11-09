# CLAUDE.md

## What this project is

Fotocopias UPB: staff register photocopy/anillado requests on a shared phone; the operator gets the
monthly billing reports (detailed + per-department summary) without manual sums.
Product truth lives in `docs/`. Read `docs/06-product-brief.md`, `docs/07-epics.md`,
`docs/decision-log.md`, `docs/definition-of-done.md` and the current `docs/sprints/sprint-N.md`
before starting work. Stories and acceptance criteria are GitHub Issues: read the story with
`gh issue view <n>` before starting it.

## Roles (important)

- The user is learning industry software development; they are the only developer.
- This window is the **Developer assistant**. Separate sessions play the PO and the SM.
- Do not decide scope, priorities or acceptance criteria. If a technical choice changes product
  behaviour, or a doc is ambiguous, stop, say "this is a PO question" and propose the question.
- Never edit `docs/` product files (brief, epics, decision log, DoD, sprints) unless asked. Technical
  decisions go in `docs/tech-decisions.md` (see below).

## Teaching mode

The user has a CS PhD but has never built or deployed a web app.

- Before each non-trivial change, explain WHAT you will do and WHY, including the main alternative
  rejected. Assume strong CS fundamentals; explain web-specific concepts (bundler, env vars, CORS,
  RLS, build vs. dev server, DNS/hosting) the first time they appear.
- Prefer small steps the user can run and see. After each step, say how to verify it.
- When the user must act outside the repo (Vercel/Supabase dashboards, env vars), give numbered
  click-by-click instructions. Never ask for passwords or secret keys in chat.
- Record every lasting technical decision as one row in `docs/tech-decisions.md`
  (Date | Decision | Reason | Alternatives), same format as `docs/decision-log.md`.

## Stack

- React + TypeScript, built with Vite (single-page app, no server code of our own).
- Supabase (Postgres) for storage, accessed from the browser with `@supabase/supabase-js`
  using the public anon key; access is restricted by Row Level Security (RLS) policies.
- Hosted on Vercel; every push to `main` deploys to production, branches get preview URLs.
- Tests: Vitest for logic (billing period, totals, prices).

## Commands

- `npm install`: install dependencies
- `npm run dev`: local dev server (http://localhost:5173)
- `npm run build`: production build (must pass before pushing)
- `npm run test`: unit tests
- `npm run lint`: oxlint (config in `.oxlintrc.json`)
- `npm run restore-sql -- <backup .json>`: SQL that restores a backup (`docs/maintenance.md`)

## Layout (to be created in Sprint 1)

- `src/`: app code; `src/lib/supabase.ts` is the only place that creates the Supabase client.
- `src/domain/`: pure logic (periods, totals, prices), unit-tested, no React/Supabase imports.
- `supabase/migrations/`: every schema change as a numbered SQL file, committed. Never change the
  schema only through the dashboard.

## Conventions

- Code, identifiers, commits and comments in English; **all user-facing text in Spanish**.
- Domain words kept as in the business: `copias`, `anillados`, `area` (department).
- Money: store and compute in centavos (integers); format as Bs only for display.
- Dates shown to users are always day/month/year (`17/10/2026`), formatted by our code; dates are
  stored and passed around as ISO `YYYY-MM-DD`.
- Billing period runs from the 23rd to the 22nd (Bolivia time, America/La_Paz). Timestamps are stored
  in UTC (`timestamptz`) and converted for display and period calculations.
- Departments and anillado sizes/prices are reference tables seeded by migrations (developer-maintained
  in the MVP, per the decision log).
- Secrets: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`), in
  `.env.local` (git-ignored) and in Vercel env vars. The Supabase secret / `service_role` key never goes
  in the repo or in frontend code.
- Two Supabase projects: `fotocopias-upb-dev` (test data) for local development and Vercel previews, and
  the production project for the live app only. `.env.local` and Vercel's Preview/Development variables
  point at the test project; only Vercel's Production variables point at production.
- Writes go through Postgres functions called with `supabase.rpc(...)` (e.g. `register_account_entry`), not
  direct inserts: one transaction per entry, and the browser gets no direct access to `entries`.
- New tables: `revoke all` from `anon, authenticated`, then grant only what the app uses (see 0010).
- Migrations are applied by pasting them into the Supabase SQL Editor, in order, once each per project:
  first in the test project (then check the branch preview), and in production only after the PR is
  merged, unless the migration says it is safe earlier.

## Constraints that drive the design

- Target device for staff: a shared phone's browser (the operator's old phone, from January 2027;
  decision log 2026-11-08, the tablet was dropped), touch, used standing while copies print: big
  touch targets, numeric keyboard for numbers, as few taps as possible, a phone-width screen. The
  operator's screens are used on her computer.
- Connection may drop: no offline sync in the MVP (decision log), but the UI must show clearly whether
  each entry was saved or failed, so staff can fall back to paper.
- Volume is tiny (≤500 entries/month): favour simplicity over performance.

## Workflow

- One branch per story (e.g. `story/1-service-registration`), small commits, PR into `main`.
- A story is done only per `docs/definition-of-done.md`: deployed, tested on a phone from
  the deployed URL, in Spanish, pushed, issue moved to Done.
- Board (GitHub Projects): the user moves cards to In Progress and Ready for review; only the PO moves
  them to Done. Claude has no Projects access and **never closes issues** (closing triggers the board's
  "Item closed" workflow, which moves the card to Done and skips the PO check). When a task is finished,
  Claude adds a short comment to the issue (what was done, how it was verified) and asks the user to move
  it to Ready for review.
- Commit only when the user asks.
