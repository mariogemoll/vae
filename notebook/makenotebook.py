import nbformat
from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell

nb = new_notebook()

def section(headline, path_to_content):
    with open(path_to_content, 'r', encoding='utf-8') as f:
        content = f.read()
    return new_markdown_cell(f"## {headline}\n\n{content}")

def cell_with_id(id, cell):
    cell.id = id
    cell.metadata.id = id
    return cell

nb.cells = [
    cell_with_id("title", new_markdown_cell("# Variational Autoencoders")),
    cell_with_id("theory", section("Theory", "../text/theory.md")),
    cell_with_id("js_build", new_code_cell([
        '!cd widget-wrappers && \\\n',
        'npm i --no-progress && \\\n',
        'npx esbuild src/datasetexplanation.ts --bundle --format=iife \\\n',
        '--sourcemap=inline --loader:.png=dataurl --outfile=dist/datasetexplanation.js'
    ])),
    cell_with_id("imports", new_code_cell('from vaewidgets import *')),
    cell_with_id("dataset_explanation", new_markdown_cell('## Dataset explanation')),
    cell_with_id("dataset_explanation_code", new_code_cell('dataset_explanation()'))
]

nb.metadata.kernelspec = {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3",
}

# Save to file
with open("notebook.ipynb", "w", encoding="utf-8") as f:
    nbformat.write(nb, f)
