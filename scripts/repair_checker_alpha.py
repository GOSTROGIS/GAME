"""Convert a painted pale checkerboard around an isolated figure to real alpha.

This is intentionally conservative: only low-chroma, bright pixels connected to
the image boundary are removed. Enclosed light details on the figure are kept.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def is_backdrop(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _ = pixel
    return min(red, green, blue) >= 215 and max(red, green, blue) - min(red, green, blue) <= 20


def repair(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        offset = y * width + x
        if not background[offset] and is_backdrop(pixels[x, y]):
            background[offset] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    output = image.copy()
    output_pixels = output.load()
    removed = 0
    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if background[offset]:
                red, green, blue, _ = output_pixels[x, y]
                output_pixels[x, y] = (red, green, blue, 0)
                removed += 1

    if removed < width * height // 5:
        raise RuntimeError(f"Backdrop detection was too small ({removed} pixels); refusing to write {destination}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)
    print(f"{source.name}: removed {removed:,}/{width * height:,} connected backdrop pixels -> {destination}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    arguments = parser.parse_args()
    repair(arguments.source, arguments.destination)
