"""Canonical PNG preprocessing for the existing MobileNetV2 classifier."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping

import cv2
import numpy as np
from numpy.typing import NDArray


DEFAULT_CONFIG_PATH = Path(__file__).parents[1] / "models" / "v1" / "preprocessing.json"


def load_image_config(path: str | Path = DEFAULT_CONFIG_PATH) -> dict[str, Any]:
    config = json.loads(Path(path).read_text(encoding="utf-8"))
    if config.get("image_size") != [224, 224]:
        raise ValueError("The current classifier requires image_size [224, 224]")
    if config.get("color_mode") != "rgb":
        raise ValueError("The current classifier requires RGB input")
    if not np.isclose(float(config.get("external_rescale", 0)), 1.0 / 255.0):
        raise ValueError("The current classifier requires external /255 scaling")
    return config


def _to_rgb(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    if image.ndim == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    if image.ndim != 3:
        raise ValueError("image must have 1, 3, or 4 channels")
    if image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    if image.shape[2] == 4:
        alpha = image[:, :, 3:4].astype(np.float32) / 255.0
        bgr = image[:, :, :3].astype(np.float32)
        composited = (bgr * alpha + 255.0 * (1.0 - alpha)).astype(np.uint8)
        return cv2.cvtColor(composited, cv2.COLOR_BGR2RGB)
    raise ValueError("image must have 1, 3, or 4 channels")


def preprocess_image_array(
    image: NDArray[np.uint8],
    config: Mapping[str, Any] | None = None,
) -> NDArray[np.float32]:
    """Convert an OpenCV image to one 224x224 RGB float32 /255 tensor.

    Aspect ratio is preserved with white letterboxing. Collected BAYA canvases
    are square, so valid collection PNGs take the no-padding square-to-square
    path. Letterboxing is a safeguard for audited legacy inputs.
    """

    settings = dict(config) if config is not None else load_image_config()
    target_height, target_width = settings["image_size"]
    interpolation_name = settings.get("resize_interpolation", "nearest")
    interpolation = {
        "nearest": cv2.INTER_NEAREST,
        "bilinear": cv2.INTER_LINEAR,
        "bicubic": cv2.INTER_CUBIC,
    }.get(interpolation_name)
    if interpolation is None:
        raise ValueError(f"Unsupported resize interpolation: {interpolation_name}")

    rgb = _to_rgb(image)
    source_height, source_width = rgb.shape[:2]
    scale = min(target_width / source_width, target_height / source_height)
    resized_width = max(1, round(source_width * scale))
    resized_height = max(1, round(source_height * scale))
    resized = cv2.resize(rgb, (resized_width, resized_height), interpolation=interpolation)

    pad_value = int(settings.get("pad_value", 255))
    output = np.full((target_height, target_width, 3), pad_value, dtype=np.uint8)
    x_offset = (target_width - resized_width) // 2
    y_offset = (target_height - resized_height) // 2
    output[
        y_offset : y_offset + resized_height,
        x_offset : x_offset + resized_width,
    ] = resized
    return output.astype(np.float32) * float(settings["external_rescale"])


def preprocess_png(
    path: str | Path,
    config_path: str | Path = DEFAULT_CONFIG_PATH,
) -> NDArray[np.float32]:
    image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError(f"Could not read PNG: {path}")
    return preprocess_image_array(image, load_image_config(config_path))
