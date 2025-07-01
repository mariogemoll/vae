import anywidget
import traitlets
from IPython.display import HTML


def dataset_explanation():
    """
    Display the dataset explanation widget.
    """
    with open("widget-wrappers/dist/datasetexplanation.js") as js_file, open(
        "../widgets/html/datasetexplanation.html"
    ) as html_file:
        js = js_file.read()
        html = html_file.read()

    return HTML(
        f"""
    {html}
    <script>{js}</script>
    """
    )


class AreaSelectionWidget(anywidget.AnyWidget):
    _esm = "widget-wrappers/dist/areaselection.js"
    x = traitlets.Float(0.1).tag(sync=True)
    y = traitlets.Float(0.1).tag(sync=True)
    width = traitlets.Float(0.1).tag(sync=True)
    height = traitlets.Float(0.1).tag(sync=True)
