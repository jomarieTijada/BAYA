# ONNX inspection and export

Current source: research/models/BAYA_ResNet18_1.0.keras. Training notebook: research/notebooks/BAYA_ResNet18.ipynb. inspect_export_resnet18.py produces candidate artifacts and parity evidence under artifacts/resnet18-1.0. Use the existing pinned Python environment in requirements.txt. Run from the repository root.

Production selection remains apps/mobile/ml/bayaActiveModel.json. Conversion alone must not change it. Verify source hashes, label order, preprocessing, probability parity, runtime loading and offline caching before selecting another model.

Older custom-CNN, EfficientNet and BiLSTM scripts are retained research tools. Their checkpoint paths now point into research/models, and comparison assets into ml/rollback. Browser validators have model-specific contracts rather than borrowing the current active model. They were syntax-checked during cleanup but historical browser parity was not rerun. Some exporters intentionally regenerate their candidate ONNX into artifacts; that generated copy may be removed after hash comparison with its rollback copy.

See ml/rollback/README.md for recovery, docs/ml/resnet18-1.0 for existing ResNet provenance, and docs/CODEBASE-CLEANUP-REPORT.md for this cleanup's results. Earlier EfficientNet/BiLSTM reports remain historical evidence.
