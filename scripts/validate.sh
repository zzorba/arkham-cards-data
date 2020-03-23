#!/bin/bash

set -e

node scripts/schemaValidate.js
scripts/build.sh

invalid_has_card=$(jq ".[] | .scenarios[] | .steps[] | select(.condition != null) | .condition | select(.type == \"has_card\") | .options[] | select(.effects != null) | .effects[] | select(.type != \"trauma\" and .type != \"story_step\")" build/allCampaigns.json)
if [[ $invalid_has_card ]]; then
  echo "A \"has_card\" condition has an invalid effect (only trauma allowed)"
fi

scripts/generate.sh

scripts/sync.sh

