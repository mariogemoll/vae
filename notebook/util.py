import matplotlib.pyplot as plt
import torch


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
