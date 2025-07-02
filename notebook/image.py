import colorsys

import cairo
import numpy as np
from tqdm.notebook import tqdm

# Load image PNG only once
# image_surface = cairo.ImageSurface.create_from_png("face.png")
image_surface = cairo.ImageSurface.create_from_png("../misc/face.png")


image_width = image_surface.get_width()
image_height = image_surface.get_height()


def get_image(size, hue, sidelength):
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, sidelength, sidelength)
    ctx = cairo.Context(surface)

    # Background
    r, g, b = colorsys.hsv_to_rgb(hue, 0.8, 0.8)
    ctx.set_source_rgb(r, g, b)
    ctx.paint()

    # Scale and center image
    scale = size * sidelength / max(image_width, image_height)
    ctx.translate(sidelength / 2, sidelength / 2)
    ctx.scale(scale, scale)
    ctx.translate(-image_width / 2, -image_height / 2)
    ctx.set_source_surface(image_surface, 0, 0)
    ctx.paint()

    # Convert to NumPy
    buf = surface.get_data()
    img = np.frombuffer(buf, dtype=np.uint8).reshape((sidelength, sidelength, 4)).copy()

    # Convert BGRA to RGB and un-premultiply
    b, g, r, a = img[:, :, 0], img[:, :, 1], img[:, :, 2], img[:, :, 3]
    rgb = np.stack([r, g, b], axis=-1)
    alpha = a.astype(np.float32) / 255.0
    alpha[alpha == 0] = 1.0
    rgb = rgb.astype(np.float32) / alpha[:, :, None]
    rgb = np.clip(rgb, 0, 255)

    return rgb.transpose(2, 0, 1).astype(np.uint8)


def get_images(sidelength, coords):
    data = np.zeros((len(coords), 3, sidelength, sidelength), dtype=np.uint8)
    for i, (size, hue) in enumerate(tqdm(coords)):
        # Convert HSV to RGB
        data[i] = get_image(size, hue, sidelength)
    return data
