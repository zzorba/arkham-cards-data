# Building

This document describes how the generated JSON files consumed by the ArkhamCards app are produced from the source data in this repository.

## Prerequisites

Copy `.env.example` (or create `.env`) in the repository root with:

```
ARKHAM_CARDS=../ArkhamCards
ARKHAMDB_DATA=../arkhamdb-json-data
```

`ARKHAM_CARDS` must point to a checkout of the [ArkhamCards](https://github.com/zzorba/ArkhamCards) project. It is used by the `sync`, `definitions` (indirectly) and the locale scripts (to read the app's core `.po` translation file under `assets/i18n`).

`ARKHAMDB_DATA` must point to a checkout of the [arkhamdb-json-data](https://github.com/Kamalisk/arkhamdb-json-data) project.


Install dependencies with `yarn install` (or `npm install`).

## NPM scripts

| Script | Command | Purpose |
|---|---|---|
| `clean` | `rimraf ./build` | Removes the `build/` output directory. |
| `build:return-to` | `node ./scripts/generateReturnCampaigns.js` | Merges `return_campaigns/` overrides with the base `campaigns/` data. |
| `build:standalone` | `node ./scripts/generateStandalones.js` | Generates `build/standalone.json`. |
| `build:all-campaigns` | `ts-node ./scripts/build.ts` | Merges per-scenario files into one JSON file per campaign, plus `allCampaigns.json` and `scenarioNames.json`. |
| `build:campaign-logs` | `ts-node ./scripts/generate-campaign-logs.ts` | Extracts campaign log structure into `build/campaignLogs.json`. |
| `build:i18n` | `ts-node ./scripts/buildLocales.ts` | Repeats the whole pipeline per locale, applying `.po` translations. |
| `build` | `build:return-to` → `build:standalone` → `build:all-campaigns` → `build:return-to` → `build:campaign-logs` → `build:i18n` | Full default-locale + localized build. |
| `definitions` | `ts-node ./scripts/generate.ts` | Compiles `schema/schema.json` into `build/index.d.ts` TypeScript definitions. |
| `validate:schema` | `node scripts/schemaValidate.js` | Validates every JSON file against the JSON Schema in `schema/`. |
| `validate` | `build:return-to` → `validate:schema` | Rebuilds return-to data, then validates it. |
| `verify:all-campaigns` | `ts-node ./scripts/validate.ts` | Runs semantic checks (encounter set references, `has_card` conditions, ...) against `build/allCampaigns.json`. |
| `verify` | `build` → `verify:all-campaigns` | Full build followed by semantic checks. |
| `sync` | `ts-node ./scripts/sync.ts` | Copies the generated files/typings into the ArkhamCards checkout (`ARKHAM_CARDS`). |
| `sync:demo` | shell copy | Copies `allCampaigns.json`/`campaignLogs.json` into the local `demo/` app. |
| `all` | `clean` → `verify` → `validate:schema` → `definitions` → `sync` | Full clean rebuild, validated and synced. |

## Default locale (English) pipeline

The English data is built first; every other locale reuses it as source data.

1. **`build:return-to`** (`scripts/generateReturnCampaigns.js`, default `-i .` `-o ./build`)
   Reads `return_campaigns/<rt-code>/*.json`. Each `campaign.json` there is merged on top of the matching base campaign in `campaigns/<code>/campaign.json` (deep merge + step overrides); the merged result is written to `build/return_campaigns/<rt-code>/campaign.json`. Other files in `return_campaigns/<rt-code>/` describe a modified scenario: they're merged with the original scenario file (found via their `original_id`) and written next to the campaign. Interludes/epilogues that are reused unmodified from the base campaign are copied over as well.

2. **`build:standalone`** (`scripts/generateStandalones.js`)
   Produces `build/standalone.json` for standalone scenarios.

3. **`build:all-campaigns`** (`scripts/build.ts`, default `-i ./campaigns` `-r ./build/return_campaigns` `-o ./build`)
   For every campaign folder in `campaigns/` **and** `build/return_campaigns/`, reads `campaign.json` plus every other scenario `*.json` file in that folder and combines them into a single `build/campaigns/<code>.json` file (`{ campaign, scenarios }`). It then aggregates all of them into `build/allCampaigns.json` and derives `build/scenarioNames.json`.

4. **`build:return-to`** runs a second time (see `build` script) — this is a rebuild of step 1, kept so its output directory is fresh/consistent before campaign logs are generated. It does not depend on step 3's output.

5. **`build:campaign-logs`** (`scripts/generate-campaign-logs.ts`, default `-o ./build`)
   Reads `build/allCampaigns.json` and extracts `campaign_log` sections into `build/campaignLogs.json`.

6. **`build:i18n`** — see below.

## Localization pipeline

`build:i18n` runs `scripts/buildLocales.ts`, a thin wrapper that loads `.env` and calls `scripts/buildLocales.js` with `ARKHAM_CARDS`. Only `it` is currently enabled (`localeCodes = ['it']` in `buildLocales.js`); other locale folders under `i18n/` are ignored until re-enabled.

For each locale code the pipeline mirrors the default-locale steps above, but sourced from translation files:

1. **`scripts/generateLocales.js`** is invoked once (not per locale) and does the actual translation:
   - Loads the ArkhamCards core `.po` file (`assets/i18n/<locale>.po`) plus every scenario/campaign-specific `.po` file under `i18n/<locale>/...`.
   - Walks every JSON file under `campaigns/`, `return_campaigns/`, `cards/`, `packs/*.json`, `encounter_sets.json`, `taboos.json` and `chaos_tokens.json`, replacing translatable string fields (`text`, `name`, `scenario_name`, ...) with the matching `.po` translation (falling back to the core app translation, then leaving the English string and recording it as a new `.po` entry to translate later).
   - Writes each translated file to the same relative path under `build/i18n/<locale>/`, e.g. `campaigns/dwl/dwl_prologue.json` → `build/i18n/it/campaigns/dwl/dwl_prologue.json`, and `return_campaigns/rtdwl/campaign.json` → `build/i18n/it/return_campaigns/rtdwl/campaign.json`.
   - This is the localized equivalent of the source `campaigns/` and `return_campaigns/` folders — nothing is merged yet, each file is still separate.

2. **`check_rules.ts <locale>`** validates there are no duplicate rule IDs in `rules/<locale>/rules.json`; the build stops if it fails.

3. **`generateReturnCampaigns.js -i build/i18n/<locale> -o build/i18n/<locale>/build`**
   Same merge logic as the default-locale step 1, but reading the *translated* `build/i18n/<locale>/return_campaigns` and `build/i18n/<locale>/campaigns`, and writing the merged translated return-to campaign/scenario files to `build/i18n/<locale>/build/return_campaigns`.

4. **`build.ts -i build/i18n/<locale>/campaigns -o build/i18n/<locale>/build -r build/i18n/<locale>/build/return_campaigns`**
   Same as the default-locale step 3: combines the translated campaign folders and the translated return-to campaign folders into one file per campaign under `build/i18n/<locale>/build/campaigns/<code>.json`, plus `build/i18n/<locale>/build/allCampaigns.json` and `scenarioNames.json`.

5. **`generate-campaign-logs.ts -o build/i18n/<locale>/build`** produces `build/i18n/<locale>/build/campaignLogs.json`.

6. The locale's `allCampaigns.json`, `scenarioNames.json`, `campaignLogs.json` and `encounterSets.json` are copied to the repository root `build/` folder with a `_<locale>` suffix (e.g. `build/allCampaigns_it.json`).

### Notes on path handling

`generateReturnCampaigns.js` computes output paths with string `.replace()` against directories built from `-i`/`-o` CLI arguments. These arguments must be normalized with `path.normalize()` before being used, otherwise a mix of `/` and the OS path separator (as happens on Windows when `-i`/`-o` use forward slashes) makes the `.replace()` silently fail to match, causing merged output to be written back on top of the input files instead of the intended output directory.

## Validation

- `yarn validate:schema` validates every JSON file (cards, campaigns, return campaigns, rules, errata, taboos, chaos tokens) against the schemas in `schema/`.
- `yarn verify:all-campaigns` (`scripts/validate.ts`) runs additional semantic checks against `build/allCampaigns.json`, such as encounter set codes actually existing in `encounter_sets.json`.

## Syncing to ArkhamCards

`yarn sync` (`scripts/sync.ts`) copies the generated definitions and JSON payloads (`build/index.d.ts`, `build/allCampaigns.json`, `build/campaignLogs.json`, per-locale variants, errata, taboos, chaos tokens, rules, ...) into the `ARKHAM_CARDS` checkout's `assets/generated` folder and `src/data/scenario/types.d.ts`.

## Typical workflows

- **Editing campaign data**: edit files in `campaigns/` or `return_campaigns/`, run `yarn validate`, then `yarn build`, then `yarn verify`.
- **Editing translations**: edit `.po` files under `i18n/<locale>/` (e.g. with [PoEdit](https://poedit.net/)), then run `yarn build:i18n`.
- **Full release**: `yarn all` (clean, verify, validate schema, generate definitions, sync).
