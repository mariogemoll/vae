#!/bin/bash

# Fail if a subcommand fails
set -e

npx esbuild src/datasetexplanation.ts --bundle --format=iife --loader:.png=dataurl \
    --outfile=dist/datasetexplanation.js

npx esbuild ../../widgets/src/areaselection.ts --bundle --format=esm --outfile=dist/areaselection.js

npx esbuild src/datasetvisualization.ts --bundle --format=iife --loader:.png=dataurl \
    --outfile=dist/datasetvisualization.js

npx esbuild src/mapping.ts --bundle --format=iife --loader:.png=dataurl --outfile=dist/mapping.js

npx esbuild src/decoding.ts --bundle --format=iife --outfile=dist/decoding.js

npx esbuild ../../widgets/src/gridviewer.ts --bundle --format=esm --outfile=dist/gridviewer.js

npx esbuild src/modelcomparison.ts --bundle --format=iife --outfile=dist/modelcomparison.js

npx esbuild src/evolution.ts --bundle --format=iife --outfile=dist/evolution.js
