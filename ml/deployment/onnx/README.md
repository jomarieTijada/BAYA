# Active hybrid model conversion

Use `replace_bilstm_v1_1.py --source-dir <experiment-results-directory>` with the pinned Python 3.12 environment in `requirements.txt`. This script stages the original stage B model, checks selection/provenance, audits both Keras checkpoints, validates the graph, verifies notebook preprocessing, and compares every output probability. It never activates or deletes app assets. Then run `node scripts/verify-bilstm-v1.1-browser.mjs` for real Chromium WASM and application-service parity.

See `docs/ml/bilstm-v1.1-replacement.md`. The image-only scripts below remain historical research tools and do not select the production model.

---

# EfficientNetB0_model validation

The sole authoritative source is `C:/BAYA/EfficientNetB0_model.keras`, byte-for-byte restored from the exact user-selected source. Production artifacts are `apps/mobile/public/models/baya/EfficientNetB0_model.onnx`, `EfficientNetB0_model_labels.json` and `EfficientNetB0_model_onnx_contract.json`.

```powershell
.\ml\deployment\onnx\.venv\Scripts\python.exe ml/deployment/onnx/validate_efficientnetb0_model.py
node scripts/verify-efficientnetb0-browser.mjs
```

The validator loads and inspects the exact source, reconstructs its own notebook preprocessing/class order, validates independently exported labels, recomputes 109 original fixture tensors, creates 114 golden references and compares all 63 probabilities through the existing ONNX. It runs ONNX checker and requires 100% Top-1/Top-3 order agreement plus maximum error <=1e-5. It never retrains, converts, publishes or changes selection. Browser validation uses the actual shared service and measures cached-session reuse, preload, exact input floats and raw probabilities.

The existing ONNX passed strict source parity and was reused without conversion. For future missing/corrupt assets, use the retained compatible TensorFlow/Keras/tf2onnx/ONNX environment to export the authoritative source faithfully, then repeat all deployment gates. Re-conversion is not needed merely to change a filesystem filename. Tensor names stay unchanged.

`artifacts/efficientnetb0-model` retains current summary, exact input/probability references, validation logs and starting repository state. Obsolete generated deployment artifacts are removed; original image fixtures, datasets, notebooks and historical evaluation/deployment reports remain protected. Full report: `docs/ml/efficientnetb0-model-restoration.md`.
