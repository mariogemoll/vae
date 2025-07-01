import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook


def section(headline, path_to_content):
    with open(path_to_content, "r", encoding="utf-8") as f:
        content = f.read()
    return new_markdown_cell(f"## {headline}\n\n{content}")


def cell_with_id(id, cell):
    cell.id = id
    cell.metadata.id = id
    return cell


if __name__ == "__main__":
    nb = new_notebook()

    nb.cells = [
        cell_with_id("title", new_markdown_cell("# Variational Autoencoders")),
        cell_with_id("theory", section("Theory", "../text/theory.md")),
        cell_with_id(
            "js_build",
            new_code_cell(
                [
                    "!cd widget-wrappers && \\\n",
                    "npm i --no-progress && \\\n",
                    "npx esbuild src/datasetexplanation.ts --bundle --format=iife \\\n",
                    "--sourcemap=inline --loader:.png=dataurl \\\n",
                    "--outfile=dist/datasetexplanation.js && \\\n",
                    "npx esbuild ../../widgets/src/areaselection.ts \\\n",
                    "--outfile=dist/areaselection.js\n",
                ]
            ),
        ),
        cell_with_id("imports", new_code_cell("from vaewidgets import *")),
        cell_with_id("dataset_explanation", new_markdown_cell("## Dataset explanation")),
        cell_with_id("dataset_explanation_code", new_code_cell("dataset_explanation()")),
        cell_with_id(
            "train_validatation_set_split", new_markdown_cell("## Train/validation set split")
        ),
        cell_with_id(
            "valset_selection",
            new_code_cell(["valset_selection = AreaSelectionWidget()\n", "valset_selection"]),
        ),
    ]

    nb.metadata.kernelspec = {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3",
    }

    # Save to file
    with open("notebook.ipynb", "w", encoding="utf-8") as f:
        nbformat.write(nb, f)
