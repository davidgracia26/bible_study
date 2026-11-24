---
name: create-bible-study-deck
description: Build a complete weekly "Ordinary Glory" Bible study guide for this repo from a week folder's sermon.md and references.md. Generates the English data/<week_id>/<week_id>.json, adds the week to data/manifest.json with the YouTube URL, then creates the Spanish (.es.json) and Burmese (.my.json) translations. Use whenever the user wants to create, generate, or add a new week/deck/study guide, mentions a week folder like 11_17_26, or supplies sermon notes plus a YouTube link, even if they don't say "deck".
---

# Create Bible Study Deck

Build one week's translated study guide for the static site. Site structure and JSON shape: `AGENTS.md`.

## Inputs

1. **week_id** — folder under `data/`, format `<month>_<day>_<2-digit year>` (e.g. `11_17_26`). Must contain `sermon.md` and `references.md`.
2. **YouTube URL** — sermon video, stored as `videoUrl` in `data/manifest.json`.

Example: `/create-bible-study-deck 11_17_26 https://www.youtube.com/watch?v=XXXXXXXXXXX`

- Missing week_id: ask.
- Missing `sermon.md` or `references.md`: stop and report. Older weeks lack `references.md`; continue only on user confirmation.
- Missing URL: ask once. If none exists, omit `videoUrl`.

## Workflow

Run steps in order. Track them in the todo list.

### 1. Read the sources
Read `data/<week_id>/sermon.md` and `references.md`. Read the newest complete week (latest in `data/manifest.json` with `.json`, `.es.json`, `.my.json`, e.g. `data/11_10_26/11_10_26.json`) as schema and style model. Copy its shape. Add no fields (no leader tips).

### 2. Write the English JSON
Follow `references/content-rules.md`. Save to `data/<week_id>/<week_id>.json`. Validate: `python -m json.tool data/<week_id>/<week_id>.json > /dev/null`.

### 3. Update the manifest
Append `{ "id": "<week_id>", "videoUrl": "<url>" }` to `weeks` in `data/manifest.json` (omit `videoUrl` if none). If the id exists, skip, but update `videoUrl` when the user gave a different one. Validate the JSON.

### 3b. Generate share page
Run `python scripts/gen_share_pages.py`. It writes `s/<week_id>.html` (OG meta plus redirect) for every manifest week. Share links point at these pages.

### 4. Translate to Spanish, then Burmese
**Model gate:** translate only on **Gemini (Medium)**. Never translate on a Claude model. On any other model, stop before this step and ask the user to switch.

Follow `references/translation-rules.md`. One file at a time, validated with `python -m json.tool` before the next:

1. Spanish -> `data/<week_id>/<week_id>.es.json`
2. Burmese -> `data/<week_id>/<week_id>.my.json`

Translate from the finished English file, never from the other translation.

### 5. Verify
- Compare key structure of all three files to the English file: same keys, `passages`/`scholars` ids, `n`/`section` values, question count, point count. Script it.
- Optional: serve with `python -m http.server 8000`; load `study.html?week=<week_id>` in each language.
- Do not commit unless asked.
