#!/bin/bash

set -e

buildCampaign () {
  if [ -d ${1} ]; then
    IFS='/' read -ra my_array <<< "$1"
    OUTPUT_FILE=${my_array[${#my_array[@]}-1]}.json
    echo '{' > ./build/campaigns/$OUTPUT_FILE
    echo '  "campaign":' >> ./build/campaigns/$OUTPUT_FILE
    cat $1/campaign.json >> ./build/campaigns/$OUTPUT_FILE
    echo ', "scenarios": [' >> ./build/campaigns/$OUTPUT_FILE
    count=0
    for s in ${1}/*.json; do
      if [[ $s = *campaign.json ]]
      then
        echo "Outputing $OUTPUT_FILE"
      else
        if [ $count -ne 0 ]
        then
          echo ',' >> ./build/campaigns/$OUTPUT_FILE
        fi
        cat $s >> ./build/campaigns/$OUTPUT_FILE
        count=1
      fi
    done
    echo ']}' >> ./build/campaigns/$OUTPUT_FILE
  fi
}

mkdir -p build

rm -rf build/campaigns
mkdir build/campaigns
CAMPAIGNS=campaigns/*
for f in $CAMPAIGNS; do
  buildCampaign $f;
done

RETURN_CAMPAIGNS=build/return_campaigns/*
for f in $RETURN_CAMPAIGNS; do
  buildCampaign $f;
done

cd build
count=0
echo '[' > ./allCampaigns.json
for f in campaigns/*; do
    if [ $count -ne 0 ]
    then
        echo ',' >> ./allCampaigns.json
    fi
    cat $f >> ./allCampaigns.json
    count=1
done
echo ']' >> ./allCampaigns.json
jq "[.[] | { campaignId: .campaign.id, section: map(.. .effects? | .[]? | select(((.type==\"campaign_log\") or (.type==\"campaign_log_count\") or (.type==\"campaign_log_cards\")) and .text and (.cross_out != true))) | group_by(.section) | .[] | { section: .[0].section, entries: map(. | { id: .id, text: .text }) | unique}, supplies: map(.. .supplies? | .[]? ) | flatten }] | group_by(.campaignId) | map({ campaignId: .[0].campaignId, sections: map(.section), supplies: map(.supplies) | flatten | unique })" ./allCampaigns.json > tempCampaignLogs.json
cd ..
node scripts/generateSideCampaignLog.js
cp build/allCampaigns.json demo/src/assets/allCampaigns.json
cp build/campaignLogs.json demo/src/assets/campaignLogs.json

