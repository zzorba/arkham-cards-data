#!/bin/bash
  
set -e

npx json2ts scenario.schema.json -o ./demo/src/types/scenario.d.ts -declareExternallyReferenced
