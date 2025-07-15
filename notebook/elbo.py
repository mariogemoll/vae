import math

import torch


def kl_divergence(mu: torch.Tensor, logvar: torch.Tensor) -> torch.Tensor:
    """
    KL divergence between N(mu, sigma^2) and N(0, 1), per sample.
    mu, logvar: tensors of shape [batch_size, latent_dim]
    Returns: tensor of shape [batch_size]
    """
    return 0.5 * torch.sum(torch.exp(logvar) + mu**2 - 1 - logvar, dim=1)


def log_normal_diag_spherical(x: torch.Tensor, mu: torch.Tensor, sigma2: float) -> torch.Tensor:
    B = x.size(0)
    d = x[0].numel()  # total dims per sample
    squared_error = (x - mu).pow(2).view(B, -1).sum(dim=1)

    const_term = -0.5 * d * math.log(2 * math.pi)
    log_sigma_term = -0.5 * d * math.log(sigma2)
    quad_term = -0.5 / sigma2 * squared_error
    return const_term + log_sigma_term + quad_term


def approximate_elbo(
    xi: torch.Tensor,
    mu_z: torch.Tensor,
    mu_xi: torch.Tensor,
    logvar_xi: torch.Tensor,
    sigma2: float,
) -> torch.Tensor:
    """
    Approximates ELBO for each data point xi.

    Args:
        xi: [batch_size, input_dim] — true input data
        mu_z: [batch_size, input_dim] — decoder output (mean of p(x|z))
        mu_xi, logvar_xi: [batch_size, latent_dim] — encoder outputs
        sigma2: scalar — reconstruction variance

    Returns:
        elbo: [batch_size] — per-sample ELBO
    """
    assert len(xi.shape) == 2, "xi must be a 2D tensor"
    assert len(mu_z.shape) == 2, "mu_z must be a 2D tensor"
    assert len(mu_xi.shape) == 2, "mu_xi must be a 2D tensor"
    assert len(logvar_xi.shape) == 2, "logvar_xi must be a 2D tensor"

    assert xi.shape == mu_z.shape, "xi and mu_z must have the same shape"
    assert mu_xi.shape == logvar_xi.shape, "mu_xi and logvar_xi must have the same shape"
    assert sigma2 > 0, "sigma2 must be positive"

    recon_term = log_normal_diag_spherical(xi, mu_z, sigma2)
    kl_term = kl_divergence(mu_xi, logvar_xi)
    beta = 1.0  # default beta value, can be adjusted
    return recon_term - beta * kl_term  # ELBO = log p(x|z) - KL(q(z|x) || p(z))
