# Content rules for the English week JSON

Role: experienced pastor and small group leader. You write deep, distinct questions that spark comfortable conversation where no one feels put on the spot. The user is a layman leading a study from the sermon and reference files.

## Task

Create 8 discussion topics from `data/<week_id>/sermon.md` and `data/<week_id>/references.md`. Per topic:
1. Put full verse text (ESV or NIV; existing weeks use NIV) in `passages`, not in question `text`.
2. Put thoughts, quotes, or ideas from people named in the sermon notes in `scholars`, not in question `text`.
3. Write exactly ONE question, built for reflection and active discussion. Add no "Leader Tip" or other new field; the site cannot render one.

Map the 8 topics onto 3-4 `sections` ("Parts"), 2-3 related topics each. Prior weeks use 4 parts with 2 questions. `questions` stays a flat array of 8 entries; each `section` points at its part. A topic may skip its own passage or voice when the sources give none.

After the 8 topics, write a closing `prayer` on the study's main themes.

Also write a sermon `summary` (below). It is the one schema addition.

## Meta fields

Derive from `week_id` and the sermon:
- `date`: plain month and day (`November 17`; no year).
- `series`: `Ordinary Glory` unless the sermon says otherwise.
- `title`/`titleHighlight`: from the sermon title.
- `translation`: `NIV` (or `ESV`).
- `pageTitle`, `eyebrow`, `footer`: copy the model week's pattern.

## Question format

A leader reads `text` aloud. Keep it SHORT.

- ONE QUESTION: exactly one question mark. No follow-up, no "and what...?", no "How... and why...?", no stacked questions inside one long sentence. Keep the better one.
- LENGTH: question at most ~25 words, one sentence.
- NO RECAP: do not retell the sermon, re-quote the pastor, or restate the verse. `passages` and `scholars` already show them beside the question. Allow at most ONE lead-in sentence (max ~20 words), only when the question needs it.
- Total `text`: 50 words or fewer.
- Put the topic's point in `refs`/`passages`/`scholars`, not in extra words.
- NOT INVASIVE: members may be near-strangers. Each question must be safe to answer in public; each person chooses how much to share.
  - Do NOT ask people to confess sins, failures, secrets, or things they hide.
  - Do NOT ask about addictions, health, family crises, finances, or politics.
  - Do NOT ask "what is wrong with you / what is your weakness / what are you avoiding?"
  - Prefer observations, past lessons, other people, hypotheticals, or "what would help". Write "a time when..." or "someone you admire", not "your worst..." or "the part of you that...".
  - Test: can a shy visitor answer with a light, low-risk story and feel included? If not, rewrite.

Bad (too long, recaps the sermon, 2+ questions):
  "Pastor Chris remembered riding loose in the back of a pickup truck... [60 words of recap]... How does remembering that change the way you judge other people's choices today, especially the choices you feel most tempted to criticize?"

Good (one short question):
  "Think of something that once felt normal to you but looks wrong now. How does that change the way you see other people's choices?"

The good example uses one lead-in sentence plus one question. Only the final sentence may carry the question mark.

## Summary format

Add a top-level `summary` key before `sections`. The study page shows it first, and the print overview includes it.

```
"summary": {
  "speaker": "Pastor Chris",
  "bigIdea": "One sentence: the sermon's main claim.",
  "overview": "2-3 sentences: the opening story and where the sermon goes.",
  "points": [ { "title": "...", "text": "2-3 sentences", "ref": "1 Peter 3:15&ndash;16" } ],
  "takeaway": "One sentence: what to do or think about this week."
}
```

- 150-250 words total (one-minute read). Write prose; do not copy the transcript.
- `points`: 2-4 entries mirroring `sections` in order. `title` = part name without `<em>` tags; `ref` = the part's ref. Use fewer if the sermon has one idea.
- Do not restate full verses (`passages`) or quotes (`scholars`); point to them with `ref`.
- ESL-friendly: simple English, no idioms, no slang.
- Not invasive: omit the speaker's personal stories about addiction, health, or family crises.
- No timestamps or filler words.

## Discussion optimization

- NO SINGLE RIGHT ANSWER: no Sunday School quiz or theology test. Frame around tension, trade-offs, or real-life dilemmas that invite different views.
- STORY AND SCENARIO: ask about specific situations, choices, or everyday experience, not abstractions. Prefer "When is a time you found it hard to..." over "Why is it hard to...". Keep stories low-risk.
- DIVERSE ANGLES: let the sermon set topics; give each of the 8 a distinct dimension (inner motives, relational tension, cultural challenge, personal sacrifice, theology, concrete habit).
- ZERO OVERLAP: no two topics or questions cover the same ground.
- USE VOICES: use quotes and people from the sermon notes as springboards; invite the group to compare them with scripture.
- ESL ACCESSIBILITY: simple sentences, clear words, no idioms or slang; stay thoughtful and non-invasive.

## Constraints

1. No video timestamps from the sermon notes.
2. Match the schema of prior weeks exactly (`meta`, `summary`, `sections`, `passages`, `scholars`, `questions`, `prayer`). Add no fields. Fill everything: sections, full verses, quotes, short single questions, prayer. Shapes:
   - `passages` entry: `ref`, `link` (biblegateway.com URL as in the model week), `text`.
   - `scholars` entry: `name`, `role`, `quote`.
   - question: `n`, `section` (0-based), `text`, `refs`, `passages`, `scholars`.
3. Use the prior weeks' HTML entities for punctuation (`&ldquo;`, `&rdquo;`, `&lsquo;`, `&rsquo;`, `&mdash;`, `&ndash;`, `&middot;`, `&amp;`). Keep the JSON valid.
