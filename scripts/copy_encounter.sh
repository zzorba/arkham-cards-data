#!/bin/bash

set -e

command -v jq >/dev/null 2>&1 || { printf >&2 "jq required, but not installed..aborting..\n"; exit 1; }

# Read environment settings
if test -f .env; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file is missing."
  exit 1
fi

# Check for ArkhamDB JSON data
if [ ! -d "$ARKHAMDB_DATA" ]; then
  echo "$ARKHAMDB_DATA does not exist."
  exit 1
fi

cp $ARKHAMDB_DATA/encounters.json encounter_sets.json

LANGS=(es de it fr ru)
for lang in ${LANGS[@]}; do
  echo Copying $lang
  cp $ARKHAMDB_DATA/translations/$lang/encounters.json encounter_sets/$lang.json
done
