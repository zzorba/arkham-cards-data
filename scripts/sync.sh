#!/bin/bash
# Copy TypeScript definitions and generated JSON files to your ArkhamCards project

set -e

# Read environment settings
if test -f .env; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file is missing."
  exit 1
fi

if [ -d "$ARKHAM_CARDS" ]; then
  cp ./build/index.d.ts "$ARKHAM_CARDS/src/data/scenario/types.d.ts"
  cp ./build/standalone.json "$ARKHAM_CARDS/assets/standaloneScenarios.json"
  cp ./build/allCampaigns.json "$ARKHAM_CARDS/assets/allCampaigns.json"
  cp ./build/campaignLogs.json "$ARKHAM_CARDS/assets/campaignLogs.json"
  cp ./build/encounterSets.json "$ARKHAM_CARDS/assets/encounterSets.json"
  cp ./errata/en/errata.json "$ARKHAM_CARDS/assets/campaignErrata.json"
  cp ./rules/en/rules.json "$ARKHAM_CARDS/assets/rules.json"
  cp ./rules/es/rules.json "$ARKHAM_CARDS/assets/rules_es.json"
  cp ./rules/ru/rules.json "$ARKHAM_CARDS/assets/rules_ru.json"
  cp ./rules/de/rules.json "$ARKHAM_CARDS/assets/rules_de.json"
  # I18N files
  LANGS=(es fr ru de zh pt)
  for lang in ${LANGS[@]}; do
    cp ./build/allCampaigns_$lang.json "$ARKHAM_CARDS/assets/allCampaigns_$lang.json"
    cp ./build/campaignLogs_$lang.json "$ARKHAM_CARDS/assets/campaignLogs_$lang.json"
    cp ./build/encounterSets_$lang.json "$ARKHAM_CARDS/assets/encounterSets_$lang.json"
    cp ./errata/$lang/errata.json "$ARKHAM_CARDS/assets/campaignErrata_$lang.json"
  done
else
  echo "Folder $ARKHAM_CARDS does not exist."
  exit 1
fi
