#!/bin/bash

set -e

cd schema
npx json2ts schema.json -o ../demo/src/types/index.d.ts -declareExternallyReferenced
