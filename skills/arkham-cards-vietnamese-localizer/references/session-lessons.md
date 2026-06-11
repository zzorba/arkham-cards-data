# Session Lessons

## Encoding

Windows console output can display valid UTF-8 Vietnamese as mojibake or `?`. Do not trust console-rendered `git diff` alone.

Use Python to read bytes as UTF-8 and inspect with `unicode_escape` or targeted scans:

```powershell
python skills\arkham-cards-vietnamese-localizer\scripts\scan_po_quality.py i18n\vi\campaigns\zau
```

Avoid PowerShell/Python one-liners containing literal Vietnamese text or HTML like `<i>`; quoting and codepage behavior can corrupt data or break parsing. Prefer `apply_patch` for small edits and file-based Python scripts for bulk operations.

If translated text turns into `?`, recover from the original UTF-8 translation artifact if available, such as the Translation Tool output CSV. Re-apply by normalized source text using `scripts/apply_po_csv.py`.

## HTML Tag Failure

`scripts/htmlcheck.py i18n` catches malformed tags. A common failure is text like:

```html
There's</i> so much<i>
```

The translation must preserve the same tag order. If the source itself has odd tag placement, mirror the valid intent in `msgstr` so tags remain balanced:

```html
Có <i>quá nhiều thứ</i>
```

## Review Guardrails

After re-applying machine translation, re-apply human review fixes because CSV output can overwrite them:

- `băng Sheldon gang` -> `băng Sheldon`
- `scenario reference` -> `lá bài tham chiếu màn chơi`
- `deck của họ` in investigator self-reference -> `deck của mình`
- `Kịch bản này` -> `Màn này`
- `Lật thêm một token` -> `Rút thêm một token`

Run scans on `msgstr` only; many English patterns legitimately remain in `msgid`.
