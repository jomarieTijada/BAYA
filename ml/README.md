# BAYA machine learning

Production recognition uses image-only EfficientNetB0: `image_input` float32 `[1,96,96,1]` to 63 raw probabilities. The sole production configuration is `apps/mobile/ml/bayaActiveModel.json`. The browser API is `runBayaInference(imageData)`.

Image preprocessing is verified against cell 19 of `EfficientNetB0_Augmented_Comparison.ipynb` and 109 exact float32 fixtures. See `apps/mobile/ml/README.md` and `ml/deployment/onnx/README.md` for runtime and export details.

Raw collected strokes and canvas/device metadata remain useful for rendering, undo, recording and dataset audits. `ml.preprocessing.tracing` validates and summarizes those records without constructing model features. `ml.scripts.audit_device_independence` checks JSON/ZIP pairing, schema versions, bounds, ordinals and timing. The collection requirement of five samples is independent of the learner activity requirement of three successful trials; neither dataset schema nor collection behavior was changed.

```powershell
python -m unittest discover -s ml/tests -v
python -m ml.scripts.audit_device_independence path/to/BAYA_dataset.zip
```

Training notebooks and source Keras archives are research provenance, not production model-selection mechanisms. Historical deployment reports remain explicitly historical; obsolete runtime exporters and public assets are removed.
