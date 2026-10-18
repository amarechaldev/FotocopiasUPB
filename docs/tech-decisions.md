# Technical Decisions

Technical choices made by the development team, one line per decision, newest first. Product decisions are in [decision-log.md](decision-log.md).

| Date | Decision | Reason | Alternatives considered |
| --- | --- | --- | --- |
| 2026-10-15 | Money is stored and computed as integer centavos, and formatted as Bs only for display. | Binary floating point cannot represent 0.30 exactly, so sums drift; the product promises zero calculation errors. | Floating-point numbers; Postgres `numeric` everywhere. |
| 2026-10-15 | Every database schema change is a numbered SQL migration in `supabase/migrations/`, committed to git. | The schema can be rebuilt, reviewed and traced, like code. | Editing tables only in the Supabase dashboard. |
| 2026-10-15 | The browser talks to Supabase directly with the public anon key, protected by Row Level Security policies. | No backend server to write, deploy or maintain. Anyone with the URL could insert entries, which is acceptable for the pilot (like an open paper notebook). | A custom API (e.g. Vercel serverless functions) in front of the database. |
| 2026-10-15 | TypeScript instead of JavaScript. | Type errors are caught at build time instead of on the tablet; better editor help. | Plain JavaScript. |
| 2026-10-15 | Vite single-page app instead of Next.js. | No server rendering or SEO needed; fewer concepts to learn for a first web app. | Next.js; Create React App (deprecated). |
