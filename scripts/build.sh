#!/bin/bash

set -e

INPUT_DIR="./campaigns"
RETURN_INPUT_DIR="./build/return_campaigns"
OUTPUT_DIR="./build"

while [[ $# -gt 0 ]]; do
    key="$1"
    case "$key" in
        -o|--output)
        shift # past the key and to the value
        OUTPUT_DIR="$1"
        ;;
        -o=*|--output=*)
        OUTPUT_DIR="${key#*=}"
        ;;
        -i|--input)
        shift # past the key and to the value
        INPUT_DIR="$1"
        ;;
        -i=*|--input=*)
        INPUT_DIR="${key#*=}"
        ;;
        -r|--return)
        shift
        RETURN_INPUT_DIR="$1"
        ;;
        -r=*|--return=*)
        RETURN_INPUT_DIR="${key#*=}"
        ;;
    esac
    shift
done


buildCampaign () {
  if [ -d ${1} ]; then
    IFS='/' read -ra my_array <<< "$1"
    OUTPUT_FILE=${my_array[${#my_array[@]}-1]}.json
    echo '{' > $OUTPUT_DIR/campaigns/$OUTPUT_FILE
    echo '  "campaign":' >> $OUTPUT_DIR/campaigns/$OUTPUT_FILE
    cat $1/campaign.json >> $OUTPUT_DIR/campaigns/$OUTPUT_FILE
    echo ', "scenarios": [' >> $OUTPUT_DIR/campaigns/$OUTPUT_FILE
    count=0
    for s in ${1}/*.json; do
      if [[ $s = *campaign.json ]]
      then
        echo "Outputing $OUTPUT_FILE"
      else
        if [ $count -ne 0 ]
        then
          echo ',' >> $OUTPUT_DIR/campaigns/$OUTPUT_FILE
        fi
        cat $s >> $OUTPUT_DIR/campaigns/$OUTPUT_FILE
        count=1
      fi
    done
    echo ']}' >> $OUTPUT_DIR/campaigns/$OUTPUT_FILE
  fi
}

mkdir -p $OUTPUT_DIR

cp $INPUT_DIR/../encounter_sets.json $OUTPUT_DIR/encounterSets.json

rm -rf $OUTPUT_DIR/campaigns
mkdir $OUTPUT_DIR/campaigns
CAMPAIGNS=$INPUT_DIR/*
for f in $CAMPAIGNS; do
  buildCampaign $f;
done

RETURN_CAMPAIGNS=$RETURN_INPUT_DIR/*
for f in $RETURN_CAMPAIGNS; do
  buildCampaign $f;
done

cd $OUTPUT_DIR
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
