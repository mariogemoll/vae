from base64 import b64encode

import anywidget
import traitlets
from IPython.display import HTML


def stringify_coords(coords):
    x_str = ",".join([f"{x:.3f}" for x, y in coords])
    y_str = ",".join([f"{y:.3f}" for x, y in coords])
    return x_str, y_str


def get_html_and_js(label):
    with open(f"../widgets/html/{label}.html") as html_file, open(
        f"widget-wrappers/dist/{label}.js"
    ) as js_file:
        html = html_file.read()
        js = js_file.read()
    return html, js


def get_face_img_base64_url():
    with open("../misc/face.png", "rb") as f:
        face_img_base64 = b64encode(f.read()).decode("ascii")
    return f"data:image/png;base64,{face_img_base64}"


def widget(html, js):
    return HTML(
        f"""
    {html}
    <script>{js}</script>
    """
    )


def dataset_explanation():
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
    x = traitlets.Float(0.1).tag(sync=True)
    y = traitlets.Float(0.1).tag(sync=True)
    width = traitlets.Float(0.3).tag(sync=True)
    height = traitlets.Float(0.8).tag(sync=True)


def dataset_visualization(trainset_coords, valset_coords, trainset, valset):
    trainset_coords_x, trainset_coords_y = stringify_coords(trainset_coords)
    valset_coords_x, valset_coords_y = stringify_coords(valset_coords)
    trainset_images_base64 = b64encode(trainset.numpy().tobytes()).decode("ascii")
    valset_images_base64 = b64encode(valset.numpy().tobytes()).decode("ascii")

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


def mapping(encoder_base64, decoder_base64):
    html, js = get_html_and_js("mapping")
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


def decoding(encoder_base64, decoder_base64):
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
