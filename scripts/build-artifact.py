#!/usr/bin/env python3
"""Bundle index.html, styles.css, i18n.js and app.js into one file.

Default: an HTML fragment for publishing as a claude.ai Artifact (the host
adds <html>/<head>/<body>). With --standalone DEST: a complete page with the
CSS and JS inlined, ready to upload to any static host (e.g. GitHub Pages)."""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
js = (root / "app.js").read_text(encoding="utf-8")
i18n = (root / "i18n.js").read_text(encoding="utf-8")

if len(sys.argv) > 2 and sys.argv[1] == "--standalone":
    page = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}</style>")
    page = page.replace('<script src="app.js"></script>', f"<script>\n{js}</script>")
    page = page.replace('<script src="i18n.js"></script>', f"<script>\n{i18n}</script>")
    dest = pathlib.Path(sys.argv[2])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding="utf-8")
    print(dest)
    sys.exit(0)

head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
body_data = re.findall(r'data-([\w-]+)="([^"]*)"', re.search(r"<body([^>]*)>", html).group(1))

# Keep the title, the claude: meta tag and the Google Fonts link; the host
# supplies charset/viewport, and the local stylesheet is inlined below.
keep = [line.strip() for line in head.splitlines()
        if re.match(r'\s*<(title|meta name="claude|link rel="stylesheet" href="https)', line)]
body = body.replace('<script src="app.js"></script>', f"<script>\n{js}</script>")
body = body.replace('<script src="i18n.js"></script>', f"<script>\n{i18n}</script>")

out = (
    "\n".join(keep)
    + f"\n<style>\n{css}</style>\n"
    # The host owns <body>, so its data-* attributes are set from script.
    + "<script>"
    + "".join(f'document.body.setAttribute("data-{k}", "{v}");' for k, v in body_data)
    + "</script>\n"
    + body.strip()
    + "\n"
)
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "kreator-cv.html"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(out, encoding="utf-8")
print(dest)
