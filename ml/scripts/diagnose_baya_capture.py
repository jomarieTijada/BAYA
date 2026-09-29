"""Compare one opt-in browser capture with notebook preprocessing and ONNX CPU.

From the repository root:
    python -m ml.scripts.diagnose_baya_capture ml/diagnostics/captures/CAPTURE.json

The public command uses the existing system NumPy/Pillow installation. CPU replay
uses the repository's existing ONNX virtual environment in a child process.
Neither path changes model files, training data, or app preprocessing.
"""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
NOTEBOOK = ROOT / "ml" / "training" / "EfficientNet_B0–BiLSTM.ipynb"
MODEL_DIRECTORY = ROOT / "apps" / "mobile" / "public" / "models" / "baya"
ONNX_PYTHON = ROOT / "ml" / "deployment" / "onnx" / ".venv" / "Scripts" / "python.exe"


def load_capture(path: Path) -> dict[str, Any]:
    capture = json.loads(path.read_text(encoding="utf-8"))
    if capture.get("schemaVersion") != 1:
        raise ValueError("Expected BAYA capture schemaVersion 1")
    raster = capture["raster"]
    width, height = raster["width"], raster["height"]
    if (width, height) != (256, 256):
        raise ValueError(f"Unexpected browser raster size: {width}×{height}")
    rgba = base64.b64decode(raster["rgbaBase64"], validate=True)
    if len(rgba) != width * height * 4:
        raise ValueError("Captured RGBA byte length does not match dimensions")
    if len(capture["webInputs"]["image"]) != 96 * 96:
        raise ValueError("Expected 9,216 browser image floats")
    if len(capture["webInputs"]["sequence"]) != 512 * 6:
        raise ValueError("Expected 3,072 browser sequence floats")
    if not capture["predictions"]:
        raise ValueError("Capture has no browser prediction")
    # Captures written before v1.1 did not contain a model version.
    if capture.get("modelVersion", "1.0") not in {"1.0", "1.1"}:
        raise ValueError("Unsupported capture modelVersion")
    capture["_rgba"] = rgba
    return capture


def resolve_capture(path: Path) -> Path:
    if path.is_dir():
        captures = list(path.glob("baya-capture-*.json"))
        if not captures:
            raise FileNotFoundError(f"No BAYA capture JSON found in {path}")
        return max(captures, key=lambda item: item.stat().st_mtime_ns)
    return path


def replay_onnx(path: Path) -> dict[str, Any]:
    import numpy as np
    import onnxruntime as ort

    capture = load_capture(path)
    version = capture.get("modelVersion", "1.0")
    stem = f"Baybayin_EfficientNetB0_BiLSTM_{version}"
    contract = json.loads((MODEL_DIRECTORY / f"{stem}_onnx_contract.json").read_text(encoding="utf-8"))
    labels = json.loads((ROOT / "apps" / "mobile" / "ml" / "__tests__" / "fixtures" / "efficientnet-v1" / "class-mapping.json").read_text(encoding="utf-8"))["class_labels"]
    feeds = {
        contract["logicalInputs"][0]["name"]: np.asarray(capture["webInputs"]["image"], dtype=np.float32).reshape(1, 96, 96, 1),
        contract["logicalInputs"][1]["name"]: np.asarray(capture["webInputs"]["sequence"], dtype=np.float32).reshape(1, 512, 6),
    }
    for item in contract["staticNormalizationInputs"]:
        feeds[item["name"]] = np.asarray(item["values"], dtype=np.float32).reshape(1, 1, 1, 3)
    session = ort.InferenceSession(str(MODEL_DIRECTORY / f"{stem}.onnx"), providers=["CPUExecutionProvider"])
    probabilities = session.run([contract["output"]["name"]], feeds)[0][0]
    order = np.argsort(-probabilities)
    return {
        "modelVersion": version,
        "top3": [{"label": labels[int(i)], "confidence": float(probabilities[i])} for i in order[:3]],
        "expectedRank": int(np.where(order == labels.index(capture["targetClass"]))[0][0]) + 1,
        "expectedConfidence": float(probabilities[labels.index(capture["targetClass"])]),
        "probabilitySum": float(probabilities.sum()),
    }


def compare_notebook(path: Path) -> None:
    import numpy as np
    from PIL import Image
    from ml.training.generate_efficientnet_preprocessing_fixtures import execute_definitions, notebook_cell

    capture = load_capture(path)
    notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
    namespace: dict[str, Any] = {
        "np": np, "Image": Image, "Path": Path,
        "IMG_HEIGHT": 96, "IMG_WIDTH": 96, "SEQ_FEATURES": 6, "MAX_SEQ_LEN": 512,
    }
    execute_definitions(notebook_cell(notebook, 17), namespace, {"IMAGE_PADDING_RATIO", "INK_THRESHOLD", "load_image_array"})
    execute_definitions(
        notebook_cell(notebook, 19), namespace,
        {"TRAJECTORY_PADDING_RATIO", "allocate_points_per_stroke", "select_evenly", "get_trajectory_transform", "build_sequence"},
    )
    with tempfile.TemporaryDirectory() as temporary:
        raster_path = Path(temporary) / "browser-raster.png"
        Image.frombytes("RGBA", (256, 256), capture["_rgba"]).save(raster_path)
        notebook_image = namespace["load_image_array"](raster_path)
    notebook_sequence = namespace["build_sequence"](capture["notebookSequenceRow"])
    web_image = np.asarray(capture["webInputs"]["image"], dtype=np.float32).reshape(96, 96, 1)
    web_sequence = np.asarray(capture["webInputs"]["sequence"], dtype=np.float32).reshape(512, 6)
    image_difference = np.abs(notebook_image - web_image)
    sequence_difference = np.abs(notebook_sequence - web_sequence)
    raw_strokes = capture["normalizedStrokes"]
    point_count = sum(len(stroke) for stroke in raw_strokes)
    active_rows = int(np.count_nonzero(np.any(web_sequence != 0, axis=1)))
    ink_pixels = int(np.count_nonzero(web_image > 0))

    print(f"Capture: {path}")
    print(f"Model: {capture.get('modelVersion', '1.0')} | target: {capture['targetClass']} | browser top-1: {capture['predictions'][0]['label']} ({capture['predictions'][0]['probability']:.2%})")
    print(f"Canvas: {capture['canvas']['width']}x{capture['canvas']['height']} | strokes: {len(raw_strokes)} | points: {point_count} | duration: {capture['notebookSequenceRow']['duration_ms']} ms")
    print(f"Image: {ink_pixels}/9216 ink pixels | Python vs browser max/mean absolute difference: {image_difference.max():.9g}/{image_difference.mean():.9g}")
    print(f"Sequence: {active_rows}/512 active rows | Python vs browser max/mean absolute difference: {sequence_difference.max():.9g}/{sequence_difference.mean():.9g}")
    if image_difference.max() == 0 and sequence_difference.max() == 0:
        print("Preprocessing parity: exact for this captured drawing")
    else:
        print("Preprocessing parity: MISMATCH for this captured drawing")

    if not ONNX_PYTHON.exists():
        print(f"ONNX CPU replay unavailable: missing {ONNX_PYTHON}")
        return
    child = subprocess.run(
        [str(ONNX_PYTHON), "-m", "ml.scripts.diagnose_baya_capture", str(path), "--cpu-replay"],
        cwd=ROOT, text=True, capture_output=True, check=False,
    )
    if child.returncode:
        print(f"ONNX CPU replay unavailable: {child.stderr.strip() or child.stdout.strip()}")
        return
    replay = json.loads(child.stdout)
    print(f"ONNX CPU v{replay['modelVersion']} top-3: " + ", ".join(f"{item['label']} {item['confidence']:.2%}" for item in replay["top3"]))
    print(f"Target rank/confidence on CPU: {replay['expectedRank']} / {replay['expectedConfidence']:.2%}")
    browser_top = capture["predictions"][0]
    cpu_top = replay["top3"][0]
    print(f"Browser vs CPU top-1: {'match' if browser_top['label'] == cpu_top['label'] else 'MISMATCH'}")
    print(f"Browser vs CPU top-1 confidence difference: {abs(browser_top['probability'] - cpu_top['confidence']):.9g}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture", type=Path, help="JSON downloaded with ?bayaCapture=1")
    parser.add_argument("--cpu-replay", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    capture_path = resolve_capture(args.capture)
    if args.cpu_replay:
        print(json.dumps(replay_onnx(capture_path)))
    else:
        compare_notebook(capture_path)


if __name__ == "__main__":
    main()
