import base64
import os

import matplotlib.pyplot as plt
import torch

from constants import latent_dim


# function to map value from [0, 1] to the specified range
def map_value(value_range, value):
    return value_range[0] + (value * (value_range[1] - value_range[0]))


def map_tuple(value_range, value_tuple):
    return tuple(map_value(value_range, v) for v in value_tuple)


def in_range(value_range, value):
    return value_range[0] <= value <= value_range[1]


class BatchIterator:
    def __init__(self, data: torch.Tensor, batch_size: int):
        """
        Creates an iterator over shuffled batches from the input data.

        Args:
            data (torch.Tensor): The full dataset of shape (n, ...).
            batch_size (int): The desired batch size.
        """
        self.data = data
        self.batch_size = batch_size
        self.n = data.shape[0]
        self.num_full_batches = self.n // self.batch_size
        if self.num_full_batches == 0:
            raise ValueError("Batch size is larger than the dataset size.")

    def __iter__(self):
        indices = torch.randperm(self.n)
        for i in range(self.num_full_batches):
            batch_indices = indices[i * self.batch_size : (i + 1) * self.batch_size]
            yield self.data[batch_indices]

    def __len__(self):
        return self.num_full_batches


def plot_losses(train_losses, val_losses):
    _, ax = plt.subplots()
    ax.plot(train_losses, label="Train loss")
    ax.set_xlabel("Batch")
    ax.set_ylabel("Loss")
    ax.plot(val_losses, label="Validation loss", color="orange")
    ax.legend()
    plt.tight_layout()


def read_as_base64(file_path):
    """
    Reads a file and returns its content as a base64 encoded string.

    Args:
        file_path (str): Path to the file to be read.

    Returns:
        str: Base64 encoded content of the file.
    """
    with open(file_path, "rb") as file:
        return base64.b64encode(file.read()).decode("ascii")


def random_string(length=10):
    """
    Generates a random string of fixed length.

    Args:
        length (int): Length of the random string to be generated.

    Returns:
        str: Randomly generated string.
    """
    import random
    import string

    letters = string.ascii_letters + string.digits
    return "".join(random.choice(letters) for _ in range(length))


def onnx_export_to_files(vae, encoder_path, decoder_path):
    """
    Exports the VAE encoder and decoder to ONNX format and stores them at the specified paths.
    """
    # Dummy image input
    encoder_dummy_input = torch.randn(1, 3, 32, 32)

    # Export to ONNX
    torch.onnx.export(
        vae.encoder,
        encoder_dummy_input,
        encoder_path,
        input_names=["image"],
        output_names=["mu", "logvar"],
        dynamic_axes={
            "image": {0: "batch_size"},
            "mu": {0: "batch_size"},
            "logvar": {0: "batch_size"},
        },
        opset_version=14,
    )

    # Dummy latent input
    decoder_dummy_input = torch.randn(1, latent_dim)

    # Export to ONNX
    torch.onnx.export(
        vae.decoder,
        decoder_dummy_input,
        decoder_path,
        input_names=["z"],
        output_names=["reconstruction"],
        dynamic_axes={"z": {0: "batch_size"}, "reconstruction": {0: "batch_size"}},
        opset_version=14,
    )


def onnx_export(vae):
    """
    Exports the VAE encoder and decoder to ONNX format and returns it as base64 encoded strings.
    """

    encoder_path = "/tmp/encoder_" + random_string() + ".onnx"
    decoder_path = "/tmp/decoder_" + random_string() + ".onnx"

    onnx_export_to_files(vae, encoder_path, decoder_path)

    encoder_base64 = read_as_base64(encoder_path)
    decoder_base64 = read_as_base64(decoder_path)

    # Clean up temporary files
    os.remove(encoder_path)
    os.remove(decoder_path)

    return encoder_base64, decoder_base64
