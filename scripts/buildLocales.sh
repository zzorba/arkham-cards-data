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

echo $ARKHAM_CARDS
node ./scripts/buildLocales.js --arkham_cards $ARKHAM_CARDS

