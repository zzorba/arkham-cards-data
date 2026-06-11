#!/usr/bin/env python3
"""Apply UTF-8 CSV translations to PO msgstr entries by normalized msgid."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def norm(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def po_unescape(value: str) -> str:
    out = []
    i = 0
    while i < len(value):
        char = value[i]
        if char == "\\" and i + 1 < len(value):
            nxt = value[i + 1]
            out.append({"n": "\n", "t": "\t", "r": "\r", '"': '"', "\\": "\\"}.get(nxt, nxt))
            i += 2
        else:
            out.append(char)
            i += 1
    return "".join(out)


def po_escape(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\t", "\\t")
        .replace("\r", "")
        .replace("\n", "\\n")
    )


def quoted_payload(line: str) -> str:
    start = line.find('"')
    end = line.rfind('"')
    if start == -1 or end <= start:
        return ""
    return po_unescape(line[start + 1 : end])


def get_field(block: list[str], tag: str) -> str | None:
    value = None
    for line in block:
        if line.startswith(tag + " "):
            value = quoted_payload(line)
            continue
        if value is not None and line.startswith('"'):
            value += quoted_payload(line)
            continue
        if value is not None:
            break
    return value


def encode_msgstr(value: str) -> list[str]:
    value = norm(value)
    if "\n" not in value:
        return [f'msgstr "{po_escape(value)}"']
    return ['msgstr ""'] + [f'"{po_escape(part)}"' for part in value.splitlines(True)]


def split_blocks(lines: list[str]) -> list[list[str]]:
    blocks = []
    current = []
    for line in lines:
        if line == "":
            blocks.append(current)
            current = []
        else:
            current.append(line)
    if current:
        blocks.append(current)
    return blocks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, type=Path, help="CSV with file, source, translation columns")
    parser.add_argument("--po-root", required=True, type=Path, help="Root directory containing PO files")
    args = parser.parse_args()

    translations: dict[str, dict[str, str]] = {}
    with args.csv.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"file", "source", "translation"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"CSV missing columns: {sorted(missing)}")
        for row in reader:
            translations.setdefault(row["file"], {})[norm(row["source"])] = row["translation"]

    changed = 0
    missed = []
    for file_name, mapping in translations.items():
        path = args.po_root / file_name
        if not path.exists():
            missed.extend((file_name, key) for key in mapping)
            continue

        blocks = split_blocks(path.read_text(encoding="utf-8").splitlines())
        seen = set()
        out_blocks = []
        for block in blocks:
            source = get_field(block, "msgid")
            key = norm(source or "")
            if key in mapping:
                index = next((i for i, line in enumerate(block) if line.startswith("msgstr ")), None)
                if index is not None:
                    end = index + 1
                    while end < len(block) and block[end].startswith('"'):
                        end += 1
                    block = block[:index] + encode_msgstr(mapping[key]) + block[end:]
                    changed += 1
                    seen.add(key)
            out_blocks.append(block)

        for key in mapping:
            if key not in seen:
                missed.append((file_name, key))

        path.write_text("\n\n".join("\n".join(block) for block in out_blocks) + "\n", encoding="utf-8")

    print(f"changed={changed} missed={len(missed)}")
    for file_name, key in missed[:20]:
        print(f"MISS {file_name}: {key[:120].encode('unicode_escape').decode('ascii')}")
    return 1 if missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
