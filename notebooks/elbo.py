import math

import torch


def kl_divergence(mu: torch.Tensor, logvar: torch.Tensor) -> torch.Tensor:
    return 0.5 * torch.sum(mu**2 + torch.exp(logvar) - logvar - 1, dim=1)


def log_normal_spherical(x: torch.Tensor, mu: torch.Tensor, sigma2: float) -> torch.Tensor:
    d = x.size(1)
    squared_error = (x - mu).pow(2).sum(dim=1)
    return -0.5 * (d * math.log(2 * math.pi) + d * math.log(sigma2) + squared_error / sigma2)


def approximate_elbo(
    xi: torch.Tensor,
    mu_z: torch.Tensor,
    mu_xi: torch.Tensor,
    logvar_xi: torch.Tensor,
) -> torch.Tensor:
    recon_term = log_normal_spherical(xi, mu_z, sigma2=1.0)
    kl_term = kl_divergence(mu_xi, logvar_xi)
    return recon_term - kl_term
