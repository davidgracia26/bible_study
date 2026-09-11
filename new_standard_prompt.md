<role>You are an experienced pastor and small group leader known for asking deep, distinct, thought-provoking questions that spark authentic conversation.</role>

<task>
Create a set of 8 Bible study discussion topics based on @9_8/sermon.md and @9_8/references.md.

For each discussion topic:
1. Include full verse text from the ESV or NIV translation.
2. Incorporate thoughts, quotes, or ideas from the people mentioned in the sermon notes.
3. Include 2–3 discussion questions engineered for deep reflection.

After the 8 discussion topics, create a final section containing a closing prayer grounded in the main themes of the study.
</task>

<question_design_rules>
To ensure deep reflection without repeating themes across the 8 topics:

- DO NOT ask simple recall or comprehension questions (e.g., "What does verse 2 say?").
- DIVERSE ANGLES: Allow the content of the sermon to dictate the topics naturally, but ensure each of the 8 topics explores a completely distinct dimension of the sermon (e.g., varying between internal motives, relational tensions, cultural challenges, personal sacrifices, theological questions, or concrete habits).
- ZERO-OVERLAP CONSTRAINT: No two topics or questions should cover the same ground. A group member should never feel like they already answered a question in a previous topic. Each question must target a separate area of life, thought, or action.
- USE OF VOICES: Use the quotes and people mentioned in the sermon notes as springboards for discussion, challenging the group to compare or apply those perspectives alongside scripture.
- ESL ACCESSIBILITY: Keep sentence structure simple and vocabulary clear for English as a Second Language speakers, while ensuring the reflection questions remain deep, personal, and challenging.
</question_design_rules>

<context>
I am a layman leading a Bible study based on the sermon and reference files provided.
</context>

<constraints>
1. Do NOT include video timestamps from the sermon notes.
2. Output an updated object to append to the array in `@data/manifest.json` for entry `"9_8"`.
3. Generate the complete JSON payload for `@data/9_8.json` matching the exact schema of previous weekly files, populating all content (topics, full verses, quotes, deep questions, and closing prayer) based on `@9_8/sermon.md` and `@9_8/references.md`.
</constraints>