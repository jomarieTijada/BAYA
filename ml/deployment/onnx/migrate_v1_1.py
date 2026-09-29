#!/usr/bin/env python
"""Export v1.1 with the proven v1.0 method and gate deployment on parity."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_NUM_INTRAOP_THREADS", "2")
os.environ.setdefault("TF_NUM_INTEROP_THREADS", "2")

import keras
import numpy as np
import onnx
import onnxruntime as ort
import tensorflow as tf

from export_baya_onnx import export_model, make_cases, validate_model_contract


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "Baybayin_EfficientNetB0_BiLSTM_1.1.keras"
ARTIFACTS = Path(__file__).resolve().parent / "artifacts" / "v1.1"
ONNX = ARTIFACTS / "Baybayin_EfficientNetB0_BiLSTM_1.1.onnx"
REPORT = ARTIFACTS / "parity_report.json"
FIXTURES = ROOT / "apps" / "mobile" / "ml" / "__tests__" / "fixtures" / "efficientnet-v1"
CAPTURES = ROOT / "ml" / "diagnostics" / "captures"
THRESHOLD = 1e-4


def shape_of(value: object) -> list[int | None]:
    return [int(dim) if isinstance(dim, int) else None for dim in value.shape]


def tensor_info(value: object) -> dict[str, object]:
    return {"name": value.name, "shape": shape_of(value), "dtype": value.type}


def read_cases() -> list[dict[str, object]]:
    cases: list[dict[str, object]] = []
    for length, (image, sequence) in make_cases().items():
        cases.append({"name": f"deterministic-length-{length}", "trueLabel": None,
                      "image": image, "sequence": sequence, "source": "v1.0 export references"})
    for folder in sorted(FIXTURES.iterdir()):
        if not folder.is_dir() or not (folder / "image.f32").is_file():
            continue
        image = np.fromfile(folder / "image.f32", dtype="<f4").reshape(1, 96, 96, 1)
        sequence = np.fromfile(folder / "sequence.f32", dtype="<f4").reshape(1, 512, 6)
        cases.append({"name": f"notebook-fixture-{folder.name}", "trueLabel": None,
                      "image": image, "sequence": sequence, "source": "authoritative notebook goldens"})
    # Captures are real user drawings. They are optional, ignored by Git, and
    # already contain the exact validated browser tensors; no stroke data is invented.
    for path in sorted(CAPTURES.glob("baya-capture-*.json")) if CAPTURES.is_dir() else []:
        capture = json.loads(path.read_text(encoding="utf-8"))
        if capture.get("schemaVersion") != 1:
            raise ValueError(f"Unknown capture schema in {path}")
        image = np.asarray(capture["webInputs"]["image"], dtype=np.float32).reshape(1, 96, 96, 1)
        sequence = np.asarray(capture["webInputs"]["sequence"], dtype=np.float32).reshape(1, 512, 6)
        cases.append({"name": f"real-capture-{path.stem}", "trueLabel": capture["targetClass"],
                      "image": image, "sequence": sequence, "source": str(path.relative_to(ROOT))})
    if not cases:
        raise RuntimeError("No parity cases are available")
    return cases


def capture_feeds(model: keras.Model, inputs: list[object], graph: object) -> tuple[dict[str, np.ndarray], list[dict[str, object]]]:
    efficientnet = next(layer for layer in model.layers if isinstance(layer, keras.Model) and "efficientnetb0" in layer.name.lower())
    normalization = next(layer for layer in efficientnet.layers if layer.__class__.__name__ == "Normalization")
    weights = {getattr(weight, "path", weight.name).rsplit("/", 1)[-1]: np.asarray(weight)
               for weight in normalization.weights}
    if not {"mean", "variance"}.issubset(weights):
        raise RuntimeError("The source EfficientNet normalization weights are missing")

    signature = [tf.TensorSpec([1, 96, 96, 1], tf.float32, name="image_input"),
                 tf.TensorSpec([1, 512, 6], tf.float32, name="sequence_input")]

    @tf.function(input_signature=signature)
    def inference(image_input: tf.Tensor, sequence_input: tf.Tensor) -> tf.Tensor:
        return model([image_input, sequence_input], training=False)

    concrete = inference.get_concrete_function()
    captures = {internal.name: np.asarray(external.numpy())
                for external, internal in concrete.graph.captures if external.dtype != tf.resource}
    logical = {item.name for item in inputs if shape_of(item) in ([1, 96, 96, 1], [1, 512, 6])}
    feeds: dict[str, np.ndarray] = {}
    provenance: list[dict[str, object]] = []
    used_weights: set[str] = set()
    for item in inputs:
        if item.name in logical:
            continue
        value = captures.get(item.name)
        if value is None or item.type != "tensor(float)" or shape_of(item) != [1, 1, 1, 3]:
            raise RuntimeError(f"Unproven ONNX graph input: {tensor_info(item)}")
        matching = [name for name in ("mean", "variance")
                    if np.array_equal(value, weights[name].astype(np.float32).reshape(1, 1, 1, 3))]
        if len(matching) != 1 or matching[0] in used_weights:
            raise RuntimeError(f"ONNX capture {item.name} does not uniquely match a source normalization weight")
        weight_name = matching[0]
        used_weights.add(weight_name)
        feeds[item.name] = value
        provenance.append({"name": item.name, "source": f"{efficientnet.name}/{normalization.name}/{weight_name}",
                           "values": value.tolist(),
                           "consumerCount": sum(item.name in node.input for node in graph.graph.node)})
    return feeds, provenance


def main() -> int:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Place the trained model at {SOURCE}")
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    labels = json.loads((FIXTURES / "class-mapping.json").read_text(encoding="utf-8"))["class_labels"]
    if len(labels) != 63 or len(set(labels)) != 63:
        raise RuntimeError("The existing EfficientNet class mapping is invalid")
    print(f"Loading source: {SOURCE}")
    model = keras.models.load_model(SOURCE, compile=False)
    image_index, sequence_index = validate_model_contract(model)
    cases = read_cases()
    print(f"Parity cases: {len(cases)} ({sum(case['trueLabel'] is not None for case in cases)} real labeled captures)")

    for case in cases:
        ordered = [None, None]
        ordered[image_index] = case["image"]
        ordered[sequence_index] = case["sequence"]
        prediction = np.asarray(model(ordered, training=False), dtype=np.float32)
        if prediction.shape != (1, 63) or not np.isfinite(prediction).all():
            raise RuntimeError(f"Invalid Keras prediction for {case['name']}")
        case["keras"] = prediction

    method = export_model(model, ONNX)
    graph = onnx.load(str(ONNX))
    onnx.checker.check_model(graph)
    session = ort.InferenceSession(str(ONNX), providers=["CPUExecutionProvider"])
    inputs, outputs = session.get_inputs(), session.get_outputs()
    graph_inputs = [tensor_info(item) for item in inputs]
    graph_outputs = [tensor_info(item) for item in outputs]
    print("Actual ONNX graph inputs:", json.dumps(graph_inputs))
    print("Actual ONNX graph outputs:", json.dumps(graph_outputs))
    image_inputs = [item for item in inputs if shape_of(item) == [1, 96, 96, 1] and item.type == "tensor(float)"]
    sequence_inputs = [item for item in inputs if shape_of(item) == [1, 512, 6] and item.type == "tensor(float)"]
    if len(image_inputs) != 1 or len(sequence_inputs) != 1 or len(outputs) != 1 \
            or shape_of(outputs[0]) != [1, 63] or outputs[0].type != "tensor(float)":
        raise RuntimeError("Exported ONNX logical input/output contract is invalid")
    static_feeds, provenance = capture_feeds(model, inputs, graph)

    entries: list[dict[str, object]] = []
    global_max = 0.0
    for case in cases:
        actual = session.run([outputs[0].name], {
            image_inputs[0].name: case["image"], sequence_inputs[0].name: case["sequence"], **static_feeds,
        })[0]
        expected = case["keras"]
        if actual.shape != (1, 63) or not np.isfinite(actual).all():
            raise RuntimeError(f"Invalid ONNX prediction for {case['name']}")
        delta = np.abs(expected - actual)
        max_abs, mean_abs = float(delta.max()), float(delta.mean())
        global_max = max(global_max, max_abs)
        keras_top = np.argsort(-expected[0])[:3]
        onnx_top = np.argsort(-actual[0])[:3]
        keras_sum, onnx_sum = float(expected.sum()), float(actual.sum())
        sane = all(abs(value - 1.0) <= 1e-3 for value in (keras_sum, onnx_sum))
        passed = bool(keras_top[0] == onnx_top[0] and max_abs < THRESHOLD and sane)
        entry = {
            "sample": case["name"], "source": case["source"], "trueLabel": case["trueLabel"],
            "kerasTop1": labels[keras_top[0]], "onnxTop1": labels[onnx_top[0]],
            "kerasTop3": [{"label": labels[i], "confidence": float(expected[0, i])} for i in keras_top],
            "onnxTop3": [{"label": labels[i], "confidence": float(actual[0, i])} for i in onnx_top],
            "maxAbsoluteDifference": max_abs, "meanAbsoluteDifference": mean_abs,
            "kerasProbabilitySum": keras_sum, "onnxProbabilitySum": onnx_sum,
            "kerasProbabilities": expected[0].tolist(), "onnxProbabilities": actual[0].tolist(),
            "passed": passed,
        }
        entries.append(entry)
        print(f"{case['name']}: Keras={entry['kerasTop1']} {expected[0, keras_top[0]]:.6f}, "
              f"ONNX={entry['onnxTop1']} {actual[0, onnx_top[0]]:.6f}, "
              f"max={max_abs:.9g}, mean={mean_abs:.9g}, {'PASS' if passed else 'FAIL'}")

    top1_matches = sum(entry["kerasTop1"] == entry["onnxTop1"] for entry in entries)
    parity_passed = bool(all(entry["passed"] for entry in entries) and global_max < THRESHOLD)
    report = {
        "sourceModel": str(SOURCE.relative_to(ROOT)),
        "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "onnxModel": str(ONNX.relative_to(ROOT)),
        "onnxSha256": hashlib.sha256(ONNX.read_bytes()).hexdigest(),
        "onnxBytes": ONNX.stat().st_size,
        "opset": [{"domain": item.domain, "version": item.version} for item in graph.opset_import],
        "exportMethod": method, "kerasVersion": keras.__version__, "onnxRuntimeVersion": ort.__version__,
        "onnxInputs": graph_inputs, "onnxOutputs": graph_outputs,
        "staticInputProvenance": provenance,
        "cases": entries, "globalMaxAbsoluteDifference": global_max,
        "top1MatchCount": top1_matches, "totalTested": len(entries),
        "parityPassed": parity_passed,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"GLOBAL MAX ABS DIFF: {global_max:.9g}")
    print(f"TOP-1 MATCH COUNT: {top1_matches}")
    print(f"TOTAL TESTED: {len(entries)}")
    print(f"PARITY: {'PASS' if parity_passed else 'FAIL'}")
    return 0 if parity_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
