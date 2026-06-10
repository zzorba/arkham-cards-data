---
name: arkham-cards-vietnamese-localizer
description: Translate, review, repair, and validate ArkhamCards / Arkham Horror LCG Vietnamese campaign PO files. Use for i18n/vi .po files, fan campaign translation, ArkhamCards campaign logs, scenario/resolution/prologue/epilogue text, Translation Tool or MCAI/Gemini batch workflows, HTML tag failures, placeholder mismatches, and UTF-8 encoding damage such as Vietnamese text turning into question marks.
---

# ArkhamCards Vietnamese Localizer

## Workflow

1. Inspect the real `.po` files first. Read adjacent translated campaigns when terminology or tone is uncertain.
2. Edit only `msgstr` unless the user explicitly asks to maintain source text.
3. Preserve PO structure, comments, `msgid`, placeholders, icons, escaped newlines, and HTML tags.
4. Translate story, narration, dialogue, choices, and italicized story options fully into Vietnamese.
5. Keep official names, card names, encounter set names, scenario/campaign titles, traits, keywords, icons, and cross-reference labels in English unless the local corpus already establishes a Vietnamese form.
6. Validate before final response.

Read `references/translation-rules.md` before translating or reviewing a campaign.
Read `references/session-lessons.md` before doing batch translation, CSV re-apply, or encoding/tag repair.

## Batch Translation

For large batches, use a structured source table instead of ad hoc text replacement:

- Extract untranslated `msgstr` entries to CSV with columns like `id,file,line,source,translation`.
- Translate through the requested tool/model.
- Re-apply translations by matching normalized `msgid` text, not by fragile line numbers.
- Treat all files as UTF-8.
- Avoid writing Vietnamese text through shell one-liners that can pass through the Windows console codepage.

If a UTF-8 CSV output exists, prefer:

```powershell
python skills\arkham-cards-vietnamese-localizer\scripts\apply_po_csv.py --csv path\to\output.csv --po-root i18n\vi\campaigns\zau
```

## Review

Prioritize:

- Full translation for dialogue/story text, including text inside `<i>...</i>` when it is prose or a choice.
- Natural Vietnamese second-person narration using `bạn`.
- Clear rules text; keep game terms when they are official labels.
- Campaign Log fragments lowercase unless they begin with a proper noun.
- Consistent phrases across repeated entries.

Do not blindly accept AI review suggestions that translate official card names, scenario titles, encounter set names, or core game labels needed for cross-reference.

## Validation

Run the nearest practical checks:

```powershell
python scripts/htmlcheck.py i18n
python C:\Users\PC\.codex\skills\arkham-horror-translator\scripts\check_po_placeholders.py i18n\vi\campaigns\zau
python skills\arkham-cards-vietnamese-localizer\scripts\scan_po_quality.py i18n\vi\campaigns\zau
git diff --check -- i18n\vi\campaigns\zau
```

If `scripts/htmlcheck.py` fails because `polib` is missing, report that dependency issue and still run the placeholder and quality scans.

Important: PowerShell or `git diff` output may render Vietnamese as `?` even when the file is valid UTF-8. Confirm with Python reading the file as UTF-8 before declaring data loss.
