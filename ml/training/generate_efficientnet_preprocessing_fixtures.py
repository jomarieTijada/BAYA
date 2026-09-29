"""Generate deterministic fixtures from the authoritative EfficientNet notebook.

Run from the repository root with a Python environment containing NumPy and
Pillow. Only the preprocessing definitions are executed; the notebook itself
is never run, so training and data-export side effects cannot occur.
"""

from __future__ import annotations

import ast
import hashlib
import json
import math
from pathlib import Path
import re
from typing import Any

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
FIXTURE_ROOT = ROOT / "apps" / "mobile" / "ml" / "__tests__" / "fixtures" / "efficientnet-v1"
NOTEBOOK = ROOT / "ml" / "training" / "EfficientNet_B0–BiLSTM.ipynb"


def notebook_cell(notebook: dict[str, Any], index: int) -> str:
    return "".join(notebook["cells"][index]["source"])


def execute_definitions(source: str, namespace: dict[str, Any], names: set[str]) -> None:
    tree = ast.parse(source)
    selected: list[ast.stmt] = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names:
            selected.append(node)
        elif isinstance(node, ast.Assign):
            targets = {target.id for target in node.targets if isinstance(target, ast.Name)}
            if targets & names:
                selected.append(node)
    exec(compile(ast.Module(body=selected, type_ignores=[]), str(NOTEBOOK), "exec"), namespace)


def assigned_literals(source: str, names: set[str]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for node in ast.parse(source).body:
        if not isinstance(node, ast.Assign):
            continue
        try:
            value = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            continue
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in names:
                result[target.id] = value
    return result


def class_labels_from_notebook(notebook: dict[str, Any]) -> list[str]:
    source = notebook_cell(notebook, 41)
    group_names = {"vowels", "base_consonants", "a_forms", "ei_forms", "ou_forms"}
    nodes = []
    for node in ast.parse(source).body:
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id in group_names for target in node.targets
        ):
            nodes.append(node)
    namespace: dict[str, Any] = {}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(NOTEBOOK), "exec"), namespace)
    grouped = sum((namespace[name] for name in ("vowels", "base_consonants", "a_forms", "ei_forms", "ou_forms")), [])
    labels = sorted(grouped)
    if len(labels) != 63 or len(set(labels)) != 63:
        raise ValueError("Notebook cell 41 class groups are not 63 unique labels")

    cell15_output = "\n".join(
        "".join(output.get("text", []))
        for output in notebook["cells"][15].get("outputs", [])
    )
    first_twenty = re.findall(r"^(.+?)\s+->\s+(\d+)$", cell15_output, re.MULTILINE)
    if [(label.strip(), int(index)) for label, index in first_twenty] != [(label, index) for index, label in enumerate(labels[:20])]:
        raise ValueError("Sorted labels do not match notebook cell 15's executed first-20 mapping")

    cell41_output = "\n".join(
        "".join(output.get("text", []))
        for output in notebook["cells"][41].get("outputs", [])
    )
    for field in ("Missing labels", "Extra labels", "Duplicates"):
        if not re.search(rf"{field}:\s+0", cell41_output):
            raise ValueError(f"Notebook cell 41 output does not verify {field.lower()} = 0")
    if "All 63 classes are correctly grouped exactly once" not in cell41_output:
        raise ValueError("Notebook cell 41 did not record successful class-group validation")
    return labels


def image_fixture(name: str) -> tuple[int, int, bytes]:
    width, height = 123, 97
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if name == "blank-image":
        image = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    elif name == "kudlit-above":
        draw.line([(52, 27), (52, 70), (74, 50)], fill=(20, 20, 20, 255), width=5)
        draw.ellipse((78, 17, 85, 24), fill=(0, 0, 0, 255))
    elif name == "kudlit-below":
        draw.line([(52, 18), (52, 62), (75, 43)], fill=(0, 0, 0, 255), width=5)
        draw.ellipse((80, 73, 87, 80), fill=(0, 0, 0, 255))
    elif name == "narrow-tall":
        draw.line([(60, 10), (61, 84)], fill=(0, 0, 0, 255), width=2)
    elif name == "wide":
        draw.line([(8, 47), (114, 48)], fill=(0, 0, 0, 255), width=3)
    elif name == "tiny-edge":
        draw.point((0, 0), fill=(0, 0, 0, 255))
        draw.point((122, 96), fill=(0, 0, 0, 255))
    elif name == "alpha-gray":
        draw.line([(17, 80), (40, 21), (64, 79), (103, 30)], fill=(0, 0, 0, 173), width=7)
        draw.ellipse((52, 8, 58, 14), fill=(25, 25, 25, 120))
    elif name == "single-stroke":
        draw.line([(34, 76), (39, 31), (76, 23), (88, 67)], fill=(0, 0, 0, 255), width=6)
    elif name == "multi-stroke":
        draw.line([(31, 70), (54, 24)], fill=(0, 0, 0, 255), width=5)
        draw.line([(54, 24), (82, 72)], fill=(0, 0, 0, 255), width=5)
        draw.line([(42, 53), (73, 51)], fill=(0, 0, 0, 255), width=4)
    else:
        raise ValueError(f"unknown image fixture: {name}")
    rgba = image.tobytes()
    return width, height, rgba


def points_line(count: int, x0: float, y0: float, dx: float, dy: float, t0: float, dt: float) -> list[dict[str, float]]:
    return [
        {"x": x0 + dx * index, "y": y0 + dy * index, "t": t0 + dt * index}
        for index in range(count)
    ]


def sequence_fixture(name: str) -> dict[str, Any]:
    if name == "single-stroke":
        strokes = [{"points": points_line(31, 12, 88, 1.7, -2.3, 0, 8)}]
        duration = 300
    elif name == "multi-stroke":
        strokes = [
            {"points": points_line(9, 0, 35, 5.5, 1.4, 0, 8)},
            {"points": points_line(8, 70, 20, -4.2, 2.5, 110, 9)},
            {"points": points_line(5, 23, 82, 2.7, -5.1, 230, 7)},
        ]
        duration = 270
    elif name in {"kudlit-above", "kudlit-below"}:
        dot_y = 4 if name == "kudlit-above" else 85
        strokes = [
            {"points": points_line(15, 18, 25, 3.1, 2.2, 0, 7)},
            {"points": points_line(2, 72, dot_y, 0.5, 0.5, 150, 11)},
        ]
        duration = 180
    elif name == "narrow-tall":
        strokes = [{"points": points_line(40, 19, 0, 0.3, 2.4, 0, 4)}]
        duration = 160
    elif name == "wide":
        strokes = [{"points": points_line(41, 0, 38, 2.5, 0.2, 0, 5)}]
        duration = 200
    elif name == "short-sequence":
        strokes = [{"points": points_line(3, 2, 8, 8, 3, 0, 14)}]
        duration = 28
    elif name == "tiny-edge":
        strokes = [{"points": [{"x": 0.0, "y": 0.0, "t": 0.0}, {"x": 0.1, "y": 0.1, "t": 4.0}]}]
        duration = 8
    elif name == "alpha-gray":
        strokes = [{"points": points_line(6, 17, 80, 10.2, -10.0, 0, 5)}]
        duration = 30
    elif name == "exact-512":
        strokes = [{"points": points_line(512, 0, 20, 0.17, math.sin(0.07), 0, 2)}]
        duration = 1100
    elif name == "over-512":
        strokes = [
            {"points": points_line(301, 0, 0, 0.4, 0.15, 0, 2)},
            {"points": points_line(277, 121, 90, -0.3, -0.12, 610, 2)},
        ]
        duration = 1200
    elif name == "many-strokes-downsampling":
        strokes = [
            {"points": points_line(90 + (i % 7), i * 3.0, (i % 5) * 11.0, 0.35, (-1) ** i * 0.23, i * 17.0, 1.5)}
            for i in range(8)
        ]
        duration = 1000
    elif name == "zero-duration":
        strokes = [
            {"points": points_line(4, 0, 0, 4.1, 3.4, 50, 8)},
            {"points": points_line(3, 25, 20, -2.4, 1.0, 44, 9)},
        ]
        duration = 0
    elif name == "degenerate-duration":
        strokes = [{"points": [{"x": 7.25, "y": -3.5, "t": 4.0} for _ in range(3)]}]
        duration = -5
    elif name == "blank-image":
        strokes = []
        duration = None
    else:
        raise ValueError(f"unknown sequence fixture: {name}")
    return {"duration_ms": duration, "strokes": strokes}


def main() -> None:
    if not NOTEBOOK.exists():
        raise FileNotFoundError(f"Authoritative notebook not found: {NOTEBOOK}")
    notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
    constants = {}
    for cell_index, names in (
        (3, {"IMG_HEIGHT", "IMG_WIDTH", "IMG_CHANNELS", "SEQ_FEATURES", "MAX_SEQ_LEN"}),
        (17, {"IMAGE_PADDING_RATIO", "INK_THRESHOLD"}),
        (19, {"TRAJECTORY_PADDING_RATIO"}),
    ):
        constants.update(assigned_literals(notebook_cell(notebook, cell_index), names))
    expected_constants = {
        "IMG_HEIGHT": 96, "IMG_WIDTH": 96, "IMG_CHANNELS": 1, "SEQ_FEATURES": 6,
        "MAX_SEQ_LEN": 512, "IMAGE_PADDING_RATIO": 0.15, "INK_THRESHOLD": 0.08,
        "TRAJECTORY_PADDING_RATIO": 0.15,
    }
    if constants != expected_constants:
        raise ValueError(f"Notebook preprocessing constants differ from the audited values: {constants}")

    labels = class_labels_from_notebook(notebook)
    notebook_text = NOTEBOOK.read_bytes()
    metadata_cell = notebook_cell(notebook, 51)
    metadata_fields = (
        "image_height", "image_width", "image_channels", "image_background_rule",
        "image_position_scale_normalization", "efficientnet_input_conversion",
        "efficientnet_input_scale", "efficientnet_builtin_preprocessing",
        "max_sequence_length", "sequence_features", "trajectory_position_scale_normalization",
        "sequence_overflow_rule", "group_split",
    )
    if any(f'"{field}"' not in metadata_cell for field in metadata_fields):
        raise ValueError("Notebook cell 51 is missing one or more expected preprocessing metadata fields")
    metadata_dict = None
    for node in ast.walk(ast.parse(metadata_cell)):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "dump":
            if node.args and isinstance(node.args[0], ast.Dict):
                keys = [ast.literal_eval(key) for key in node.args[0].keys]
                if "image_height" in keys and "sequence_features" in keys:
                    metadata_dict = node.args[0]
                    break
    if metadata_dict is None:
        raise ValueError("Could not locate the preprocessing metadata dictionary in notebook cell 51")
    metadata_values: dict[str, Any] = {}
    for key_node, value_node in zip(metadata_dict.keys, metadata_dict.values):
        key = ast.literal_eval(key_node)
        if key not in metadata_fields or key == "group_split":
            continue
        try:
            value = ast.literal_eval(value_node)
        except (ValueError, TypeError):
            if isinstance(value_node, ast.Name) and value_node.id in constants:
                value = constants[value_node.id]
            else:
                raise ValueError(f"Could not resolve notebook metadata value for {key}")
        metadata_values[key] = value
    if set(metadata_values) != set(metadata_fields) - {"group_split"}:
        raise ValueError("Could not extract every preprocessing metadata value from notebook cell 51")

    FIXTURE_ROOT.mkdir(parents=True, exist_ok=True)
    mapping = {label: index for index, label in enumerate(labels)}
    (FIXTURE_ROOT / "class-mapping.json").write_text(
        json.dumps({"class_labels": labels, "label_to_id": mapping, "sourceNotebook": NOTEBOOK.name, "mappingCell": 15, "validatedAgainstCell": 41}, indent=2) + "\n",
        encoding="utf-8",
    )
    (FIXTURE_ROOT / "notebook-audit.json").write_text(
        json.dumps({
            "sourceNotebook": NOTEBOOK.name,
            "sourceNotebookSha256": hashlib.sha256(notebook_text).hexdigest(),
            "imageFunctionCell": 17,
            "sequenceFunctionCell": 19,
            "labelsCell": 15,
            "metadataCell": 51,
            "constants": constants,
            "metadataFields": list(metadata_fields),
            "preprocessingMetadata": metadata_values,
            "groupSplitMetadataKeys": ["train_exports", "validation_exports", "test_exports"],
            "metadataVerifiedInSource": True,
            "classGroupValidationFromExecutedCell41": {"count": len(labels), "missing": 0, "extra": 0, "duplicates": 0},
        }, indent=2) + "\n",
        encoding="utf-8",
    )
    ns: dict[str, Any] = {
        "np": np,
        "Image": Image,
        "Path": Path,
        "IMG_HEIGHT": 96,
        "IMG_WIDTH": 96,
        "SEQ_FEATURES": 6,
        "MAX_SEQ_LEN": 512,
    }
    execute_definitions(notebook_cell(notebook, 17), ns, {"IMAGE_PADDING_RATIO", "INK_THRESHOLD", "load_image_array"})
    execute_definitions(
        notebook_cell(notebook, 19),
        ns,
        {"TRAJECTORY_PADDING_RATIO", "allocate_points_per_stroke", "select_evenly", "get_trajectory_transform", "build_sequence"},
    )

    names = [
        "single-stroke", "multi-stroke", "kudlit-above", "kudlit-below",
        "narrow-tall", "wide", "tiny-edge", "alpha-gray", "short-sequence",
        "exact-512", "over-512", "many-strokes-downsampling", "zero-duration",
        "degenerate-duration", "blank-image",
    ]
    for name in names:
        folder = FIXTURE_ROOT / name
        folder.mkdir(parents=True, exist_ok=True)
        width, height, rgba = image_fixture(name if name in {"single-stroke", "multi-stroke", "kudlit-above", "kudlit-below", "narrow-tall", "wide", "tiny-edge", "alpha-gray", "blank-image"} else "blank-image")
        (folder / "input.rgba").write_bytes(rgba)
        Image.frombytes("RGBA", (width, height), rgba).save(folder / "source.png")
        (folder / "input.json").write_text(
            json.dumps({"width": width, "height": height, **sequence_fixture(name)}, separators=(",", ":")),
            encoding="utf-8",
        )
        image = ns["load_image_array"](folder / "source.png")
        sequence = ns["build_sequence"](json.loads((folder / "input.json").read_text(encoding="utf-8")))
        image.astype("<f4", copy=False).tofile(folder / "image.f32")
        sequence.astype("<f4", copy=False).tofile(folder / "sequence.f32")
        (folder / "shape.json").write_text(
            json.dumps({"image": list(image.shape), "sourceImage": {"width": width, "height": height}, "sequence": list(sequence.shape), "dtype": "float32", "sourceNotebook": NOTEBOOK.name, "imageCell": 17, "sequenceCell": 19}, indent=2) + "\n",
            encoding="utf-8",
        )
    print(f"Generated {len(names)} notebook-backed fixtures at {FIXTURE_ROOT}")


if __name__ == "__main__":
    main()
