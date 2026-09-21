#!/usr/bin/env python3
"""Inline the SOL / sorcerics wordmark vectors into every page.

The wordmarks are the designer's outlined paths, extracted once from the
design deck (`new web ongoing.pdf`, page 6) into `assets/wordmarks.svg`.
Each page carries a `<!--WORDMARKS-->` marker (or an existing injected
block) right after <body>; this script replaces it with the symbol defs
so `<use href="#wm-sol">` works without an external request.

    python3 scripts/inject_wordmarks.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "wordmarks.svg"
START, END = "<!--wordmarks:start-->", "<!--wordmarks:end-->"

symbols = SRC.read_text(encoding="utf-8").strip()
block = f'{START}<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>{symbols}</defs></svg>{END}'

for page in sorted(ROOT.glob("*.html")):
    html = page.read_text(encoding="utf-8")
    if START in html:
        new = re.sub(re.escape(START) + r".*?" + re.escape(END), block, html, flags=re.S)
    elif "<!--WORDMARKS-->" in html:
        new = html.replace("<!--WORDMARKS-->", block)
    else:
        print(f"skip  {page.name} (no marker)")
        continue
    if new != html:
        page.write_text(new, encoding="utf-8")
        print(f"ok    {page.name}")
    else:
        print(f"same  {page.name}")
