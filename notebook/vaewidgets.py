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


def get_js(label: str) -> str:
    with open(f"widget-wrappers/dist/{label}.js") as js_file:
        return js_file.read()


def get_face_img_base64_url() -> str:
    with open("../misc/face.png", "rb") as f:
        face_img_base64 = b64encode(f.read()).decode("ascii")
    return f"data:image/png;base64,{face_img_base64}"


def widget(js: str, height: int = 300) -> HTML:
    return HTML(  # type: ignore[no-untyped-call]
        f"""
    <div style="height: {height}px"></div>
    <script>{js}</script>
    """
    )


def dataset_explanation() -> HTML:
    js = get_js("datasetexplanation")
    face_img_base64_url = get_face_img_base64_url()
    return widget(
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

    js = get_js("datasetvisualization")

    return widget(
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
    valset_bounds: tuple[tuple[float, float], tuple[float, float]] | None = None,
) -> HTML:
    js = get_js("mapping")
    face_img_base64_url = get_face_img_base64_url()
    if valset_bounds is None:
        valset_bounds_str = "null"
    else:
        valset_bounds_str = "{[list(from_to) for from_to in valset_bounds]}"
    return widget(
        f"""
        var encoderBase64 = '{encoder_base64}';
        var decoderBase64 = '{decoder_base64}';
        var faceImgUrl = '{face_img_base64_url}';
        var valsetBounds = {valset_bounds_str};
        {js}
        """,
        height=330,
    )


def decoding(encoder_base64: str, decoder_base64: str) -> HTML:
    js = get_js("decoding")
    face_img_base64_url = get_face_img_base64_url()
    return widget(
        f"""
        var encoderBase64 = '{encoder_base64}';
        var decoderBase64 = '{decoder_base64}';
        var faceImgUrl = '{face_img_base64_url}';
        {js}
    """,
    )


class GridViewer(anywidget.AnyWidget):
    _esm = "widget-wrappers/dist/gridviewer.js"
    xRange: traitlets.Tuple = traitlets.Tuple().tag(sync=True)
    yRange: traitlets.Tuple = traitlets.Tuple().tag(sync=True)
    grid = traitlets.List(traitlets.List(traitlets.List(traitlets.Float()))).tag(sync=True)

    def __init__(
        self,
        x_range: tuple[float, float],
        y_range: tuple[float, float],
        grid: list[list[tuple[float, float]]],
    ) -> None:
        super().__init__()
        self.xRange = x_range
        self.yRange = y_range
        self.grid = grid


def model_comparison(losses: bytes, grids: bytes) -> HTML:
    js = get_js("modelcomparison")
    losses_base64 = b64encode(losses).decode("ascii")
    grids_base64 = b64encode(grids).decode("ascii")
    return widget(
        f"""
        var lossesBase64 = '{losses_base64}';
        var gridsBase64 = '{grids_base64}';
        {js}
        """,
        450,
    )
