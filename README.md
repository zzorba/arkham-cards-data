# arkham-cards-data

Repo for campaign guide data for ArkhamCards app.

## Basic Structure

Campaign data lives primary in the /campaigns folder, structured by three-letter campaign code.

### Campaign

Campaign overview info is held in the campaign.json fold, including chaos bag and initial campaign sections.

### Scenarios and Interludes

Each scenario/interlude has its own file, referenced by the scenario name. These names are unique to the campaign, but all data should be prefixed with campaign code to make them unique.

The structure of flow is controlled by 'steps', which are then referenced by the 'setup', 'resolutions' and other 'steps' (to implement conditional control flow). With all input and changes expressed as deltas, it should be possible to capture only the input choices and 'replay' the log to reproduce the final state given the guide.

The complexity comes with the definition of steps. The schema shows some of the state space, but as the Arkham Horror: LCG becomes more complex over time, new control inputs and flows will be needed to capture the full nuance.

## ArkhamDB

All card codes referenced in the schema share the numeric scheme of ArkhamDB.
To implement a campaign like experience, you will need to understand and interpret a card repository.

## Build

The following scripts are available to build the project using Yarn or NPM :

- **clean**: clean generated targets
- **definitions**: generate TypeScript definitions based on the JSON Schema
- **validate**: validate JSON files against the schema (it builds Return To campaigns)
- **build**: build JSON files ArkhamCards needs
- **build:all-campaigns**: build campaigns JSON file
- **build:campaign-logs**: build campaign logs JSON file
- **build:return-to**: build Return To campaigns by merging Return To modifications with original campaign
- **verify**: run various checks on the generated campaigns JSON file
- **sync**: copy TypeScript definitions and generated JSON files to your ArkhamCards project
- **sync:demo**: update the demo app assets

A typical workflow for editing the data is :

- edit files in `campaigns` or `return_campaigns`
- validate against the schema using `yarn validate`
- build the JSON files with `yarn build`
- run post-build checks with `yarn verify`


## Translation
Translationn files live in the `i18n/` folder and are grouped by language. There are many programs that are capable of editing them, but I've found that a program called [PoEdit](https://poedit.net/), which has a free version that is totally serviceable. Using this program, you can edit the .po files in the `i18n` folder and submit the changes via Pull Request (or by opening an issue and I will provide contact information on how to submit changes).

A couple notes about translation.

- Since a lot of phrases are duplicated, we translate the files in order starting with `dwl`. This means that some strings will only appear there, but be used in other campaigns as well.
- The best thing to do is probably work from the PDFs available from FFG. Most of the story text can be copy/pasted directly into the matching section, but some of the instruction text might need phrasing/tense changes to match the campaign guide.
- When copying pasting text from the PDFs, watch out for the newlines. Often you have to remove the aggressive newlines, and then put in `\n` for the line breaks we do want to keep. I've found that using a text editor like sublime lets you match on the whitespace and replace it in bulk before putting into PoEdit.
- The text contains some limited markdown, please try to maintain this to match the formatting found in the campaign guides.
- Text inside of # marks (like #name# or #count#) or brackets (\[guardian\] or \[auto_fail\]) should be left as is, these will be interpolated by the system or turned into symbols.
- Campaign log entry text should start with a lower case, unless the start of the sentence is a proper noun. This allows us to use the same text for *In your campaign log, record that "phrase"* as well as in the actual campaign log.
