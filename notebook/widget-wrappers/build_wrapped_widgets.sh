#!/bin/bash

# Fail if a subcommand fails
set -e

npx esbuild src/datasetexplanation.ts --bundle --format=iife --loader:.png=dataurl \
    --outfile=dist/datasetexplanation.js

npx esbuild ../../widgets/src/areaselection.ts --outfile=dist/areaselection.js

npx esbuild src/datasetvisualization.ts --bundle --format=iife --loader:.png=dataurl \
    --outfile=dist/datasetvisualization.js

npx esbuild src/mapping.ts --bundle --format=iife --loader:.png=dataurl --outfile=dist/mapping.js

npx esbuild src/decoding.ts --bundle --format=iife --outfile=dist/decoding.js
