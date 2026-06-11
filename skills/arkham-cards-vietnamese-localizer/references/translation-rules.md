# Translation Rules

## Keep English

Keep these in English unless the local corpus already has an established Vietnamese convention:

- Investigator, character, place, organization, campaign, scenario, card, enemy, asset, treachery, location, encounter set, and story asset names.
- Traits, keywords, icons, chaos token labels, class/faction names.
- Mechanical zone/component labels when used as game references: `deck`, `agenda`, `act`, `victory display`, `threat area`, `encounter set`, `chaos bag`, `weakness`, `doom`, `horror`, `damage`, `resource`, `skill test`.

Do not keep ordinary English prose just because it is inside `<i>...</i>`. Translate italicized dialogue, choices, and Campaign Log phrases.

## Preferred Vietnamese

- `investigator` -> `điều tra viên`
- `Campaign Log` -> `Nhật ký Chiến dịch`
- `scenario` as a playable scenario -> `màn`
- `scenario reference card` -> `lá bài tham chiếu màn chơi`
- `Reveal another token` -> `Rút thêm một token`
- `Sheldon gang` in narration/dialogue -> `băng Sheldon`
- `engaged with you` -> `đang giao chiến với bạn`
- `spawn` in Vietnamese rules text -> `triệu hồi`

## Style

- Use `bạn` for player-facing narration and instructions.
- Keep rules text plain and unambiguous.
- Let story text sound natural and complete; do not leave English filler in dialogue.
- Avoid over-literal pronouns such as `deck của họ` when the referent is the acting investigator; prefer `deck của mình`.
- Preserve capitalization for official names and titles.
- Campaign Log fragments should start lowercase unless the first word is a proper noun.

## HTML and PO Safety

- Preserve balanced HTML tags exactly.
- Preserve placeholders such as `#name#`, `#X#`, `[cultist]`, `[auto_fail]`.
- Preserve escaped `\n` structure and quote escaping.
- Never edit `msgid` as part of translation work.
