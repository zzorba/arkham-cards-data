#!/bin/bash

set -e

rm -rf build
mkdir build
cd campaigns
for f in *; do
    if [ -d ${f} ]; then
        echo '{' > ../build/$f.json
        echo '  "campaign":' >> ../build/$f.json
        cat $f/campaign.json >> ../build/$f.json
        echo ', "scenarios": [' >> ../build/$f.json
        count=0
        for s in ${f}/*.json; do
          if [[ $s = *campaign.json ]]
          then
            echo "Outputing $f"
          else
            if [ $count -ne 0 ]
            then
              echo ',' >> ../build/$f.json
            fi
            cat $s >> ../build/$f.json
            count=1
          fi
        done
        echo ']}' >> ../build/$f.json

    fi
done
