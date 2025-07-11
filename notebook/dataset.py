import random

import torch

from constants import sidelength
from image import get_images
from util import in_range


def generate_dataset(
    size_range: tuple[int, int],
    hue_range: tuple[float, float],
    valset_size_range: tuple[int, int],
    valset_hue_range: tuple[float, float],
    num_samples: int,
) -> tuple[list[tuple[float, float]], list[tuple[float, float]], torch.Tensor, torch.Tensor]:
    trainset_coords = []
    valset_coords = []
    for i in range(num_samples):
        x = random.uniform(size_range[0], size_range[1])
        y = random.uniform(hue_range[0], hue_range[1])
        if in_range(valset_size_range, x) and in_range(valset_hue_range, y):
            valset_coords.append((x, y))
        else:
            trainset_coords.append((x, y))

    trainset = torch.from_numpy(get_images(sidelength, trainset_coords))
    valset = torch.from_numpy(get_images(sidelength, valset_coords))

    return trainset_coords, valset_coords, trainset, valset
