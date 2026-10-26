# Recognition rollback archive

models/baya contains legacy CustomCNN8, EfficientNet ExternalFirst, EfficientNetB0_model and BiLSTM runtime artifacts with their original metadata. model-versions.json is the historical registry; the app does not import it. The active ResNet remains exclusively in apps/mobile/public/models/baya.

These files are retained for reproducibility and rollback, not automatically deployed. Compare hashes with docs/cleanup/model-moves.json and efficientnet-rollback-moves.json before use. The original pre-cleanup public files also have recovery copies under C:/BAYA-cleanup-backups/20261025/files.

To prepare a rollback, copy the chosen model and its corresponding labels/contract into apps/mobile/public/models/baya; use that model's contract in apps/mobile/ml/bayaActiveModel.json. Keep the current ResNet recoverable. Run model-specific preprocessing/parity tests, the full app tests and production export, then validate recognition and offline caching before deploying. File restoration alone is not proof that an older model is safe to activate. Never combine label orders or preprocessing metadata from different models.
