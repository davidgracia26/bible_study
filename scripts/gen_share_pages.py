"""Generate s/<week_id>.html share stubs (OG meta + redirect to study.html) from data/manifest.json."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://davidgracia26.github.io/bible_study"

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <meta name="theme-color" content="#000000" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bible Study Guides" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{base}/s/{wid}.html" />
  <meta property="og:image" content="{base}/img/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="../img/favicon.svg" type="image/svg+xml" />
  <script>
    var p = new URLSearchParams(location.search);
    p.set('week', '{wid}');
    location.replace('../study.html?' + p.toString());
  </script>
</head>
<body>
  <noscript><a href="../study.html?week={wid}">{title}</a></noscript>
</body>
</html>
"""


def plain(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def main():
    weeks = json.loads((ROOT / "data/manifest.json").read_text(encoding="utf-8"))["weeks"]
    out = ROOT / "s"
    out.mkdir(exist_ok=True)
    ids = set()
    for w in weeks:
        wid = w["id"]
        d = json.loads((ROOT / f"data/{wid}/{wid}.json").read_text(encoding="utf-8"))
        m = d["meta"]
        name = plain(f"{m.get('title', '')} {m.get('titleHighlight', '')}")
        title = " | ".join(x for x in (plain(m.get("series")), name) if x)
        desc = plain((d.get("summary") or {}).get("bigIdea")) or (
            f"{plain(m.get('series'))} Bible study discussion questions for {plain(m.get('date'))}."
        )
        (out / f"{wid}.html").write_text(
            TEMPLATE.format(
                title=html.escape(title), desc=html.escape(desc), base=BASE, wid=wid
            ),
            encoding="utf-8",
            newline="\n",
        )
        ids.add(f"{wid}.html")
    for f in out.glob("*.html"):
        if f.name not in ids:
            f.unlink()
    print(f"wrote {len(ids)} pages")


if __name__ == "__main__":
    main()
