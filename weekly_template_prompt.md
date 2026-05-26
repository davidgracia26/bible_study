&lt;!--
HOW TO USE THIS TEMPLATE EACH WEEK
1. Fill in every block below with the week's content.
2. Paste the entire file contents into your AI chat (e.g. Windsurf / ChatGPT).
3. The AI will output a complete HTML file at the path you specify in <constraints>.
4. Save that file as  MM_DD/MM_DD.html  inside this project.
--&gt;

&lt;role&gt;you are a pastor&lt;/role&gt;

&lt;task&gt;
Create a complete, single-file HTML bible study guide using the content provided in the blocks below.

The output must contain every section listed here, in this order:

1. HEADER
   - Small all-caps label: "Bible Study — [DATE]"
   - Large h1: [TITLE] with the subtitle portion wrapped in a &lt;span&gt;
   - Italic sub-headline: [SUBTITLE]
   - Gold decorative rule below the sub-headline

2. KEY PASSAGES SECTION
   - Section label: "Key Passages"
   - One card per passage listed in &lt;passages&gt;
   - Each card shows: scripture reference (all-caps, gold), full verse text (from the translation specified, default ESV), translation label below the text
   - Use small-caps styling on LORD where appropriate (ESV convention)
   - Cards sit in a responsive 2-column grid

3. DISCUSSION QUESTIONS SECTION
   - Section label: "Discussion Questions"
   - Exactly 15 questions, divided across the movements (parts) implied by the passages and themes
   - Each movement has a navy gradient header showing "Part N" + movement title (key passage reference in italic)
   - Each question card shows: numbered circle (navy/gold), question text, anchor tags referencing the relevant passage(s) and thinker(s)
   - Questions should draw meaningfully on the thinkers listed in &lt;people&gt; — weave their frameworks, vocabulary, and ideas into the questions even when not quoting verbatim
   - Where an exact quote is provided in &lt;people&gt;, attribute it by name in the question or anchor tag

4. VOICES FOR THE DISCUSSION SECTION
   - Section label: "Voices for the Discussion"
   - One dark-navy quote card per thinker listed in &lt;people&gt;
   - Each card: pull quote (italic), thinker name (gold, bold), short descriptor/affiliation line
   - If an exact quote is given in &lt;people&gt;, use it verbatim; otherwise select a well-known, relevant quote from that thinker

5. CLOSING PRAYER SECTION
   - Section label: "Closing Prayer"
   - Single card with left gold border
   - Prayer body in italic, structured in short paragraphs
   - Themes: draw from the passages, thinkers, and notes provided — especially the local/contextual note in &lt;notes&gt;
   - Ends with a bold "Amen."

6. FOOTER
   - Format: [DATE] · [TITLE] · All scripture quotations from the [TRANSLATION]

DESIGN — copy these CSS variables and class names exactly so every week's page looks identical:
  :root variables: --navy #0f2340 | --navy2 #1a3558 | --gold #c9a84c | --gold2 #e8c878 | --cream #faf7f2 | --white #ffffff | --text #1e2a3a | --muted #5a6a7e | --border #dde3ec | --radius 12px
  Key classes (preserve names and styles):
    header, .header-label, .header-sub, .gold-rule
    .container (max-width 860px)
    .section-title (gold, all-caps, flex with trailing line)
    .passages-grid, .passage-card, .passage-ref, .passage-text, .passage-translation
    .movement, .movement-header, .movement-number, .movement-title
    .questions, .question-card, .q-number, .q-body, .q-text, .q-anchor
    .quotes-grid, .quote-card, .quote-text, .quote-author, .quote-desc
    .prayer-card, .prayer-icon, .prayer-body, .prayer-amen
    footer
  Font stack: Georgia/Times New Roman for body; Arial/sans-serif for labels
  Responsive: single-column grid below 560 px
&lt;/task&gt;

&lt;context&gt;
I am a layman leading a weekly bible study. I provide passages, thinkers, and brief sermon notes each week.
The group meets in [CITY — e.g. Houston]. If a local/contextual detail is relevant, weave it into question 14 and the closing prayer.
&lt;/context&gt;

&lt;!-- ─────────────────────────────────────────────────────────────────
     FILL IN THE BLOCKS BELOW FOR EACH NEW WEEK
     ───────────────────────────────────────────────────────────────── --&gt;

&lt;date&gt;[Month Day, Year — e.g. June 2, 2026]&lt;/date&gt;

&lt;title&gt;[Main Title — e.g. "Scattered &amp; Gathered"]&lt;/title&gt;
&lt;title-span&gt;[Subtitle inside h1 span — e.g. "Unity, Diversity &amp; the Church"]&lt;/title-span&gt;
&lt;subtitle&gt;[Italic sub-headline under the h1 — one sentence framing the study]&lt;/subtitle&gt;

&lt;translation&gt;ESV&lt;/translation&gt;  &lt;!-- change to NIV, NASB, etc. if needed --&gt;

&lt;passages&gt;
[Reference 1 — e.g. Genesis 11:4]
[Reference 2]
[Reference 3]
[Add or remove lines as needed]
&lt;/passages&gt;

&lt;people&gt;
[Thinker 1 name — e.g. Stanley Hauerwas]
[Thinker 2 name — e.g. N.T. Wright]
[Thinker 3 name — e.g. Walter Brueggemann]
[Thinker 4 name + exact quote if known — e.g. Richard Beck - "The Church is called to be a social miracle"]
[Add or remove as needed]
&lt;/people&gt;

&lt;notes&gt;
[Free-form observations from the sermon or your own study — e.g. "Diversity in Houston", "pastor emphasized the cost of unity", etc.]
[These are lower priority than passages and people but add thematic color to questions and the prayer.]
&lt;/notes&gt;

&lt;constraints&gt;
- Output a single, self-contained HTML file (all CSS inline in a &lt;style&gt; block, no external dependencies).
- Save as  [MM_DD]/[MM_DD].html  relative to the project root — e.g. 6_02/6_02.html
- Do not alter the CSS design, color palette, or class names listed in &lt;task&gt;.
- Do not omit any of the 6 output sections listed in &lt;task&gt;.
- Produce exactly 15 discussion questions.
- All scripture text must be quoted in full from the translation specified in &lt;translation&gt;.
&lt;/constraints&gt;
