# arkham-cards-data
Repo for campaign guide data for ArkhamCards app.

## Basic Structure
Campaign data lives primary in the /campaigns folder, structured by three-letter campaign code.

### Campaign
Campaign overview info is held in the campaign.json fold, including chaos bag and initial campaign sections.

### Scenarios and Interludes
Each scenario/interlude has its own file, referenced by the scenario name. These names are unique to the campaign, but all data should be prefixed with campaign code to make them unique.

The structure of flow is controlled by 'steps', which are then referenced by the 'setup', 'resolutions' and other 'steps' (to implement conditional control flow). With all input and changes expressed as deltas, it should be possible to capture only the input choices and 'replay' the log to reproduce the final state given the guide.

## ArkhamDB
All card codes referenced in the schema share the numeric scheme of ArkhamDB.
To implement a campaign like experience, you will need to understand and interpret a card repository.