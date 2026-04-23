# VAE

Source for [mariogemoll.com/vae](https://mariogemoll.com/vae), an interactive introduction to
Variational Autoencoders. It combines a written derivation of the ELBO with a trainable 2D-latent
VAE (PyTorch) and a set of browser widgets that visualize the dataset, latent space, sampling, and
decoding.

## Repository layout

- `text/` — the written article (`theory.md`).
- `notebooks/` — PyTorch model, training code, and the main Jupyter notebook (`vae.ipynb`).
  Exports ONNX weights that are consumed by the web widgets.
  - `widget-wrappers/` — TypeScript wrappers that expose the widgets to Jupyter via
    [anywidget](https://anywidget.dev/).
- `widgets/` — TypeScript sources for the interactive widgets used on the web page.
- `scripts/` — lint/type-check helpers (`checkall.sh` runs Python, TypeScript, and markdown
  checks).
- `.github/workflows/` — CI (`build.yaml`) and the Colab notebook sync job
  (`colab-update.yaml`).

## Getting started

### Python (notebook)

```bash
cd notebooks
pip install -r requirements-build.txt
pip install "torch>=2,<3"
jupyter lab vae.ipynb
```

`requirements-check.txt` adds the linters used in CI.

### TypeScript (widgets)

```bash
cd widgets && npm i
cd ../notebooks/widget-wrappers && npm i
```

Build the notebook widget bundles with
`notebooks/widget-wrappers/build_wrapped_widgets.sh`.

### Checks

```bash
./scripts/checkall.sh
```

## Colab

The `vae.ipynb` notebook is mirrored to Google Drive / Colab via the `colab-update` workflow
(manual dispatch).
