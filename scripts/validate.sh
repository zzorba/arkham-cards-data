#!/bin/bash

set -e

node scripts/generateReturnCampaigns.js
node scripts/schemaValidate.js
scripts/build.sh

invalid_has_card=$(jq -f scripts/jq/invalid_has_card.jq build/allCampaigns.json)
if [[ $invalid_has_card ]]; then
  echo "A \"has_card\" condition has an invalid effect (only trauma allowed)"
fi

echo "Looking for invalid encounter sets"
encounter_sets=$(jq -f scripts/jq/encounter_sets.jq build/allCampaigns.json)
while IFS= read -r line; do
  case `grep -F "$line" "../arkhamdb-json-data/encounters.json" >/dev/null; echo $?` in
  0)
    # code if found
    ;;
  1)
    # code if not found
    echo "Encounter code $line is invalid"
    ;;
  *)
    # code if an error occurred
    ;;
  esac
done <<< "$encounter_sets"
echo "Done"

scripts/generate.sh

scripts/sync.sh
