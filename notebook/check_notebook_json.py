import json
import sys

expected_metadata_keys = {"kernelspec", "language_info"}


def check_output(nb_path, nb) -> None:  # type: ignore[no-untyped-def]
    for cell in nb.get("cells", []):
        if cell.get("cell_type") == "code" and cell.get("outputs"):
            raise ValueError(f"Notebook {nb_path} has output!")


def check_empty_cells(nb_path, nb) -> None:  # type: ignore[no-untyped-def]
    for cell in nb.get("cells", []):
        source = cell.get("source")
        if len(source) == 0 or source == [""]:
            raise ValueError(f"Notebook {nb_path} has empty cells!")


def check_metadata_keys(nb_path, nb) -> None:  # type: ignore[no-untyped-def]
    if "metadata" not in nb:
        raise ValueError("Notebook metadata is missing")
    metadata_keys = set(nb["metadata"].keys())
    if metadata_keys != expected_metadata_keys:
        raise ValueError(
            f"Metadata keys in {nb_path} are incorrect: {metadata_keys} != {expected_metadata_keys}"
        )


if __name__ == "__main__":

    if len(sys.argv) != 2:
        sys.exit("Usage: python check_no_output.py <notebook_path>")

    notebook_path = sys.argv[1]

    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    check_output(notebook_path, nb)
    check_empty_cells(notebook_path, nb)
    check_metadata_keys(notebook_path, nb)
