#!/usr/bin/env python
"""Prove provenance for extra ONNX inputs and run the saved parity cases."""

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


ROOT = Path(__file__).resolve().parents[3]
TOOL_DIR = Path(__file__).resolve().parent
SOURCE_MODEL = ROOT / "Baybayin_EfficientNetB0_BiLSTM_1.0.keras"
ONNX_PATH = TOOL_DIR / "artifacts" / "Baybayin_EfficientNetB0_BiLSTM_1.0.onnx"
REFERENCE_PATH = TOOL_DIR / "artifacts" / "reference_cases.npz"
REPORT_PATH = TOOL_DIR / "artifacts" / "parity_report.json"
EXPECTED_CAPTURE_NAMES = {
    "BAYA_EfficientNetB0_BiLSTM_1/efficientnetb0_1/normalization_1/Sub/y:0": "mean",
    "BAYA_EfficientNetB0_BiLSTM_1/efficientnetb0_1/normalization_1/Sqrt/x:0": "variance",
}


def tensor_shape(value_info: Any) -> list[int | None]:
    return [int(dim) if dim else None for dim in value_info.type.tensor_type.shape.dim]


def main() -> int:
    model = keras.models.load_model(SOURCE_MODEL, compile=False)
    efficientnet = next(
        layer for layer in model.layers
        if isinstance(layer, keras.Model) and "efficientnetb0" in layer.name.lower()
    )
    normalization = next(layer for layer in efficientnet.layers if layer.__class__.__name__ == "Normalization")
    weights = {getattr(weight, "path", weight.name).rsplit("/", 1)[-1]: np.asarray(weight) for weight in normalization.weights}
    if not {"mean", "variance"}.issubset(weights):
        raise RuntimeError(f"Normalization layer does not expose mean and variance weights: {list(weights)}")

    @tf.function(input_signature=[
        tf.TensorSpec([1, 96, 96, 1], tf.float32, name="image_input"),
        tf.TensorSpec([1, 512, 6], tf.float32, name="sequence_input"),
    ])
    def inference(image_input: tf.Tensor, sequence_input: tf.Tensor) -> tf.Tensor:
        return model([image_input, sequence_input], training=False)

    concrete = inference.get_concrete_function()
    capture_map: dict[str, np.ndarray] = {}
    captured_summary: list[dict[str, Any]] = []
    resource_count = 0
    for external, internal in concrete.graph.captures:
        if external.dtype == tf.resource:
            resource_count += 1
            continue
        value = np.asarray(external.numpy())
        capture_map[internal.name] = value
        captured_summary.append({
            "externalDtype": external.dtype.name,
            "internalGraphTensor": internal.name,
            "shape": list(value.shape),
            "dtype": str(value.dtype),
            "value": value.tolist() if value.size <= 32 else None,
        })

    graph = onnx.load(str(ONNX_PATH))
    onnx.checker.check_model(graph)
    initializer_names = {item.name for item in graph.graph.initializer}
    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    session_inputs = session.get_inputs()
    session_outputs = session.get_outputs()
    graph_consumers = {
        item.name: [node for node in graph.graph.node if item.name in node.input]
        for item in graph.graph.input
    }
    normalization_nodes = [
        {"opType": node.op_type, "nodeName": node.name, "inputs": list(node.input), "outputs": list(node.output)}
        for node in graph.graph.node if "normalization_1" in node.name.lower()
    ]

    print("ONNX graph inputs and direct consumers:")
    onnx_inputs: list[dict[str, Any]] = []
    for item in session_inputs:
        value_info = next(value for value in graph.graph.input if value.name == item.name)
        consumers = graph_consumers[item.name]
        summary = {
            "name": item.name,
            "shape": item.shape,
            "dtype": item.type,
            "alsoInitializer": item.name in initializer_names,
            "consumers": [{"opType": node.op_type, "nodeName": node.name, "inputs": list(node.input), "outputs": list(node.output)} for node in consumers],
        }
        onnx_inputs.append(summary)
        print(json.dumps(summary, indent=2))

    if len(session_inputs) != 4 or len(session_outputs) != 1:
        raise RuntimeError(f"Expected the diagnostic graph's four inputs and one output; received {len(session_inputs)} and {len(session_outputs)}.")

    print("Original Keras EfficientNet normalization layer:")
    print(json.dumps({
        "path": f"{efficientnet.name}/{normalization.name}",
        "class": normalization.__class__.__name__,
        "axis": list(normalization.axis),
        "weights": {name: {"shape": list(value.shape), "dtype": str(value.dtype), "value": value.tolist()} for name, value in weights.items() if name in ("mean", "variance")},
    }, indent=2))
    print(f"Concrete function: {len(concrete.inputs)} flat inputs ({len(concrete.inputs) - 2} captures), {len(concrete.captured_inputs)} captured tensors, {resource_count} resource captures.")
    print("Non-resource concrete captures:")
    print(json.dumps(captured_summary, indent=2))
    print("ONNX nodes with the source normalization scope in their names:")
    print(json.dumps(normalization_nodes, indent=2))

    input_names = {item.name for item in session_inputs}
    feed_values: dict[str, np.ndarray] = {}
    provenance: list[dict[str, Any]] = []
    for onnx_name, weight_name in EXPECTED_CAPTURE_NAMES.items():
        if onnx_name not in input_names:
            raise RuntimeError(f"Expected ONNX graph input is absent: {onnx_name}")
        captured = capture_map.get(onnx_name)
        if captured is None:
            raise RuntimeError(f"No non-resource concrete-function capture maps to ONNX input {onnx_name}.")
        source_weight = weights[weight_name].astype(np.float32).reshape(1, 1, 1, 3)
        if captured.shape != (1, 1, 1, 3) or captured.dtype != np.float32 or not np.array_equal(captured, source_weight):
            raise RuntimeError(f"Concrete capture {onnx_name} does not exactly equal Keras normalization/{weight_name}.")
        feed_values[onnx_name] = captured
        provenance.append({
            "onnxInputName": onnx_name,
            "sourceTensor": f"{efficientnet.name}/{normalization.name}/{weight_name}",
            "sourceConcreteGraphTensor": onnx_name,
            "semanticMeaning": "channel-wise normalization mean" if weight_name == "mean" else "channel-wise normalization variance (input to sqrt)",
            "shape": list(captured.shape),
            "dtype": str(captured.dtype),
            "values": captured.tolist(),
            "mappingJustification": "ConcreteFunction.graph.captures maps this internal graph tensor to a non-resource captured tensor whose float32 values exactly equal the named original Keras Normalization layer weight.",
            "onnxConsumerCount": len(graph_consumers[onnx_name]),
            "onnxConsumers": [{"opType": node.op_type, "nodeName": node.name} for node in graph_consumers[onnx_name]],
            "onnxAlsoInitializer": onnx_name in initializer_names,
        })

    if not all(len(graph_consumers[name]) == 0 and name not in initializer_names for name in EXPECTED_CAPTURE_NAMES):
        raise RuntimeError("The expected exporter behavior changed: normalization feeds are not unused graph inputs.")

    reference_data = np.load(REFERENCE_PATH)
    cases: list[dict[str, Any]] = []
    for active_length in (32, 128, 256, 512):
        image = reference_data[f"image_{active_length}"]
        sequence = reference_data[f"sequence_{active_length}"]
        keras_output = reference_data[f"keras_output_{active_length}"]
        image_input = next(item for item in session_inputs if item.shape == [1, 96, 96, 1])
        sequence_input = next(item for item in session_inputs if item.shape == [1, 512, 6])
        feeds = {image_input.name: image, sequence_input.name: sequence, **feed_values}
        onnx_output = session.run([session_outputs[0].name], feeds)[0]
        delta = np.abs(keras_output - onnx_output)
        entry = {
            "activeSequenceLength": active_length,
            "kerasOutputShape": list(keras_output.shape),
            "onnxOutputShape": list(onnx_output.shape),
            "kerasProbabilitySum": float(keras_output.sum()),
            "onnxProbabilitySum": float(onnx_output.sum()),
            "allFinite": bool(np.isfinite(keras_output).all() and np.isfinite(onnx_output).all()),
            "kerasArgmax": int(keras_output.argmax()),
            "onnxArgmax": int(onnx_output.argmax()),
            "top1Match": bool(keras_output.argmax() == onnx_output.argmax()),
            "maxAbsoluteDifference": float(delta.max()),
            "meanAbsoluteDifference": float(delta.mean()),
        }
        cases.append(entry)
        print("PARITY", json.dumps(entry))

    global_max = max(item["maxAbsoluteDifference"] for item in cases)
    all_top1 = all(item["top1Match"] for item in cases)
    all_shapes = all(item["kerasOutputShape"] == [1, 63] and item["onnxOutputShape"] == [1, 63] for item in cases)
    all_finite = all(item["allFinite"] for item in cases)
    passed = all_shapes and all_finite and all_top1 and global_max <= 1e-4

    report = {
        "sourceModel": SOURCE_MODEL.name,
        "sourceModelBytes": SOURCE_MODEL.stat().st_size,
        "kerasVersion": keras.__version__,
        "tensorflowVersion": tf.__version__,
        "onnxVersion": onnx.__version__,
        "onnxRuntimeVersion": ort.__version__,
        "exportMethod": os.environ.get("BAYA_ONNX_EXPORT_METHOD", "keras.Model.export(format='onnx')"),
        "opset": 18,
        "onnxFileBytes": ONNX_PATH.stat().st_size,
        "onnxInputs": onnx_inputs,
        "onnxNormalizationContextNodes": normalization_nodes,
        "onnxOutputs": [{"name": item.name, "shape": item.shape, "dtype": item.type} for item in session_outputs],
        "onnxExecutionProviders": session.get_providers(),
        "inputContract": {
            "logicalPublicInputs": [
                {"name": "image_input", "shape": [1, 96, 96, 1], "dtype": "float32"},
                {"name": "sequence_input", "shape": [1, 512, 6], "dtype": "float32"},
            ],
            "staticCapturedInternalInputs": provenance,
            "extraGraphInputsAreConsumedByOnnxNodes": False,
        },
        "concreteFunction": {
            "inputCountIncludingCaptures": len(concrete.inputs),
            "capturedTensorCount": len(concrete.captured_inputs),
            "resourceCaptureCount": resource_count,
            "nonResourceCaptures": captured_summary,
        },
        "cases": cases,
        "globalMaximumAbsoluteDifference": global_max,
        "allTop1Match": all_top1,
        "allOutputShapesValid": all_shapes,
        "allOutputsFinite": all_finite,
        "contractValid": True,
        "constantProvenanceProven": True,
        "passed": passed,
        "decision": "FOUR_INPUT_NUMERICAL_PARITY_PASS" if passed else "STOP_NUMERICAL_PARITY_FAIL",
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"GLOBAL_MAX_ABS={global_max:.9g}; allTop1Match={all_top1}; PASS={passed}")
    return 0 if passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
