"""Script to validate html in msgstr entries of po files.

Usage:
  `python scripts/htmlcheck.py dir`

For example, use `python scripts/htmlcheck.py i18n` to check all po files
in the i18n directory (including its subfolders)."""
import argparse
import sys
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Generator

import polib


class HTMLBalanceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.data = None
        self.errors = []

    def handle_starttag(self, tag, attrs):
        self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.error(f"Closing tag '{tag}' without opening tag")

    def parse(self, data):
        self.stack = []
        self.errors = []
        self.data = data
        super().feed(data)
        if self.stack:
            self.error(f"Opening tags {self.stack} without closing tags")

    def error(self, message):
        self.errors.append(message)


@dataclass
class Error:
    msg: str
    filename: str
    linenum: int

    def __str__(self):
        return f"{self.filename}:{self.linenum}: {self.msg}"


def validate_file(file: Path) -> Generator[Error, None, None]:
    po = polib.pofile(file)
    parser = HTMLBalanceParser()
    for entry in po:
        parser.parse(entry.msgstr)
        for error_msg in parser.errors:
            yield Error(msg=error_msg, filename=str(file), linenum=entry.linenum)


def validate_directory(directory: Path) -> Generator[Error, None, None]:
    for file in directory.rglob("*.po"):
        yield from validate_file(file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="htmlcheck",
        description="Checks all msgstr entries in po files of the given folder for valid html.",  # noqa
    )
    parser.add_argument("directory", metavar="dir", type=Path)
    args = parser.parse_args()
    num_errors = 0
    for error in validate_directory(args.directory):
        print(error)
        num_errors += 1
    print(f"{num_errors} errors found.")
    if num_errors > 0:
        sys.exit(1)
