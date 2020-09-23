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

if test -f ./build/allCampaigns.json; then
#  invalid_has_card=$(jq -f scripts/jq/invalid_has_card.jq build/allCampaigns.json)
#  if [[ $invalid_has_card ]]; then
#    echo "A \"has_card\" condition has an invalid effect (only trauma or story step allowed)"
#    exit 1
#  fi

  echo "Looking for invalid encounter sets"
  encounter_sets=$(jq -f scripts/jq/encounter_sets.jq build/allCampaigns.json)
  while IFS= read -r line; do
    case `grep -F "$line" "encounter_sets/en.json" >/dev/null; echo $?` in
    0)
      # code if found
      ;;
    1)
      # code if not found
      echo "Encounter code $line is invalid"
      exit 1
      ;;
    *)
      # code if an error occurred
      ;;
    esac
  done <<< "$encounter_sets"
  echo "Done"
else
  echo "./build/allCampaigns.json file is missing. Build it first."
  exit 1
fi
