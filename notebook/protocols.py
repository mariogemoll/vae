from typing import Protocol, Tuple

import torch
from torch import nn


class VAEProtocol(Protocol):
    encoder: nn.Module
    decoder: nn.Module

    def forward(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]: ...
