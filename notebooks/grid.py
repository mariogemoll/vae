from typing import Tuple

import ipywidgets as widgets  # type: ignore
import matplotlib.pyplot as plt
import numpy as np


def make_standard_grid(x_range: Tuple[float, float], y_range: Tuple[float, float]) -> np.ndarray:
    rows, cols = 10, 10
    x_coords = np.linspace(x_range[0], x_range[1], cols)
    y_coords = np.linspace(y_range[0], y_range[1], rows)
    xx, yy = np.meshgrid(x_coords, y_coords)
    return np.stack([xx, yy], axis=-1).round(3)  # Shape: (10, 10, 2)


px = 1 / plt.rcParams["figure.dpi"]  # Pixel in inches


def connect_rows(grid: np.ndarray) -> None:
    for i in range(10):
        for j in range(9):
            plt.plot(
                [grid[i][j][0], grid[i][j + 1][0]],
                [grid[i][j][1], grid[i][j + 1][1]],
                "k-",
                linewidth=0.2,
            )


def connect_columns(grid: np.ndarray) -> None:
    for j in range(10):
        for i in range(9):
            plt.plot(
                [grid[i][j][0], grid[i + 1][j][0]],
                [grid[i][j][1], grid[i + 1][j][1]],
                "k-",
                linewidth=0.2,
            )


def show_grid(
    out: widgets.Output, xlim: tuple[float, float], ylim: tuple[float, float], grid: np.ndarray
) -> None:
    with out:
        plt.subplots(figsize=(250 * px, 250 * px))
        plt.xlim(xlim)
        plt.ylim(ylim)
        connect_rows(grid)
        connect_columns(grid)
        plt.show()
