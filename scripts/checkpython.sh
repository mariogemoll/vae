#!/bin/bash

# Fail if a subcommand fails
set -e

# Print the commands
set -x

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $SCRIPT_DIR/../notebook

flake8 --show-source *.py

isort --check-only --diff *.py

black --check --diff *.py

mypy --strict --show-error-context *.py

for notebook in *.ipynb; do
    python check_notebook_json.py $notebook
done

nbqa flake8 --show-source *.ipynb

nbqa isort --check-only --diff *.ipynb

nbqa black --check --diff *.ipynb

nbqa mypy --strict --show-error-context *.ipynb
