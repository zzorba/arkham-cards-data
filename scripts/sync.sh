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
  cp ./build/standalone.json "$ARKHAM_CARDS/assets/generated/standaloneScenarios.json"
  cp ./build/allCampaigns.json "$ARKHAM_CARDS/assets/generated/allCampaigns.json"
  cp ./build/campaignLogs.json "$ARKHAM_CARDS/assets/generated/campaignLogs.json"
  cp ./build/encounterSets.json "$ARKHAM_CARDS/assets/generated/encounterSets.json"
  cp ./errata/en/errata.json "$ARKHAM_CARDS/assets/generated/campaignErrata.json"
  cp ./taboos.json "$ARKHAM_CARDS/assets/generated/taboos.json"
  cp ./chaos_tokens.json "$ARKHAM_CARDS/assets/generated/chaosOdds.json"
  cp ./rules/en/rules.json "$ARKHAM_CARDS/assets/generated/rules.json"

  # I18N files
  LANGS=(es ko it fr ru de zh pt pl)
  for lang in ${LANGS[@]}; do
    cp ./build/allCampaigns_$lang.json "$ARKHAM_CARDS/assets/generated/allCampaigns_$lang.json"
    cp ./build/campaignLogs_$lang.json "$ARKHAM_CARDS/assets/generated/campaignLogs_$lang.json"
    cp ./build/encounterSets_$lang.json "$ARKHAM_CARDS/assets/generated/encounterSets_$lang.json"
    cp ./errata/$lang/errata.json "$ARKHAM_CARDS/assets/generated/campaignErrata_$lang.json"
    cp ./build/chaos_tokens_$lang.json "$ARKHAM_CARDS/assets/generated/chaosOdds_$lang.json"
    cp ./build/i18n/$lang/taboos.json "$ARKHAM_CARDS/assets/generated/taboos_$lang.json"
  done
  LANGS=(es fr ko ru zh)
  for lang in ${LANGS[@]}; do
    cp ./rules/$lang/rules.json "$ARKHAM_CARDS/assets/generated/rules_$lang.json"
  done
else
  echo "Folder $ARKHAM_CARDS does not exist."
  exit 1
fi
