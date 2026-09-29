#!/usr/bin/env python
"""Export the authoritative Keras 3 model and enforce strict ONNX parity."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_NUM_INTRAOP_THREADS", "2")
os.environ.setdefault("TF_NUM_INTEROP_THREADS", "2")

import keras
import numpy as np
import onnx
import onnxruntime as ort
import tensorflow as tf
import tf2onnx


ROOT = Path(__file__).resolve().parents[3]
SOURCE_MODEL = ROOT / "Baybayin_EfficientNetB0_BiLSTM_1.0.keras"
OUTPUT_DIR = Path(__file__).resolve().parent / "artifacts"
ONNX_PATH = OUTPUT_DIR / "Baybayin_EfficientNetB0_BiLSTM_1.0.onnx"
REFERENCE_PATH = OUTPUT_DIR / "reference_cases.npz"
REPORT_PATH = OUTPUT_DIR / "parity_report.json"
OPSET = 18
ACTIVE_LENGTHS = (32, 128, 256, 512)

EXPECTED_INPUT_SHAPES = {(None, 96, 96, 1), (None, 512, 6)}
EXPECTED_OUTPUT_SHAPE = (None, 63)


def shape_tuple(tensor: Any) -> tuple[int | None, ...]:
    return tuple(None if dim is None else int(dim) for dim in tensor.shape)


def tensor_description(tensors: list[Any]) -> list[dict[str, Any]]:
    return [
        {"name": tensor.name, "shape": list(shape_tuple(tensor)), "dtype": str(tensor.dtype)}
        for tensor in tensors
    ]


def validate_model_contract(model: keras.Model) -> tuple[int, int]:
    shapes = [shape_tuple(item) for item in model.inputs]
    if len(model.inputs) != 2 or set(shapes) != EXPECTED_INPUT_SHAPES:
        raise ValueError(f"Expected exactly the two input shapes {EXPECTED_INPUT_SHAPES}; got {shapes}.")
    if any(str(item.dtype) != "float32" for item in model.inputs):
        raise ValueError(f"Expected float32 input dtypes; got {[str(i.dtype) for i in model.inputs]}.")
    if len(model.outputs) != 1 or shape_tuple(model.outputs[0]) != EXPECTED_OUTPUT_SHAPE:
        raise ValueError(
            f"Expected one output with shape {EXPECTED_OUTPUT_SHAPE}; got "
            f"{[shape_tuple(item) for item in model.outputs]}."
        )
    if str(model.outputs[0].dtype) != "float32":
        raise ValueError(f"Expected float32 output; got {model.outputs[0].dtype}.")

    image_index = shapes.index((None, 96, 96, 1))
    sequence_index = shapes.index((None, 512, 6))
    print("Detected Keras contract:")
    print(json.dumps({"inputs": tensor_description(model.inputs), "outputs": tensor_description(model.outputs)}, indent=2))
    return image_index, sequence_index


def make_cases() -> dict[int, tuple[np.ndarray, np.ndarray]]:
    rng = np.random.default_rng(42)
    cases: dict[int, tuple[np.ndarray, np.ndarray]] = {}
    for active_length in ACTIVE_LENGTHS:
        image = rng.uniform(0.0, 1.0, size=(1, 96, 96, 1)).astype(np.float32)
        sequence = np.zeros((1, 512, 6), dtype=np.float32)
        active = sequence[0, :active_length]
        active[:, 0:2] = rng.uniform(0.0, 1.0, size=(active_length, 2)).astype(np.float32)
        active[:, 2:4] = rng.uniform(-1.0, 1.0, size=(active_length, 2)).astype(np.float32)
        active[:, 4] = rng.uniform(0.0, 1.0, size=active_length).astype(np.float32)
        active[:, 5] = 0.0
        active[0, 5] = 1.0
        for stroke_start in (active_length // 3, (2 * active_length) // 3):
            if stroke_start > 0:
                active[stroke_start, 5] = 1.0
        cases[active_length] = (image, sequence)
    return cases


def evaluate_keras(
    model: keras.Model,
    cases: dict[int, tuple[np.ndarray, np.ndarray]],
    image_index: int,
    sequence_index: int,
) -> dict[int, np.ndarray]:
    outputs: dict[int, np.ndarray] = {}
    archive: dict[str, np.ndarray] = {}
    for active_length, (image, sequence) in cases.items():
        ordered: list[np.ndarray | None] = [None, None]
        ordered[image_index] = image
        ordered[sequence_index] = sequence
        prediction = np.asarray(model(ordered, training=False), dtype=np.float32)
        if prediction.shape != (1, 63):
            raise ValueError(f"Keras output for length {active_length} has shape {prediction.shape}, expected [1,63].")
        if not np.isfinite(prediction).all():
            raise ValueError(f"Keras output for length {active_length} contains non-finite values.")
        probability_sum = float(prediction.sum())
        if np.any(prediction < -1e-6) or np.any(prediction > 1.0 + 1e-6) or abs(probability_sum - 1.0) > 1e-3:
            raise ValueError(f"Keras output for length {active_length} is not a sensible probability vector: sum={probability_sum}.")
        outputs[active_length] = prediction
        archive[f"image_{active_length}"] = image
        archive[f"sequence_{active_length}"] = sequence
        archive[f"keras_output_{active_length}"] = prediction
        print(f"Keras reference length={active_length}: shape={list(prediction.shape)}, sum={probability_sum:.9f}, argmax={int(prediction.argmax())}")
    np.savez_compressed(REFERENCE_PATH, **archive)
    return outputs


def export_model(model: keras.Model, output_path: Path = ONNX_PATH) -> str:
    signature = [
        tf.TensorSpec([1, 96, 96, 1], tf.float32, name="image_input"),
        tf.TensorSpec([1, 512, 6], tf.float32, name="sequence_input"),
    ]
    if output_path.exists():
        output_path.unlink()
    try:
        model.export(
            str(output_path),
            format="onnx",
            # A Functional model's call signature is one `inputs` argument
            # containing two tensors. Wrap that input list as one argument;
            # a flat signature is interpreted as (inputs, training).
            input_signature=(signature,),
            opset_version=OPSET,
            verbose=False,
        )
        print(f"Export method: Keras 3 model.export(format='onnx'), opset {OPSET}")
        return "keras.Model.export(format='onnx')"
    except Exception as keras_error:
        print(f"Keras ONNX convenience export failed: {type(keras_error).__name__}: {keras_error}")
        if output_path.exists():
            output_path.unlink()

    @tf.function(input_signature=signature)
    def inference(image_input: tf.Tensor, sequence_input: tf.Tensor) -> tf.Tensor:
        return model([image_input, sequence_input], training=False)

    try:
        tf2onnx.convert.from_function(
            inference,
            input_signature=signature,
            opset=OPSET,
            output_path=str(output_path),
        )
    except Exception as fallback_error:
        raise RuntimeError(
            "Both direct Keras 3 ONNX export and tf2onnx conversion of the same loaded model failed. "
            f"Keras error: {type(keras_error).__name__}: {keras_error}; "
            f"tf2onnx error: {type(fallback_error).__name__}: {fallback_error}"
        ) from fallback_error
    print(f"Export method: tf2onnx.convert.from_function(original_model), opset {OPSET}")
    return "tf2onnx.convert.from_function(original_model)"


def onnx_shape(value_info: Any) -> list[int | None]:
    if hasattr(value_info, "shape"):
        return [int(dim) if isinstance(dim, (int, np.integer)) else None for dim in value_info.shape]
    shape: list[int | None] = []
    for dim in value_info.type.tensor_type.shape.dim:
        shape.append(int(dim.dim_value) if dim.dim_value else None)
    return shape


def validate_and_compare(
    keras_outputs: dict[int, np.ndarray],
    cases: dict[int, tuple[np.ndarray, np.ndarray]],
) -> dict[str, Any]:
    graph = onnx.load(str(ONNX_PATH))
    onnx.checker.check_model(graph)
    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    inputs = session.get_inputs()
    outputs = session.get_outputs()
    report: dict[str, Any] = {
        "onnxInputs": [{"name": item.name, "shape": onnx_shape(item), "dtype": item.type} for item in inputs],
        "onnxOutputs": [{"name": item.name, "shape": onnx_shape(item), "dtype": item.type} for item in outputs],
        "executionProviders": session.get_providers(),
        "cases": [],
        "globalMaximumAbsoluteDifference": None,
        "allTop1Match": None,
        "contractValid": False,
        "passed": False,
    }
    if len(inputs) != 2 or len(outputs) != 1:
        report["failure"] = {
            "stage": "ONNX contract validation",
            "expectedInputCount": 2,
            "actualInputCount": len(inputs),
            "expectedOutputCount": 1,
            "actualOutputCount": len(outputs),
        }
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report

    image_inputs = [item for item in inputs if onnx_shape(item) == [1, 96, 96, 1] and item.type == "tensor(float)"]
    sequence_inputs = [item for item in inputs if onnx_shape(item) == [1, 512, 6] and item.type == "tensor(float)"]
    if len(image_inputs) != 1 or len(sequence_inputs) != 1:
        report["failure"] = {
            "stage": "ONNX contract validation",
            "message": "Could not identify exactly one image input and one sequence input by shape and float32 dtype.",
        }
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report
    image_input, sequence_input = image_inputs[0], sequence_inputs[0]
    if onnx_shape(outputs[0]) != [1, 63] or outputs[0].type != "tensor(float)":
        raise ValueError(f"Expected ONNX output [1,63] float32; got {outputs[0].name} {onnx_shape(outputs[0])} {outputs[0].type}.")

    reports: list[dict[str, Any]] = []
    all_top1_match = True
    global_max = 0.0
    for active_length, (image, sequence) in cases.items():
        actual = session.run([outputs[0].name], {image_input.name: image, sequence_input.name: sequence})[0]
        expected = keras_outputs[active_length]
        if actual.shape != (1, 63) or not np.isfinite(actual).all():
            raise ValueError(f"ONNX output failed shape/finite checks for length {active_length}: shape={actual.shape}.")
        delta = np.abs(expected - actual)
        max_abs = float(delta.max())
        mean_abs = float(delta.mean())
        keras_argmax = int(expected.argmax())
        onnx_argmax = int(actual.argmax())
        top1_match = keras_argmax == onnx_argmax
        probability_sum = float(actual.sum())
        all_top1_match &= top1_match
        global_max = max(global_max, max_abs)
        reports.append({
            "activeSequenceLength": active_length,
            "outputShape": list(actual.shape),
            "maxAbsoluteDifference": max_abs,
            "meanAbsoluteDifference": mean_abs,
            "kerasArgmax": keras_argmax,
            "onnxArgmax": onnx_argmax,
            "top1Match": top1_match,
            "onnxProbabilitySum": probability_sum,
            "onnxFinite": bool(np.isfinite(actual).all()),
        })
        print(
            f"Parity length={active_length}: max_abs={max_abs:.9g}, mean_abs={mean_abs:.9g}, "
            f"Keras argmax={keras_argmax}, ONNX argmax={onnx_argmax}, sum={probability_sum:.9f}"
        )

    report.update({
        "cases": reports,
        "globalMaximumAbsoluteDifference": global_max,
        "allTop1Match": all_top1_match,
        "contractValid": True,
        "passed": all_top1_match and global_max <= 1e-4,
    })
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    if not SOURCE_MODEL.is_file():
        raise FileNotFoundError(f"Authoritative source model not found: {SOURCE_MODEL}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Source model: {SOURCE_MODEL}")
    print(f"Source size: {SOURCE_MODEL.stat().st_size} bytes")
    print(f"Keras: {keras.__version__}; TensorFlow: {tf.__version__}; NumPy: {np.__version__}")
    print(f"ONNX: {onnx.__version__}; ONNX Runtime: {ort.__version__}; tf2onnx: {tf2onnx.__version__}")
    model = keras.models.load_model(SOURCE_MODEL, compile=False)
    image_index, sequence_index = validate_model_contract(model)
    cases = make_cases()
    keras_outputs = evaluate_keras(model, cases, image_index, sequence_index)
    method = export_model(model)
    print(f"Export completed with {method}; now proving captured-input provenance and parity.")
    # The Keras exporter currently surfaces two Normalization captures as
    # additional graph inputs. Resolve them from the original model and run
    # the same strict parity suite; never invent feed values.
    os.environ["BAYA_ONNX_EXPORT_METHOD"] = method
    from diagnose_baya_onnx import main as diagnose_and_compare

    return diagnose_and_compare()


if __name__ == "__main__":
    raise SystemExit(main())
