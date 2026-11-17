---
name: create-bible-study-deck
description: Build a complete weekly "Ordinary Glory" Bible study guide for this repo from a week folder's sermon.md and references.md. Generates the English data/<week_id>/<week_id>.json, adds the week to data/manifest.json with the YouTube URL, then creates the Spanish (.es.json) and Burmese (.my.json) translations. Use whenever the user wants to create, generate, or add a new week/deck/study guide, mentions a week folder like 11_17_26, or supplies sermon notes plus a YouTube link, even if they don't say "deck".
---

# Create Bible Study Deck

Turns one week's source material into the finished, translated study guide for the static site in this repo (see `AGENTS.md` for the overall site structure and JSON shape).

## Inputs

The user supplies two things (as slash-command args or in plain text):

1. **week_id** — the folder name under `data/`, format `<month>_<day>_<2-digit year>` (e.g. `11_17_26`). The folder must already contain `sermon.md` and `references.md`.
2. **YouTube URL** — the sermon video, stored as `videoUrl` in `data/manifest.json`.

Example: `/create-bible-study-deck 11_17_26 https://www.youtube.com/watch?v=XXXXXXXXXXX`

If the week_id is missing, ask for it. If `data/<week_id>/sermon.md` or `references.md` does not exist, stop and tell the user (a few older weeks have no references file; in that case continue only if the user confirms). If the YouTube URL is missing, ask once; if the user says there is none, omit `videoUrl`.

## Workflow

Do the steps in order. Use the todo list to track them.

### 1. Read the sources
Read `data/<week_id>/sermon.md` and `data/<week_id>/references.md`. Also read the most recent complete week (highest date in `data/manifest.json` that has `.json`, `.es.json` and `.my.json`) as the schema and style model, for example `data/11_10_26/11_10_26.json`. Copy its exact shape; do not add new fields (no leader tips).

### 2. Write the English JSON
Read `references/content-rules.md` and follow it. Save to `data/<week_id>/<week_id>.json`. Validate with `python -m json.tool data/<week_id>/<week_id>.json > /dev/null`.

### 3. Update the manifest
Append `{ "id": "<week_id>", "videoUrl": "<url>" }` to the `weeks` array in `data/manifest.json` (omit `videoUrl` if none). Skip if an entry with that id already exists, but update its `videoUrl` if the user gave a different one. Validate the JSON afterwards.

### 4. Translate to Spanish, then Burmese
**Model requirement for translation:** Always use the **Gemini model on Medium** (do **not** use Claude models for translating). If the current session is running on a Claude model (or anything other than Gemini Medium), stop before starting Step 4 and ask the user to switch the model to Gemini (Medium) before translating `.es.json` and `.my.json`.

Read `references/translation-rules.md` and follow it. Translate in this order, one file at a time, each validated with `python -m json.tool` before starting the next:

1. Spanish -> `data/<week_id>/<week_id>.es.json`
2. Burmese -> `data/<week_id>/<week_id>.my.json`

Always translate from the finished English file, never from the other translation.

### 5. Verify and report
- Check all three files have identical key structure to the English file (same keys, same `passages`/`scholars` ids, same `n`/`section` values, same number of questions and points). A quick script comparing key paths is fine.
- Optionally serve the repo (`python -m http.server 8000`) and confirm `study.html?week=<week_id>` loads in each language.
- Tell the user which files were created/changed and mention anything uncertain (e.g. a Bible verse wording or a proper noun transliteration worth a human check, especially in Burmese).
- Do not commit unless asked.
