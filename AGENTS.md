# Bible Study Guides — Agent Notes

## What this is
A static, no-build website ("Ordinary Glory" series) that renders weekly
Bible study discussion guides. There is no package manager, bundler, or
test suite — it's plain HTML/CSS/JS served as static files.

## Structure
- `index.html` — landing page. Fetches `data/manifest.json` and lists all
  weeks as cards (sorted by date, newest first), linking to
  `study.html?week=<id>`.
- `study.html` — the study viewer shell (two-column workspace: left panel
  for passages/voices, right panel for the current question). All content
  is injected by `js/app.js` based on `data/<week_id>.json`.
- `js/app.js` — all client-side logic: loads week JSON, builds the view
  sequence (Passages → Q1..Qn → Voices (if any) → Prayer → All Questions),
  handles theming (light/dark, persisted in `localStorage`), font scaling,
  keyboard shortcuts (arrow keys to navigate, `d` to toggle theme), and the
  print-only overview section.
- `css/styles.css` — all styling (this is the stylesheet actually linked
  from the HTML pages).
- `global_styles.css` (repo root) — appears to be an older/unused
  stylesheet; not referenced by any HTML file. Leave it alone unless asked.
- `data/manifest.json` — array of `{ id, date, series, title, subtitle }`
  entries, one per week, used by the landing page.
- `data/<week_id>.json` — full content for one week's study: `meta`,
  `sections`, `questions`, `passages`, `scholars` ("Voices for the
  Discussion"), `prayer`. `week_id` matches the manifest `id` (e.g. `9_1`,
  `9_8`) and the query param `study.html?week=9_8`.
- `prompt_flow/<week_id>/` — source material per week (sermon notes,
  references, prompts) used to generate that week's `data/<week_id>.json`.
  Not loaded by the site itself; it's the human/agent workflow input.
- `standard_prompt.md` / `new_standard_prompt.md` — example prompt
  templates showing how a new week's study guide has historically been
  requested (role: pastor, task: build discussion questions from sermon
  notes, output as data JSON + manifest entry).

## Adding a new week
1. Add source material under `prompt_flow/<week_id>/` (sermon notes,
   references).
2. Create `data/<week_id>.json` following the exact shape of an existing
   week (e.g. `data/9_8.json`): `meta`, `sections`, `questions`,
   `passages`, `scholars`, `prayer`.
3. Append a `{ id, date, series, title, subtitle }` entry to
   `data/manifest.json`.
4. No build step is required — just open/serve `index.html`.

## Verifying changes
There is no test runner or build. To sanity-check changes, serve the repo
root with a static file server (fetch() requires http(s), not file://) and
open the pages in a browser, e.g.:

```
python -m http.server 8000
```

then visit `http://localhost:8000/index.html` and
`http://localhost:8000/study.html?week=<id>`. Check the browser console for
fetch/JS errors, and validate any hand-edited JSON with a JSON linter
(`python -m json.tool data/<week_id>.json`) before committing.
