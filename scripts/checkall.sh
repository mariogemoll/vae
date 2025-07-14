#!/bin/bash

# Fail if a subcommand fails
set -e

# Print the commands
set -x

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

$SCRIPT_DIR/checkpython.sh
$SCRIPT_DIR/checkts.sh
cd $SCRIPT_DIR/../text
npx markdownlint-cli2 *.md
