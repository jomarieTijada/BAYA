# BAYA Keras 3 to ONNX export

This workflow loads only the authoritative `Baybayin_EfficientNetB0_BiLSTM_1.0.keras` artifact at the repository root. It does not rebuild the architecture or change weights. It runs four deterministic sequence-length references (32, 128, 256, 512), exports the loaded Keras 3 model, then checks ONNX structure and ONNX Runtime CPU numerical parity. Export outputs are written under `artifacts/`.

The source archive was saved with Keras 3.13.2. On this Windows host, Python 3.12 and TensorFlow Intel 2.18.0 are available; Python 3.11 and `uv` are not. The isolated `.venv` does not change global Python packages.

From the repository root in PowerShell:

```powershell
python -m venv ml/deployment/onnx/.venv
.\ml\deployment\onnx\.venv\Scripts\python.exe -m pip install -r ml/deployment/onnx/requirements.txt
.\ml\deployment\onnx\.venv\Scripts\python.exe ml/deployment/onnx/export_baya_onnx.py
```

A successful export creates `artifacts/Baybayin_EfficientNetB0_BiLSTM_1.0.onnx`, deterministic reference inputs/outputs, and a parity report. This is only an export/CPU parity check. Deploy the model to the application only if every test passes with top-1 agreement and global maximum absolute difference at most `1e-4`; a failed gate must not be treated as a deployable model.

The export command also runs `diagnose_baya_onnx.py`, which proves the provenance of the two extra normalization feeds against the original model's concrete function captures and saved Normalization weights before running the parity suite. The diagnostic report and deterministic reference arrays are saved under `artifacts/`.

## v1.1 migration

The historical v1.0 command and artifacts above remain intact. To rerun the v1.1 conversion and parity gate from the repository root:

```powershell
.\ml\deployment\onnx\.venv\Scripts\python.exe ml\deployment\onnx\migrate_v1_1.py
```

This loads `Baybayin_EfficientNetB0_BiLSTM_1.1.keras` without training, calls the same Keras 3 exporter at opset 18, and writes only under `artifacts/v1.1/`. The gate checks four historical deterministic references, 15 notebook preprocessing goldens, and any available local capture JSON. It compares all 63 probabilities, class rankings, finite values, probability sums, and the source provenance of any static graph feeds. A failed gate returns a nonzero exit code. The published v1.1 artifact and deployment note are under `apps/mobile/public/models/baya/` and `docs/ml/v1.1-deployment.md`.

## Current diagnostic result

The source model loaded with Keras 3.13.2 and produced valid reference probabilities for active sequence lengths 32, 128, 256, and 512. Keras 3's direct ONNX exporter created an opset 18 model that passes `onnx.checker` and loads in ONNX Runtime 1.30.0 on CPU. The ONNX graph exposes four inputs. The two extra float32 `[1,1,1,3]` graph inputs match non-resource tensors captured by the original model's concrete TensorFlow function. Their values exactly match the original EfficientNetB0 Normalization layer's saved `mean` and `variance` weights. The graph declares both inputs but no ONNX node consumes either one; the report records this fact and the nearby normalization-scope nodes. Feeding the captured values still satisfies the four-case strict parity gate with global maximum absolute difference `3.48687172e-6` and all top-1 predictions matching. See `artifacts/parity_report.json` for values, provenance, and per-case results. This diagnostic result does not install or integrate ONNX Runtime Web; the app remains unchanged.
