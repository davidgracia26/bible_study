# Translation rules (Spanish and Burmese)

Goal: produce a fully translated copy of `data/<week_id>/<week_id>.json` as `<week_id>.es.json` (Spanish) and `<week_id>.my.json` (Burmese). The site loads these automatically when the language is selected.

## Core rule

Keep every object **key** in English; translate the **values** into the target language. Some values are names or proper nouns (people, places, books, titles); handle them as described below. Read the previous week's `.es.json` / `.my.json` first and match its conventions, so wording stays consistent across weeks.

## Do NOT translate (copy unchanged)

- All keys, including the ids used as keys in `passages` and `scholars` (e.g. `heb12`, `angelou`).
- `link` values in `passages` (Burmese keeps the English `version=NIV` URL; Spanish changes `version=NIV` to `version=NVI`).
- Numbers and ids: `n`, `section`, the id arrays in `passages` / `scholars` inside each question.
- Structure: same number of sections, points, questions, passages, scholars as the English file.
- HTML tags and entities: keep `<em>`, `<br><br>`, `&ldquo;`, `&rdquo;`, `&lsquo;`, `&rsquo;`, `&mdash;`, `&ndash;`, `&middot;`, `&amp;`, `&nbsp;` exactly where they are. In `sections[].name` keep the `<em>` wrapper around the corresponding translated words.

## Translate

All other string values: `meta` (pageTitle, eyebrow, date, series, title, titleHighlight, footer), `summary`, `sections` (label, name, ref), `passages[].ref` and `passages[].text`, `scholars[].role` and `scholars[].quote`, `questions[].text` and `questions[].refs`, `prayer`.

- `meta.translation`: Spanish `NVI`; Burmese keeps `NIV`.
- `meta.footer`: translate the words, keep the markup (`<strong>` around the translation abbreviation).
- Scripture references (`ref`, `refs`, summary point `ref`): use the target language's Bible book names. Spanish: Hebreos 12:1&ndash;2. Burmese: Burmese book names and Burmese numerals (e.g. ဟေဗြဲ ၁၂:၁&ndash;၂).
- Dates: Spanish `10 de noviembre` style (day before month); Burmese month name plus Burmese numerals (နိုဝင်ဘာ ၁၀).
- Section labels: Spanish `Parte 1`; Burmese `အပိုင်း ၁`. Prayer label: Spanish `Oración Final`; Burmese `နိဂုံးချုပ် ဆုတောင်းချက်`.
- Series name: Spanish `Gloria Cotidiana`; Burmese `သာမန် ဘုန်းအသရေ`. Reuse whatever earlier weeks used.
- Bible verse text: use the standard published translation in that language where you know it well (Spanish: NVI-style wording; Burmese: traditional Judson-style Burmese Bible wording, as earlier weeks do), otherwise translate faithfully. Keep the surrounding quote entities.
- Question and summary translations must keep the English style rules: one short question, one question mark, simple ESL-friendly language, no idioms, not invasive.
- Quotes from authors in `scholars[].quote`: translate the meaning naturally; keep it recognisable as a quote.

## Names and proper nouns

- Spanish: keep personal names as is (Maya Angelou, C.S. Lewis, Pastor Chris); translate titles and roles (`Poet & Author` -> `Poeta y Autora`); use the standard Spanish form for biblical names (Jesús, María). Work titles: use the established Spanish title when one exists (The Weight of Glory -> El peso de la gloria).
- Burmese: transliterate personal names into Burmese script and put the original in parentheses the first time it appears in a field, e.g. `မာယာ အိန်ဂျလို (Maya Angelou)`, `ပါစတာ ခရစ် (Pastor Chris)`. Biblical names use the traditional Burmese forms (ယေရှု, ပေါလု, မာရိ). Book/work titles in `role` may stay in English (e.g. `The Weight of Glory`). Roles are translated (`ကဗျာဆရာမ နှင့် စာရေးဆရာမ`).
- Match the exact names/transliterations already used in other weeks' files for recurring people.

## Order and checks

1. Spanish first -> `<week_id>.es.json`; validate with `python -m json.tool`.
2. Then Burmese -> `<week_id>.my.json`; validate.
3. Confirm the key structure matches the English file. Burmese files are large and contain many non-ASCII characters; write the file with UTF-8 encoding and re-validate after saving.
