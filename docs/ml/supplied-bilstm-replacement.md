# User-supplied ONNX replacement — 2026-10-08

The exact file `C:/Users/jomsa/Downloads/baybayin_efficientnetb0_bilstm_1.1.onnx` replaces the preceding converted artifact at the existing canonical URL `/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx`. No reconversion or graph modification was performed.

- Size: 17,175,276 bytes.
- SHA-256: `32b63d2f36802e5792006c07f18bcc1aead2f9d20ed1181edc1feebf59ab70b1`.
- Original supplied contract retained as `supplied-bilstm-original-contract.json`. The app manifest/public contract combine its graph signature and normalization values with the existing authoritative labels and preprocessing metadata.
- Same image `[1,96,96,1]`, sequence `[1,512,6]`, and 63-class output; opset 18. This file additionally declares two `[1,1,1,3]` normalization inputs. The service validates their metadata, supplies the exact contract values and disposes their tensors after each inference.
- Original input preprocessing, output decoding and learner behavior are unchanged.

Validation: full ONNX checker passed; all 16 full-vector numerical comparisons against the existing Keras reference passed within max absolute error 1e-5, with identical top-1 and ordered top-3 results. Chromium WASM and the actual app service passed the same parity checks. TypeScript and all 47 targeted model/recognition/PWA tests passed. Jest still uses `--forceExit` for its existing open-handle issue.

Production export succeeded. Public and dist model hashes both exactly match the supplied file. Dist contains one ONNX. The generated PWA cache changed to `baya-pwa-e0bfdab61f76ebf9`; actual Chromium offline installation/hash checks and three offline inference runs passed. Learner data was not cleared. Nothing was deployed to Netlify.

Detailed numerical and browser evidence: `supplied-bilstm-parity.json`, `supplied-bilstm-browser-parity.json`, and `supplied-bilstm-pwa.json`. Drawing smoke-test output is retained in `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/supplied-ui.log`.

The built-app drawing/Suriin/repeated-feedback smoke test passed on retry. The first automation attempt failed to register strokes and correctly failed its assertion; it was not counted as a successful inference test.

Updated files: active manifest and public contract/model; `bayaModel.web.ts`; model service/contract tests; browser parity and offline-inference scripts; active ML README; and this report. The earlier conversion report is marked superseded. Original Downloads files remain untouched.
