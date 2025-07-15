#!/bin/bash

# Fail if a subcommand fails
set -e

# Print the commands
set -x

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $SCRIPT_DIR/../notebook

flake8 *.py

isort --check-only --diff *.py

black --check --diff *.py

python check_no_output.py notebook.ipynb

mypy --strict --show-error-context *.py

nbqa flake8 notebook.ipynb

nbqa isort --check-only --diff notebook.ipynb

nbqa black --check --diff notebook.ipynb

nbqa mypy --strict --show-error-context notebook.ipynb
