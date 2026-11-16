> Historical report for the previous model. See [current dual-model integration and verification](COMPLIANCE-12-DUAL-MODEL-INTEGRATION.md) for the replacement artifacts, experimental flag, and current results.

# Compliance #12 — high-confidence recognition reliability

Status: **partially implemented and validated; general non-Baybayin rejection remains unresolved.**

The safe fallback explicitly allowed by the brief is implemented. Low-confidence results now produce a localized uncertain outcome without a guessed glyph, percentage, recognized-attempt row, or mastery increment. The application has a typed rejection contract and tested rejection presentation/persistence barrier. **No general doodle detector is enabled.** The available data do not justify one. Rejection screenshots are controlled contract tests, not evidence that the model detects doodles.

The original failure is reproduced with real production ONNX inference: the desktop wave predicts **HA, 0.946852445602417 (displayed 94.6%)**. Against target HA, two independent redraws still earn two stars. This is an observed remaining defect, not a successful rejection test. See [real browser evidence](verification/compliance-12/real-ui.json) and [second-attempt screenshot](verification/compliance-12/real-wave-ha-unresolved-second.png). No special case for wave geometry, HA, or this score was added.

## Audit and root cause

The active artifact remains `BAYA_ResNet18_1.0.onnx`, 44,974,086 bytes, SHA-256 `fc41b21606b96b2a1fec6850259a8cbdc446d54f3d113ae8086e87310268f265`. It is an image-only ResNet18 with 63 output classes, including the supported variants. There is no unknown class, binary validity head, sequence classifier, rejection model, temperature parameter, or calibrated probability-of-Baybayin output.

The pipeline is:

1. Existing canvas checks enforce finite normalized coordinates, sane geometry, point/travel/extent limits and optional timestamp consistency. These distinguish usable input from insufficient or malformed input; they do not classify character shapes.
2. Production capture renders only submitted strokes onto a white 256×256 canvas, preserving the input canvas aspect ratio, black round strokes at the established width. The tracing guide/background is not included.
3. The verified notebook preprocessing composites alpha on white, converts to grayscale ink, crops at ink >0.08, pads 15%, centers on a square and uses Pillow-compatible bilinear resizing to 96×96, then divides by 255. No preprocessing or normalization change was made.
4. ONNX receives float32 `[1,96,96,1]` at `image_input`. Its `Identity:0` output is float32 `[1,63]`. The training model ends with a 63-unit **softmax**. Production validates finite probabilities, shape, range and sum; it does not apply a second softmax, round scores for decisions or bias scores toward the target.
5. Stable descending ranking selects Top-1. Label lookup uses the active ordered model indices. The target comparison uses class IDs. Existing acceptance requires Top-1 target match and raw probability ≥0.80; mastery requires two independent accepted attempts.
6. Previously every valid model response was presented as a recognized character, including low-confidence outputs. A high score among 63 classes was also sufficient to pass the confidence portion of the mastery rule. It is not evidence that the drawing belongs to any of those classes.

The measured primary cause is closed-set forced classification coupled to a confidence-only acceptance condition. Calibration, distribution shift, insufficient negative training coverage and writer diversity are plausible contributors; their individual contributions cannot be quantified without the original dataset and an independent labeled holdout. Incorrect label mapping, accidental target substitution, double softmax and altered confidence values were not found. Existing conversion/browser parity checks cover 80 fixtures with matching Top-1 outputs; those are implementation parity, not recognition accuracy or OOD validation.

## Available data and provenance

`ml/data`, `research/respondent-data` and `research/algorithm-results` contain documentation, not the original training/test samples. A workspace search including ignored files found no current-model source dataset ZIP, selected-originals CSV or per-image test prediction export. Existing local model conversion fixtures are not a labeled independent handwriting dataset. No external data or child handwriting was downloaded or uploaded.

The recorded outputs of `research/notebooks/BAYA_ResNet18.ipynb` report:

- Source ZIP `BAYA_DATASETS_1.1 (1).zip`, SHA-256 `41128a1b32484eb4ee82118b1669cbe3e12ee4525e22208d3ce986b3fb10f2f2`.
- 4,410 images: 70 per class, 50 train / 10 validation / 10 test per class (3,150 / 630 / 630).
- 4,410 distinct decoded originals and zero exact duplicates removed, as recorded at training time.
- Split signature `5003b74970228e2a754852d40ad1252a2855fc28897311768b8ad48b532c1019`.
- Recorded test accuracy 97.1429%, macro precision 97.3346%, recall 97.1429%, F1 97.0848%, on 630 in-distribution images.

These are **historical notebook outputs**, preserved in [notebook-recorded-results.json](verification/compliance-12/notebook-recorded-results.json), not independently rerun measurements. The notebook uses exact-image deduplication and balanced image-level splitting; it explicitly does not establish writer separation. Source text describes student-collected images plus public S-family replacements. Original rights/consent/source notes, child representativeness, label correctness, near-duplicate leakage, writer overlap and original split membership cannot be independently checked here. Recorded balance does not prove representative handwriting. The historic 97.14% result says nothing about rejecting arbitrary drawings.

New diagnostics use only procedurally authored shapes and existing bundled reference art locally:

- 96 synthetic fixtures, 12 each: waves, circles, zigzags, scribbles, random lines, crosses, geometric squares, spiral-like other doodles. Category labels denote generator intent. Circles/crosses/lines may overlap legitimate character features; they are not expert-adjudicated negatives.
- Deterministic size, rotation, off-center and stroke-direction/order variants, with production pen width. Scale changes relative stroke thickness. Multi-stroke categories exercise stroke count. Arbitrary noisy child strokes, independent writers and a broad distribution of pen widths are not covered.
- 63 bundled reference PNGs, one per model class, rasterized locally. This is reference-art diagnostics, not clean/imperfect child handwriting, independent validation, or evidence of class-wide generalization.
- Development/held-out synthetic variants were assigned before inference; no model or threshold was fitted on either. SHA-256 of preprocessed tensors revealed three cross-partition duplicate pairs (circle-2/11, cross-2/11, other_doodle-2/11). All variants are related by construction. Consequently **neither partition is treated as an independent final test set**. Counts are retained transparently; no production selection or generalization claim is based on them.

Full inputs, scores, tensor hashes and all-target decisions are in [synthetic-manifest.json](verification/compliance-12/synthetic-manifest.json), [real-model-results.json](verification/compliance-12/real-model-results.json), and [metrics.json](verification/compliance-12/metrics.json). No copyrighted publisher photograph is involved in this task.

## Measured results and candidate comparison

Real Chromium/WASM calls use production capture, preprocessing, runtime, label map, decision and mastery helpers. For 96 synthetic drawings, raw Top-1 scores ≥80/90/95/99% occur in **45/27/20/20** cases respectively. The largest score exceeds 99.9999%. Synthetic wave variants at the fixed diagnostic canvas aspect ratio all exceed 99.99%; the actual desktop UI reproduces the original 94.6% result. Geometry explains why the two reproducible inputs have different scores; neither is replaced with a mock score.

| Synthetic category | Count | Retained at ≥80% | Uncertain | Validated OOD rejection |
|---|---:|---:|---:|---:|
| Wave | 12 | 12 | 0 | 0 |
| Circle | 12 | 2 | 10 | 0 |
| Zigzag | 12 | 8 | 4 | 0 |
| Scribble | 12 | 6 | 6 | 0 |
| Random lines | 12 | 7 | 5 | 0 |
| Cross | 12 | 2 | 10 | 0 |
| Geometric | 12 | 8 | 4 | 0 |
| Other doodle | 12 | 0 | 12 | 0 |
| Total | 96 | 45 | 51 | 0 |

The new policy withholds 51/96 guesses as **uncertain**, not confidently non-Baybayin. It does not change successful-attempt eligibility: before and after, 45/96 drawings can earn credit when the requested target equals their Top-1 class. Across all 63 equally enumerated targets, 45/6,048 drawing-target pairs qualify. The latter 0.744% is a combinatorial target enumeration, **not a real-world false-acceptance rate**. Matching targets matter; comparing only against A would conceal the HA failure. Two independent retained redraws can still satisfy mastery, as the actual HA activity confirms.

| Diagnostic rule | Synthetic drawings retained | Reference art withheld | Shipped? |
|---|---:|---:|---|
| Existing max softmax ≥0.80 | 45/96 | 2/63 | Yes, for uncertainty and existing mastery only |
| Max softmax ≥0.90 | 27/96 | 4/63 | No |
| Max softmax ≥0.95 | 20/96 | 4/63 | No |
| Max softmax ≥0.99 | 20/96 | 7/63 | No |
| Entropy ≤0.5 nats | 33/96 | 3/63 | No |
| Top-1 minus Top-2 margin ≥0.5 | 66/96 | 2/63 | No |

These comparison points are diagnostic probes, not empirically certified acceptance criteria. None solves the high-confidence wave, and there is no independent handwriting set to bound false rejection. Input-quality checks reject blank/insufficient input safely but do not identify non-Baybayin shapes. A binary Baybayin detector, hybrid feature-distance gate, outlier exposure or retrained model would require representative labeled positives and negatives and independent writer-held-out evaluation. No such model was trained, downloaded or promoted. No arbitrary confidence adjustment, shape heuristic, synthetic 64th class or global cutoff increase was introduced.

Reference-art Top-1 accuracy is 60/63 (95.2381%), macro precision 94.4444%, recall 95.2381%, F1 94.7090%. Accepted coverage is 61/63; accuracy among retained reference outputs is 59/61. Two reference images are uncertain; this is not a measured child-handwriting false-rejection rate. Raw Top-1 accuracy and scores are unchanged by the policy. The reference-only 10-bin ECE is 0.04237 and NLL 0.11980; full confusion matrix and correct/wrong score distributions are in metrics.json. Neither number measures calibration on authentic handwriting or OOD data. No temperature was fitted; the deployed interface exports probabilities rather than an explicit logit output, and no calibration dataset is available.

Desktop warm inference averages approximately 38.84 ms for synthetic inputs (p95 51.49 ms), 30.25 ms for reference art (p95 35.38 ms), excluding initial model download/compilation. These are one local headless Chromium run, not low-end device guarantees. Runtime browser version and optional JS heap snapshot are recorded. A JS heap sample is not WASM/native peak memory. Added model bytes: **0**. Added runtime dependency: **none**. The decision uses a copy/sort of at most the existing three returned candidates in the app; inference and input preprocessing remain unchanged. Physical low-end device CPU/memory and cold-start benchmarking remain unmeasured.

## Implementation and persistence

- `ml/recognitionReliability.ts` introduces a target-independent discriminated decision: recognized, uncertain, insufficient-input, rejected, technical error. Non-recognized variants carry no character or confidence. Only recognized decisions proceed to Top-1 presentation, attempt creation and mastery.
- `assessRecognition` uses the existing raw 0.80 requirement to withhold uncertain guesses. It does not claim that ≥0.80 proves validity. The rejected branch is reserved for a future independently validated detector; no production rule emits it today.
- `WritingPracticeScreen` gates before `recordWritingAttempt`, star increments and completion eligibility. Low-confidence/uncertain outputs no longer create a misleading recognized attempt. No schema migration or fake recognized-class value is used. High-confidence wrong-target outputs remain identified but unsuccessful, with normal invalid-attempt storage.
- Blank captured ink raises a typed `INSUFFICIENT_INPUT` error and displays existing draw-first guidance; runtime/model-contract/persistence failures remain technical errors. Existing canvas safeguards are preserved.
- `recognitionPresentation`, `BayaWritingGuide`, and centralized English/Tagalog messages add gentle uncertain/rejected feedback. Neither result exposes an alternative candidate list, glyph, label, percentage or predicted-character accessibility announcement. The existing mascot, feedback card and retry action are reused.
- Submitted draft/checkpoint ownership, stale-request guards, accepted-count restoration, clear/retry, profile isolation and topic navigation are unchanged. Language switching translates the current state without clearing strokes, changing decisions or repeating inference.
- Existing earned progress is untouched. The model, label map, preprocessing, 80% threshold, two-success rule, tracing guides, SQLite schema and synchronization remain unchanged. `writingRecognition.ts` changes only the no-ink error type/import. Hash comparisons against Compliance #9 are saved in [preservation-checks.json](verification/compliance-12/preservation-checks.json).

## Validation

- TypeScript: pass. Expo lint: pass. Production web export and service-worker generation: pass.
- Full Jest suite: **75 suites, 729 tests passed**, including policy boundaries, corrupt output, uncertain/rejected contract behavior, no persistence/star credit, localization, retry, stale requests, profile ownership, resume, model contract/preprocessing and existing mastery regressions.
- 70 real-browser UI screenshots cover before-submit, loading, recognized correct, recognized wrong-target, uncertain, technical error, and controlled rejected state in English and Tagalog at 667×375, 844×390, 915×412, 1024×768 and 1366×768. No overflow/clipping was detected. SQLite counts are unchanged for uncertain/rejected/error; recognized cases add the expected attempt. See [browser-report.json](verification/compliance-12/browser-report.json) and [browser-assertions.json](verification/compliance-12/browser-assertions.json).
- Ten additional insufficient-dot screenshots cover both languages/all sizes: no inference request or attempt was created. Existing blank/dot/malformed guards are also covered by unit tests.
- Offline cached production bundle/model load and real ONNX inference passed. Offline uncertain UI fixture saved no attempt. Reload restored the submitted draft without rerunning learner recognition (only the existing model warmup occurred); retry remained available. These checks use an isolated temporary browser profile, not the user's data. They are not an installed-device reboot test.
- Actual HA target test confirms the unresolved 94.6% wave, one then two stars, and Next eligibility. It does not complete the topic or modify the user's progress. Offline inference against A still predicts HA and correctly gives no target-match credit.
- Total browser evidence: **85 screenshots**. Rejected screenshots/test outputs are explicitly labeled fixtures and prove only contract/presentation behavior. No real invalid-shape detector accuracy is claimed.

Reproduce from the repository root:

```powershell
node scripts/testing/compliance-12-evaluate.mjs
node scripts/testing/compliance-12-metrics.mjs
npm test --workspace apps/mobile -- --runInBand --forceExit --silent
npx tsc --noEmit --project apps/mobile/tsconfig.json
npm run lint --workspace apps/mobile -- --no-cache
npm run export:web --workspace apps/mobile
# In a separate terminal, starts an isolated headless browser and local dist server:
node scripts/testing/compliance-01/browser-server.mjs
node scripts/testing/compliance-12-browser.mjs
node scripts/testing/compliance-12-real-ui.mjs
```

## Remaining validation required

Before enabling general rejection, obtain authorized, expert-reviewed original and child handwriting samples covering all supported classes, imperfect/ambiguous forms and non-Baybayin negatives. Include valid crossing/curved forms, small/large/off-center/rotated writing, and wrong-target valid examples. Keep writer/source identities and family-derived duplicates grouped into separate training, calibration and final test sets. Audit consent/rights, near duplicates, labels and imbalance. Agree an acceptable false-rejection/false-acceptance tradeoff before inspecting the final test set. Compare candidate detectors and report per-category counts, uncertainty intervals, target-conditioned false acceptance, positive accuracy/coverage, two-attempt behavior, calibration, latency and offline cost. Do not promote a detector based solely on the synthetic diagnostics above.

**Full Compliance #12 acceptance is not claimed.** The safe UI/persistence changes and reproducible research tools are complete; the high-confidence OOD/mastery defect needs representative independent data and a validated detector. Nothing was committed, pushed, deployed, or externally transmitted.

## Research references

- [Nguyen, Yosinski and Clune, CVPR 2015](https://openaccess.thecvf.com/content_cvpr_2015/html/Nguyen_Deep_Neural_Networks_2015_CVPR_paper.html): high-confidence predictions can occur on unrecognizable images. [Author preprint](https://arxiv.org/abs/1412.1897) provides the same research when the publisher endpoint is unavailable.
- [Hendrycks and Gimpel, ICLR 2017](https://mlanthology.org/iclr/2017/hendrycks2017iclr-baseline/): maximum softmax probability is an OOD/misclassification baseline to evaluate, not a universal validity guarantee.
- [Guo et al., ICML 2017](https://proceedings.mlr.press/v70/guo17a.html): neural-network calibration and temperature scaling require evaluation against labeled data; calibration is distinct from recognizing out-of-distribution input.
- [Ovadia et al., NeurIPS 2019](https://proceedings.neurips.cc/paper/2019/hash/8558cb408c1d76621371888657d2eb1d-Abstract.html): uncertainty methods and post-hoc calibration must be evaluated under distribution shift. These general findings motivate the local audit; they do not certify BAYA's detector performance.
