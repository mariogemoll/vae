from typing import Tuple

import numpy as np


def make_standard_grid(x_range: Tuple[float, float], y_range: Tuple[float, float]) -> np.ndarray:
    rows, cols = 10, 10
    x_coords = np.linspace(x_range[0], x_range[1], cols)
    y_coords = np.linspace(y_range[0], y_range[1], rows)
    xx, yy = np.meshgrid(x_coords, y_coords)
    return np.stack([xx, yy], axis=-1).round(3)  # Shape: (10, 10, 2)
