#!/bin/bash

set -e

command -v jq >/dev/null 2>&1 || { printf >&2 "jq required, but not installed..aborting..\n"; exit 1; }

if test -f ./build/allCampaigns.json; then
  jq -f ./scripts/jq/tempCampaignLogs.jq ./build/allCampaigns.json > ./build/tempCampaignLogs.json
  node ./scripts/generateSideCampaignLog.js
else
  echo "./build/allCampaigns.json file is missing. Build it first."
  exit 1
fi
