# Bible Study Guides — Agent Notes

Strict negative constraints:
- Use Plain Direct English (active voice, imperative mood, anglo-saxon words)
- Every word should be load bearing
- Treat every query as a direct programming execution. 
- ABSOLUTELY ZERO conversational filler, robotic pleasantries, pleasantries, or introductory preambles.
- DO NOT restate, paraphrase, or acknowledge the prompt. 
- DO NOT write a concluding summary, a "Let me know if you need help", or a closing paragraph.

Structural enforcement:
- Output the direct answer or solution starting on character 1, line 1 of the response.
- If the response requires multiple points, use a markdown list with bold headers (e.g., "**Key Factor:** Detail").
- If the answer is code, output ONLY the code block. No explanation before or after.

Config location: this repo uses `.claude/` only. This overrides any default of `.devin/`. Never create config in `.devin/`.
- Skills: `.claude/skills/<name>/SKILL.md`
- Hooks, permissions, env: `.claude/settings.json` (personal: `.claude/settings.local.json`)
- Commands: `.claude/commands/<name>.md`
- Subagents: `.claude/agents/<name>.md`
- MCP servers: `.mcp.json`
- Rules: `AGENTS.md`
Leave `.devin/config.json` as is.

Scope: these rules govern agent replies and agent-written docs (this file, skills). Site content (week JSON, translations) follows the content rules below, not this style.

## What this is
Static, no-build site ("Ordinary Glory" series). Renders weekly Bible study discussion guides. Plain HTML/CSS/JS, no package manager, bundler, or tests.

## Structure
- `index.html` — landing page. Fetches `data/manifest.json`, lists weeks as cards (newest first), links to `study.html?week=<id>`.
- `study.html` — viewer shell. Left panel: passages/voices. Right panel: current question. `js/app.js` injects all content from `data/<week_id>/<week_id>.json`.
- `js/app.js` — all client logic:
  - Loads week JSON. Builds view sequence: Summary (if `summary` exists) → Passages → Q1..Qn → Voices (if any) → Prayer → All Questions. No `?q=` opens Summary (else Q1).
  - Theme (light/dark, `localStorage`), font scaling, keys (arrows navigate, `d` toggles theme), print-only overview.
- `js/i18n.js` — shared `I18N` helper for both pages. Loads `data/languages.json` and `data/strings.json`. Language order: `?lang=`, then `localStorage['bs-lang']`, then `en`. API: `I18N.t(key)` (UI copy), `I18N.localize(url)` (per-language data URL), `I18N.buildSwitcher(el)` (`<select>` switcher), `I18N.loadWeekJSON(weekId)` (the only localized-file-with-English-fallback loader; used by `index.html` and `js/app.js`).
- `css/styles.css` — all styling. The HTML pages link this file.
  - Breakpoints: `<=900px` stacks the layout (question first, passage below), moves Watch/font/language/share/theme into the Settings menu, and uses 44px tap targets (also on `pointer: coarse`). `>=1600px` raises the root font size (`--base-font`) for TV; keep sizes in `rem` so they scale. `--font-mult` carries the user's A+/A- step.
- `global_styles.css` (root) — old, unused. Leave alone unless asked.
- `data/languages.json` — `{ languages: [{ code, label }] }`. Switcher renders only with 2+ languages.
- `data/strings.json` — UI copy by language code (`{ "en": { "prev": "Prev" }, "es": {} }`). Missing keys fall back to `en`.
- `data/manifest.json` — `{ "weeks": [{ id, videoUrl }] }`. One entry per week. Holds only the language-independent video link. Never duplicate `date`/`series`/`title`/`subtitle` here; they live in each week's JSON (`meta.date`, `meta.series`, `meta.title`, `meta.titleHighlight`).
- `data/<week_id>/` — one folder per week: rendered JSON plus source material. `week_id` = `<month>_<day>_<2-digit year>` (`9_1_26` = September 1, 2026). It matches the manifest `id` and `study.html?week=9_8_26`. The year suffix prevents cross-year collisions (`meta.date` stores no year).
  - `<week_id>.json` — English content: `meta`, `sections`, `questions`, `passages`, `scholars` ("Voices for the Discussion"), `prayer`, optional `summary` (`{ speaker, bigIdea, overview, points: [{ title, text, ref }], takeaway }`, 150–250 words; weeks without it skip that view). `meta.date` and `meta.series` drive the landing card and fold into `meta.eyebrow`/`meta.footer`. Summary rules: skill `references/content-rules.md`.
  - `<week_id>.<lang>.json` — optional translation, same shape (e.g. `9_8_26.es.json`). Missing file: both pages fall back to English; `study.html` shows a "not yet translated" notice.
  - Other files (`sermon.md`, `references.md`, `prompt.md`) are source material. The site ignores them.
- `.claude/skills/create-bible-study-deck/` — builds a week end to end (English JSON, manifest entry, Spanish and Burmese translations) from `sermon.md` and `references.md`. Run `/create-bible-study-deck <week_id> <youtube_url>`. `references/content-rules.md` owns question style; `references/translation-rules.md` owns translations. `prompt.md` files are historical.

## Adding a new week
Preferred: `/create-bible-study-deck <week_id> <youtube_url>`. Manual:
1. Add `sermon.md` and `references.md` under `data/<week_id>/`.
2. Create `data/<week_id>/<week_id>.json`, copying the shape of an existing week (`data/9_8_26/9_8_26.json`).
3. Append `{ id, videoUrl }` to `weeks` in `data/manifest.json` (omit `videoUrl` if none).
4. No build step.

### Question style
Full rules: skill `references/content-rules.md`. Summary for `questions[].text`:
- One short question. Exactly one question mark. Max ~25 words (50 with a one-sentence lead-in). No stacked or "and why...?" questions.
- No sermon recap, verse, or quote in `text`. Verses go in `passages`; quotes go in `scholars`.
- Not invasive. No confessions of sin or failure. No addictions, health, family crises, finances, or politics. Prefer observations, past lessons, other people, hypotheticals.
- Simple English (ESL-friendly), no idioms. Apply the same rules in translations.

## Adding a language
1. Add `{ code, label }` to `data/languages.json` (e.g. `{ "code": "my", "label": "မြန်မာ" }`).
2. Add a translated block to `data/strings.json` under the same code. Copy `en` first.
3. Optional per week: create `data/<week_id>/<week_id>.<code>.json` in the same shape, including `meta.date`/`series`/`title`/`titleHighlight` (they drive the landing card). Untranslated weeks show English plus a notice, so translation can be incremental.

## Verifying changes
`fetch()` needs http(s), not `file://`. Serve the repo root:

```
python -m http.server 8000
```

Open `http://localhost:8000/index.html` and `http://localhost:8000/study.html?week=<id>`. Check the console for errors. Validate edited JSON: `python -m json.tool data/<week_id>/<week_id>.json`.

## Cache-busting
`index.html` and `study.html` load `css/styles.css`, `js/i18n.js` and `js/app.js` with `?v=N` (e.g. `js/app.js?v=2`). Browsers cache these hard. When a change to any of them matters to returning visitors, bump `?v=N` in every HTML file that references it. Bump the CSS version whenever HTML and CSS change together, or returning visitors get new markup with old styles.

Data files (`manifest.json`, week JSONs, `strings.json`, `languages.json`) carry no version. Every `fetch()` of them uses `{ cache: 'no-cache' }` so new weeks show at once (GitHub Pages otherwise sends `max-age=600`). Keep that option on every new data fetch.
