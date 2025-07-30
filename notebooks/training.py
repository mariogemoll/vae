import numpy as np
import torch
from tqdm.notebook import trange

from constants import sidelength
from elbo import approximate_elbo
from model import VAE
from util import BatchIterator


def train(
    device: torch.device,
    trainset: torch.Tensor,
    valset: torch.Tensor,
    dst_path: str,
    num_epochs: int = 100,
    trainset_batch_size: int = 256,
    valset_batch_size: int = 64,
    grid: torch.Tensor | None = None,
    is_inner_loop: bool = False,
) -> tuple[list[float], list[float], torch.Tensor | None]:
    train_losses = []
    val_losses = []

    best_val_loss = np.inf
    vae = VAE(2).to(device)
    optimizer = torch.optim.Adam(vae.parameters(), lr=1e-3)

    if grid is not None:
        processed_grids = torch.zeros((num_epochs, 100, 2))

    if is_inner_loop:
        pbar = trange(num_epochs, position=1, leave=False)
    else:
        pbar = trange(num_epochs)
    for epoch in pbar:
        vae.train()
        per_batch_train_losses = []
        batch_iterator = BatchIterator(trainset, trainset_batch_size)
        for batch in batch_iterator:
            x = (batch / 255.0).to(device)
            mu_x, logvar_x, mu_z = vae(x)
            loss: torch.Tensor = -approximate_elbo(
                x.view(x.shape[0], sidelength * sidelength * 3),
                mu_z.view(mu_z.shape[0], sidelength * sidelength * 3),
                mu_x,
                logvar_x,
            ).mean()
            per_batch_train_losses.append(loss.item())
            optimizer.zero_grad()
            loss.backward()  # type: ignore[no-untyped-call]
            optimizer.step()
        train_losses.append(float(np.mean(per_batch_train_losses)))

        per_batch_val_losses = []
        vae.eval()
        with torch.no_grad():
            batch_iterator = BatchIterator(valset, valset_batch_size)
            for batch in batch_iterator:
                x = (batch / 255.0).to(device)
                mu_x, logvar_x, mu_z = vae(x)
                loss = -approximate_elbo(
                    x.view(x.shape[0], sidelength * sidelength * 3),
                    mu_z.view(mu_z.shape[0], sidelength * sidelength * 3),
                    mu_x,
                    logvar_x,
                ).mean()
                per_batch_val_losses.append(loss.item())

                if grid is not None:
                    mu, logvar = vae.encoder(grid)
                    processed_grids[epoch] = mu
        pbar.set_description(
            f"Train Loss: {train_losses[-1]:.4f}, Val Loss: {np.mean(per_batch_val_losses):.4f}"
        )
        epoch_val_loss = float(np.mean(per_batch_val_losses))
        val_losses.append(float(epoch_val_loss))

        if epoch > float(num_epochs) * 0.75 and epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save(vae.state_dict(), dst_path)

    return train_losses, val_losses, None if grid is None else processed_grids
