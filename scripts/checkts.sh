#!/bin/bash

# Fail if a subcommand fails
set -e

# Print the commands
set -x

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $SCRIPT_DIR/../widgets

npx eslint -c basic.eslint.config.js basic.eslint.config.js eslint.config.js
npx eslint src

npx tsc

cd $SCRIPT_DIR/../notebook/widget-wrappers

npx eslint -c basic.eslint.config.js basic.eslint.config.js eslint.config.js
npx eslint src

npx tsc
