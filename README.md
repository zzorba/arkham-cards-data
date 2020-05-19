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
