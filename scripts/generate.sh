#!/bin/bash

set -e

npx json2ts schema/schema.json -o ./demo/src/types/index.d.ts -declareExternallyReferenced
