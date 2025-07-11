#!/bin/bash

# Fail if a subcommand fails
set -e

# Print the commands
set -x

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $SCRIPT_DIR/../notebook

flake8 .

isort . --check-only --diff

black --check --diff .

python check_no_output.py notebook.ipynb

mypy *.py
