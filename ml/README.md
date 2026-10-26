# BAYA machine learning

Production uses image-only ResNet18, selected by apps/mobile/ml/bayaActiveModel.json. Runtime details are in apps/mobile/ml/README.md. Two successful learner trials establish mastery; research collection sample counts are a separate requirement.

- research/notebooks: original root research notebooks, including BAYA_ResNet18.ipynb.
- research/models: original Keras training checkpoints, including BAYA_ResNet18_1.0.keras.
- ml/training: retained historical BiLSTM notebooks.
- ml/deployment/onnx: Python inspection/export tools and local generated parity evidence.
- ml/rollback: legacy runtime models and metadata, excluded from deployment.
- ml/preprocessing, ml/scripts, ml/tests: collected-stroke validation and dataset auditing.

From the repository root:

~~~powershell
python -m unittest discover -s ml/tests -v
python -m ml.scripts.audit_device_independence path/to/BAYA_dataset.zip
~~~

Research notebooks/checkpoints remain local and ignored. Preserve their backups; Git alone does not recover them. Historical docs/ml reports describe the model selected at the time, not the current production selection.
