#!/usr/bin/env python3
"""Bundle index.html, styles.css and app.js into one HTML fragment for
publishing as a claude.ai Artifact (the host adds <html>/<head>/<body>)."""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
js = (root / "app.js").read_text(encoding="utf-8")

head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
view = re.search(r'<body[^>]*data-view="(\w+)"', html).group(1)

# Keep the title, the claude: meta tag and the Google Fonts link; the host
# supplies charset/viewport, and the local stylesheet is inlined below.
keep = [line.strip() for line in head.splitlines()
        if re.match(r'\s*<(title|meta name="claude|link rel="stylesheet" href="https)', line)]
body = body.replace('<script src="app.js"></script>', f"<script>\n{js}</script>")

out = (
    "\n".join(keep)
    + f"\n<style>\n{css}</style>\n"
    # The host owns <body>, so the initial view attribute is set from script.
    + f'<script>document.body.dataset.view = "{view}";</script>\n'
    + body.strip()
    + "\n"
)
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "kreator-cv.html"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(out, encoding="utf-8")
print(dest)
