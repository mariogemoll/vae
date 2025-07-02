import json
import sys


def notebook_has_output(path):
    with open(path, "r", encoding="utf-8") as f:
        nb = json.load(f)
    for cell in nb.get("cells", []):
        if cell.get("cell_type") == "code" and cell.get("outputs"):
            return True
    return False


if __name__ == "__main__":

    if len(sys.argv) != 2:
        sys.exit("Usage: python check_no_output.py <notebook_path>")

    notebook_path = sys.argv[1]
    if notebook_has_output(notebook_path):
        sys.exit("Notebook has output!")
