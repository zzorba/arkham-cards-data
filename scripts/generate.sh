#!/bin/bash
# Generate TypeScript definition from JSON Schema

set -e

echo "/* eslint-disable */" > ./build/index.d.ts
npx json2ts schema/schema.json -declareExternallyReferenced >> ./build/index.d.ts

# Copy definitions to the demo app
cp build/index.d.ts demo/src/types/
