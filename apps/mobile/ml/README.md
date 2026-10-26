# Recognition runtime

The active model is **BAYA_ResNet18_1.0.onnx**, an image-only ResNet18 with float32 input [1,96,96,1] and 63 output probabilities. The sole production selection is bayaActiveModel.json, consumed by bayaModelConfig.ts, the web loader and the service-worker generator.

writingRecognition.ts coordinates canvas rasterization, bayaPreprocessing.ts, inference and feedback. inkImagePreprocessing.ts implements the verified Pillow-compatible image algorithm shared by ResNet and research comparisons. bayaClassLabels.ts reads the exact output-index order from the active manifest. It composites transparency over white, converts to grayscale, inverts ink, crops/pads a square, resizes and normalizes to [0,1]. The exact contract and label order are in the active manifest. Do not replace these with generic image transforms.

bayaModel.web.ts owns the cached ONNX Runtime Web/WASM session. Native recognition reports unsupported explicitly. Stroke capture remains necessary for drawing, undo and persistence. Historical BiLSTM source and fixtures now live outside the app in ../../../ml/rollback/runtime and ../../../ml/rollback/fixtures. Shared Pillow golden-image tests remain here because they validate the active preprocessing algorithm.

The service-worker generator selects the active model and metadata, versions caches from file contents and leaves SQLite/OPFS untouched. Legacy binaries are in ../../../ml/rollback/models/baya, outside public assets. See ../../../docs/CODEBASE-CLEANUP-REPORT.md for relocation/recovery evidence.
