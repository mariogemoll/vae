from base64 import b64encode
from typing import Tuple

import anywidget
import torch
import traitlets
from IPython.display import HTML


def stringify_coords(coords: list[tuple[float, float]]) -> Tuple[str, str]:
    x_str = ",".join([f"{x:.3f}" for x, y in coords])
    y_str = ",".join([f"{y:.3f}" for x, y in coords])
    return x_str, y_str


def get_html_and_js(label: str) -> Tuple[str, str]:
    with open(f"../widgets/html/{label}.html") as html_file, open(
        f"widget-wrappers/dist/{label}.js"
    ) as js_file:
        html = html_file.read()
        js = js_file.read()
    return html, js


def get_face_img_base64_url() -> str:
    with open("../misc/face.png", "rb") as f:
        face_img_base64 = b64encode(f.read()).decode("ascii")
    return f"data:image/png;base64,{face_img_base64}"


def widget(html: str, js: str) -> HTML:
    return HTML(  # type: ignore[no-untyped-call]
        f"""
    {html}
    <script>{js}</script>
    """
    )


def dataset_explanation() -> HTML:
    html, js = get_html_and_js("datasetexplanation")
    face_img_base64_url = get_face_img_base64_url()
    return widget(
        html,
        f"""
        var faceImgUrl = '{face_img_base64_url}';
        {js}
    """,
    )


class AreaSelectionWidget(anywidget.AnyWidget):
    _esm = "widget-wrappers/dist/areaselection.js"
    xRange: traitlets.Tuple = traitlets.Tuple().tag(sync=True)
    yRange: traitlets.Tuple = traitlets.Tuple().tag(sync=True)
    xLabel = traitlets.Unicode().tag(sync=True)
    yLabel = traitlets.Unicode().tag(sync=True)
    x = traitlets.Float().tag(sync=True)
    y = traitlets.Float().tag(sync=True)
    width = traitlets.Float().tag(sync=True)
    height = traitlets.Float().tag(sync=True)

    def __init__(
        self,
        x_range: tuple[float, float],
        y_range: tuple[float, float],
        x_label: str,
        y_label: str,
        initial_x: float,
        initial_y: float,
        initial_width: float,
        initial_height: float,
    ) -> None:
        super().__init__()
        self.xRange = x_range
        self.yRange = y_range
        self.xLabel = x_label
        self.yLabel = y_label
        self.x = initial_x
        self.y = initial_y
        self.width = initial_width
        self.height = initial_height


def dataset_visualization(
    trainset_coords: list[tuple[float, float]],
    valset_coords: list[tuple[float, float]],
    trainset: torch.Tensor,
    valset: torch.Tensor,
    write_to_files: bool = False,
) -> HTML:
    trainset_coords_x, trainset_coords_y = stringify_coords(trainset_coords)
    valset_coords_x, valset_coords_y = stringify_coords(valset_coords)
    trainset_images_bytes = trainset.numpy().tobytes()
    valset_images_bytes = valset.numpy().tobytes()
    if write_to_files:
        with open("trainset_coords.json", "w") as f:
            f.write(f'{{"x": [{trainset_coords_x}], "y": [{trainset_coords_y}]}}')
        with open("valset_coords.json", "w") as f:
            f.write(f'{{"x": [{valset_coords_x}], "y": [{valset_coords_y}]}}')
        with open("trainset_images.bin", "wb") as f:
            f.write(trainset_images_bytes)
        with open("valset_images.bin", "wb") as f:
            f.write(valset_images_bytes)
    trainset_images_base64 = b64encode(trainset_images_bytes).decode("ascii")
    valset_images_base64 = b64encode(valset_images_bytes).decode("ascii")

    html, js = get_html_and_js("datasetvisualization")

    return widget(
        html,
        f"""
        var datasetVisualizationTrainsetX = [{trainset_coords_x}];
        var datasetVisualizationTrainsetY = [{trainset_coords_y}];
        var datasetVisualizationValsetX = [{valset_coords_x}];
        var datasetVisualizationValsetY = [{valset_coords_y}];
        var datasetVisualizationTrainsetImagesBase64 = '{trainset_images_base64}';
        var datasetVisualizationValsetImagesBase64 = '{valset_images_base64}';
        {js}
    """,
    )


def mapping(
    encoder_base64: str,
    decoder_base64: str,
    valset_bounds: tuple[tuple[float, float], tuple[float, float]],
) -> HTML:
    html, js = get_html_and_js("mapping")
    face_img_base64_url = get_face_img_base64_url()
    return widget(
        html,
        f"""
        var encoderBase64 = '{encoder_base64}';
        var decoderBase64 = '{decoder_base64}';
        var faceImgUrl = '{face_img_base64_url}';
        var valsetBounds = {valset_bounds};
        {js}
    """,
    )


def decoding(encoder_base64: str, decoder_base64: str) -> HTML:
    html, js = get_html_and_js("decoding")
    face_img_base64_url = get_face_img_base64_url()
    return widget(
        html,
        f"""
        var encoderBase64 = '{encoder_base64}';
        var decoderBase64 = '{decoder_base64}';
        var faceImgUrl = '{face_img_base64_url}';
        {js}
    """,
    )
