#!/bin/bash

set -e

command -v jq >/dev/null 2>&1 || { printf >&2 "jq required, but not installed..aborting..\n"; exit 1; }

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
    esac
    shift
done

if test -f $OUTPUT_DIR/allCampaigns.json; then
  jq -f ./scripts/jq/tempCampaignLogs.jq $OUTPUT_DIR/allCampaigns.json > $OUTPUT_DIR/campaignLogs.json
else
  echo "$OUTPUT_DIR/allCampaigns.json file is missing. Build it first."
  exit 1
fi
