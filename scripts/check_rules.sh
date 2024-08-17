#!/bin/bash

# Check if a language code is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <language_code>"
  exit 1
fi

# Define the language code and JSON file
lang_code="$1"
file="rules/$lang_code/rules.json"

# Check if the file exists
if [ ! -f "$file" ]; then
  echo "File not found: $file"
  exit 0
fi

# Extract the top-level id fields from each object in the array
top_level_ids=$(jq -r '.[].id' "$file")

# Extract the nested id fields from the rules key in each object in the array, handling missing or null rules
nested_ids=$(jq -r 'map(select(.rules != null) | .rules[].id) | .[]' "$file")

# Combine both sets of ids
all_ids=$(echo -e "$top_level_ids\n$nested_ids" | grep -v '^$')

# Sort the ids and find duplicates
duplicates=$(echo "$all_ids" | sort | uniq -d)

# Check if there are any duplicates
if [ -z "$duplicates" ]; then
  echo "No duplicate ids found."
else
  echo "Duplicate ids found:"
  echo "$duplicates"
  exit 1
fi
