#!/bin/bash

set -e

cp ./demo/src/types/index.d.ts ../ArkhamCards/src/data/scenario/types.d.ts
cp ./build/allCampaigns.json ../ArkhamCards/assets/allCampaigns.json
cp ./build/campaignLogs.json ../ArkhamCards/assets/campaignLogs.json

