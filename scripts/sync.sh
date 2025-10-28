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
  cp ./build/standalone.json "$ARKHAM_CARDS/assets/generated/standalone_scenarios.txt"
  cp ./build/allCampaigns.json "$ARKHAM_CARDS/assets/generated/all_campaigns.txt"
  cp ./build/scenarioNames.json "$ARKHAM_CARDS/assets/generated/scenario_names.txt"
  cp ./build/campaignLogs.json "$ARKHAM_CARDS/assets/generated/campaign_logs.txt"
  cp ./build/encounterSets.json "$ARKHAM_CARDS/assets/generated/encounter_sets.txt"
  cp ./errata/en/errata.json "$ARKHAM_CARDS/assets/generated/campaign_errata.txt"
  cp ./taboos.json "$ARKHAM_CARDS/assets/generated/taboos.txt"
  cp ./chaos_tokens.json "$ARKHAM_CARDS/assets/generated/chaos_odds.txt"
  cp ./rules/en/rules.json "$ARKHAM_CARDS/assets/generated/rules.txt"

  # I18N files
  LANGS=(es ko it fr ru de zh pt pl vi cs zh-cn)
  for lang in ${LANGS[@]}; do
    cp ./build/allCampaigns_$lang.json "$ARKHAM_CARDS/assets/generated/all_campaigns_$lang.txt"
    cp ./build/scenarioNames_$lang.json "$ARKHAM_CARDS/assets/generated/scenario_names_$lang.txt"
    cp ./build/campaignLogs_$lang.json "$ARKHAM_CARDS/assets/generated/campaign_logs_$lang.txt"
    cp ./build/encounterSets_$lang.json "$ARKHAM_CARDS/assets/generated/encounter_sets_$lang.txt"
    cp ./errata/$lang/errata.json "$ARKHAM_CARDS/assets/generated/campaign_errata_$lang.txt"
    cp ./build/chaos_tokens_$lang.json "$ARKHAM_CARDS/assets/generated/chaos_odds_$lang.txt"
    cp ./build/i18n/$lang/taboos.json "$ARKHAM_CARDS/assets/generated/taboos_$lang.txt"
  done
  LANGS=(es ko it fr ru de zh pl it zh-cn)
  for lang in ${LANGS[@]}; do
    cp ./rules/$lang/rules.json "$ARKHAM_CARDS/assets/generated/rules_$lang.txt"
  done
else
  echo "Folder $ARKHAM_CARDS does not exist."
  exit 1
fi
