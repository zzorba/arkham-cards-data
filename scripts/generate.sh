#!/bin/bash

set -e

npx json2ts schema/schema.json -o ./demo/src/types/index.temp.d.ts -declareExternallyReferenced

rm ./demo/src/types/index.d.ts
echo "/* eslint-disable */" >> ./demo/src/types/index.d.ts
cat ./demo/src/types/index.temp.d.ts >> ./demo/src/types/index.d.ts
rm ./demo/src/types/index.temp.d.ts

