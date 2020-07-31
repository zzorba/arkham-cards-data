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
  cp ./build/allCampaigns.json "$ARKHAM_CARDS/assets/allCampaigns.json"
  cp ./build/campaignLogs.json "$ARKHAM_CARDS/assets/campaignLogs.json"
  # I18N files
  cp ./build/allCampaigns_es.json "$ARKHAM_CARDS/assets/allCampaigns_es.json"
  cp ./build/campaignLogs_es.json "$ARKHAM_CARDS/assets/campaignLogs_es.json"
else
  echo "Folder $ARKHAM_CARDS does not exist."
  exit 1
fi
