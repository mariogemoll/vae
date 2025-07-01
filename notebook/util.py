# function to map value from [0, 1] to the specified range
def map_value(value_range, value):
    return value_range[0] + (value * (value_range[1] - value_range[0]))


def map_tuple(value_range, value_tuple):
    return tuple(map_value(value_range, v) for v in value_tuple)


def in_range(value_range, value):
    return value_range[0] <= value <= value_range[1]
