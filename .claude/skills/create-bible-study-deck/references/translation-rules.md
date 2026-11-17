# Translation rules (Spanish and Burmese)

Goal: translate `data/<week_id>/<week_id>.json` into `<week_id>.es.json` (Spanish) and `<week_id>.my.json` (Burmese). The site loads them when the user picks the language.

## Model requirement

Use **Gemini (Medium)** for all translations. Never use a Claude model. On a Claude session, stop and ask the user to switch.

## Core rule

Keep every object **key** in English. Translate the **values**, except names and proper nouns (see below). Read the previous week's `.es.json` / `.my.json` first. Match its conventions.

## Copy unchanged

- All keys, including ids used as keys in `passages` and `scholars` (`heb12`, `angelou`).
- `passages[].link` values. Burmese keeps the English `version=NIV` URL. Spanish changes `version=NIV` to `version=NVI`.
- Numbers and ids: `n`, `section`, id arrays in each question's `passages` / `scholars`.
- Structure: same count of sections, points, questions, passages, scholars as English.
- HTML tags and entities, in place: `<em>`, `<br><br>`, `&ldquo;`, `&rdquo;`, `&lsquo;`, `&rsquo;`, `&mdash;`, `&ndash;`, `&middot;`, `&amp;`, `&nbsp;`. In `sections[].name`, keep `<em>` around the matching translated words.

## Translate

Every other string value: `meta` (pageTitle, eyebrow, date, series, title, titleHighlight, footer), `summary`, `sections` (label, name, ref), `passages[].ref` and `.text`, `scholars[].role` and `.quote`, `questions[].text` and `.refs`, `prayer`.

- `meta.translation`: Spanish `NVI`; Burmese `NIV`.
- `meta.footer`: translate the words; keep the markup (`<strong>` around the translation abbreviation).
- Scripture references (`ref`, `refs`, summary point `ref`): use the target language's book names. Spanish: `Hebreos 12:1&ndash;2`. Burmese: Burmese book names and numerals (`ဟေဗြဲ ၁၂:၁&ndash;၂`).
- Dates: Spanish `10 de noviembre` (day first). Burmese month name plus Burmese numerals (`နိုဝင်ဘာ ၁၀`).
- Section labels: Spanish `Parte 1`; Burmese `အပိုင်း ၁`. Prayer label: Spanish `Oración Final`; Burmese `နိဂုံးချုပ် ဆုတောင်းချက်`.
- Series: Spanish `Gloria Cotidiana`; Burmese `သာမန် ဘုန်းအသရေ`. Reuse earlier weeks' wording.
- Verse text: use the standard published translation where you know it well (Spanish: NVI wording; Burmese: traditional Judson-style wording, as earlier weeks). Otherwise translate faithfully. Keep the surrounding quote entities.
- Questions and summary keep the English style rules: one short question, one question mark, simple ESL-friendly language, no idioms, not invasive.
- `scholars[].quote`: translate the meaning naturally; keep it recognizable as a quote.

## Names and proper nouns

- **Spanish:** keep personal names (Maya Angelou, C.S. Lewis, Pastor Chris). Translate titles and roles (`Poet & Author` -> `Poeta y Autora`). Use standard Spanish forms for biblical names (Jesús, María). Use the established Spanish title for works (The Weight of Glory -> El peso de la gloria).
- **Burmese:** transliterate personal names; add the original in parentheses at first use in each field (`မာယာ အိန်ဂျလို (Maya Angelou)`, `ပါစတာ ခရစ် (Pastor Chris)`). Use traditional Burmese forms for biblical names (ယေရှု, ပေါလု, မာရိ). Work titles in `role` may stay English (`The Weight of Glory`). Translate roles (`ကဗျာဆရာမ နှင့် စာရေးဆရာမ`).
- Reuse the names and transliterations earlier weeks use for recurring people.

## Order and checks

1. Spanish -> `<week_id>.es.json`; validate with `python -m json.tool`.
2. Burmese -> `<week_id>.my.json`; validate.
3. Confirm key structure matches English. Write Burmese as UTF-8 (large, non-ASCII); re-validate after saving.
