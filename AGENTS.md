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
- `js/i18n.js` — shared language/translation helper (`I18N`) used by both
  `index.html` and `study.html`. Loads `data/languages.json` and
  `data/strings.json`, tracks the current language (`?lang=` query param,
  else `localStorage['bs-lang']`, else `en`), exposes `I18N.t(key)` for UI
  copy, `I18N.localize(url)` for per-language data file URLs, and
  `I18N.buildSwitcher(el)` to render the `<select>` language switcher.
- `css/styles.css` — all styling (this is the stylesheet actually linked
  from the HTML pages).
- `global_styles.css` (repo root) — appears to be an older/unused
  stylesheet; not referenced by any HTML file. Leave it alone unless asked.
- `data/languages.json` — `{ languages: [{ code, label }, ...] }`, the
  list of languages shown in the switcher. The switcher only renders when
  there are 2+ languages.
- `data/strings.json` — UI copy (button labels, section names, etc.) keyed
  by language code, e.g. `{ "en": { "prev": "Prev", ... }, "es": { ... } }`.
  Any language missing a key falls back to the `en` value.
- `data/manifest.json` — array of `{ id, videoUrl }` entries, one per
  week, used by the landing page and study page to know which weeks exist
  and their (language-independent) sermon video link. It intentionally
  does **not** duplicate `date`/`series`/`title`/`subtitle` — those are
  translatable content and live only in each week's own
  `data/<week_id>[.<lang>].json` (`meta.date`, `meta.series`,
  `meta.title`, `meta.titleHighlight`), so there is exactly one place to
  update per language instead of also having to keep the manifest in
  sync.
- `data/<week_id>.json` — full content for one week's study (English/
  default): `meta`, `sections`, `questions`, `passages`, `scholars`
  ("Voices for the Discussion"), `prayer`. `week_id` matches the manifest
  `id` (e.g. `9_1`, `9_8`) and the query param `study.html?week=9_8`.
  `meta.date` and `meta.series` are the plain-text values shown on the
  landing page card (and folded into `meta.eyebrow`/`meta.footer` for the
  study page chrome).
- `data/<week_id>.<lang>.json` — optional fully-translated content for a
  week in another language (same shape as `data/<week_id>.json`), e.g.
  `data/9_8.es.json`. If it doesn't exist yet for the selected language,
  `study.html` (and the landing page cards) automatically fall back to
  the English file and `study.html` shows a small "not yet translated"
  notice. `js/i18n.js`'s `I18N.loadWeekJSON(weekId)` is the single place
  that implements this localized-file-with-fallback loading, used by both
  `index.html` and `js/app.js`.
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
   week (e.g. `data/9_8.json`): `meta` (including `date` and `series`,
   which also drive the landing page card), `sections`, `questions`,
   `passages`, `scholars`, `prayer`.
3. Append a `{ id, videoUrl }` entry to `data/manifest.json` (omit
   `videoUrl` if there's no sermon video yet).
4. No build step is required — just open/serve `index.html`.

## Adding a language
1. Add `{ code, label }` to `data/languages.json` (e.g.
   `{ "code": "my", "label": "မြန်မာ" }`). This makes the switcher appear
   (it's hidden when only one language is configured).
2. Add a matching block of translated UI copy to `data/strings.json`,
   keyed by the same code. Copy the `en` block as a starting point so no
   keys are missing (missing keys fall back to English automatically, but
   it's best to translate them all).
3. Optionally translate a week's full content: create
   `data/<week_id>.<code>.json` with the same shape as
   `data/<week_id>.json`, including `meta.date`/`meta.series`/
   `meta.title`/`meta.titleHighlight` (these also drive that week's
   landing page card — there's no separate manifest translation to keep
   in sync). Weeks without a translated file just show the English
   content plus a small notice when that language is selected — so
   languages/weeks can be translated incrementally.

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

## Cache-busting for js/i18n.js and js/app.js
Both `index.html` and `study.html` load these scripts with a `?v=N` query
string (e.g. `js/app.js?v=2`). Browsers otherwise cache these files
aggressively with no cache-busting, so a returning visitor's browser can
keep running stale JS (e.g. calling a function that was added/renamed in
a later commit) until a hard refresh. When you change `js/i18n.js` or
`js/app.js` in a way that matters for already-visited users, bump the
`?v=N` on that script tag in every HTML file that references it.
