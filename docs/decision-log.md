# Decision Log

One line per decision, newest first.

| Date | Decision | Reason | Alternatives considered |
| --- | --- | --- | --- |
| 2026-10-14 | The operator can edit and delete entries without keeping a history; only an immediate undo is available. | The operator is trusted, as she is today when she prepares the Excel report. Keeps the MVP simple. | Keeping a trace of changes (original value, who and when) and marking deleted entries instead of erasing them. |
| 2026-10-14 | Teacher codes (to identify teachers, and to autofill name and department) are moved after the MVP. Code entry is needed before full rollout. Codes are used for identification only and trusted as entered, like signatures today; there is no list of valid codes. | The pilot departments have no visiting teachers, so codes are not used in the pilot; the product has value without them. | Teacher codes and autofill included in the MVP. |
| 2026-10-14 | If the connection drops, staff fall back to the paper notebook; the operator enters those entries in the app later. | Keeps the MVP simple: no offline storage or syncing to build. | The app stores entries offline and syncs them when the connection returns. |
| 2026-10-14 | Roll out with a pilot in four small departments without visiting teachers (Internacionalización, Orientación, DAAE Cultura, DAAE Deportes), keeping a paper record in parallel there only. | Running paper and the app in parallel for all departments is impractical; a pilot limits risk while the app is validated. | Full parallel run in all departments; full rollout without a pilot. |
| 2026-10-14 | Staff register on a shared tablet at the service, using the operator's private internet connection. | Wi-Fi and mobile data at the service are extremely unreliable; the operator's connection works. | Staff using their own phones (discarded). |
| 2026-10-14 | Editing prices and the list of departments is planned after the MVP; until then, the developer updates them. | Prices change once a year and departments rarely; building editing screens first would delay the MVP. | Editing included in the MVP. |
| 2026-10-13 | Whether the University accepts records without signatures will be tested when the MVP is shown, not before. | Decided by the project owner; the operator prefers to ask the University once there is something to show. | Asking the University earlier, with a mockup or a simple question. |
