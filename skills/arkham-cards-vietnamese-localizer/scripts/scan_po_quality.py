#!/usr/bin/env python3
"""Scan ArkhamCards Vietnamese PO files for common post-translation issues."""

from __future__ import annotations

import argparse
from pathlib import Path


BAD_MSGSTR_PATTERNS = [
    "Lật thêm",
    "băng Sheldon gang",
    "Sheldon gang",
    "Kịch bản này",
    "scenario reference",
    "deck của họ",
    "bộ bài của họ",
    "spawn",
    "engaged",
]


def iter_po_files(path: Path):
    if path.is_file():
        yield path
    else:
        yield from sorted(path.rglob("*.po"))


def scan_file(path: Path):
    hits = []
    state = None
    for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if "\ufffd" in line:
            hits.append((lineno, "replacement-char", line))
        if line.startswith("msgid "):
            state = "msgid"
        elif line.startswith("msgstr "):
            state = "msgstr"
        elif line and not line.startswith('"'):
            state = None
        if state == "msgstr":
            for pattern in BAD_MSGSTR_PATTERNS:
                if pattern in line:
                    hits.append((lineno, pattern, line))
    return hits


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()

    total = 0
    for root in args.paths:
        for po_file in iter_po_files(root):
            hits = scan_file(po_file)
            for lineno, pattern, line in hits:
                total += 1
                print(f"{po_file}:{lineno}: {pattern}: {line[:220]}")

    if total:
        print(f"{total} issue(s) found")
        return 1
    print("OK: no common PO quality issues found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
