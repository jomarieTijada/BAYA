# Compliance Matrix No. 12 — final verification

**Verdict: partially complied with; effectiveness against invalid handwriting remains pending independent validation.** Implementation, investigation and reproducible tools are completed. The known production false-mastery case is still present. Production validity rejection remains disabled. No weights, model locations, research thresholds, unrelated features or existing earned progress were changed.

## Concern and previously identified problem

The panelist concern is incorrect, incomplete or invalid handwriting receiving high-confidence Baybayin predictions and potentially earning mastery. The previous integration reproduced a procedural wave classified as HA with probability 0.9873320460319519. A closed-set character classifier has no unknown class; matching a target with high softmax confidence does not establish acceptable handwriting.

## Actual changes in this continuation

- `apps/mobile/ml/recognitionReliability.ts` now exposes `canAwardWritingMastery`, a final barrier combining the existing stroke-sufficiency rule, recognized decision, Top-1 target identity and existing 0.80 mastery requirement. Rejected, uncertain, insufficient and technical-error states cannot award mastery. Confidence remains a classifier score, never an input-validity score.
- `WritingPracticeScreen.tsx` uses that barrier before incrementing mastery; tests cover all non-recognized outcomes and high-confidence wrong-target input. Existing two-attempt, retry, attempt recording and navigation behavior remain unchanged.
- `scripts/testing/compliance-12-validation/` adds a reproducible local browser evaluation tool, manifest validator, metric tests, documented collection protocol and isolated production-UI tests. The validator requires independent pre-inference review/adjudication, raw input hashes, separate calibration/holdout partitions, declared lesson targets, training exclusion and writer/source/duplicate-family grouping. Exact and decoded-tensor leakage is checked. It never invents labels, tunes holdout thresholds or grants production approval.
- The supplied research CSVs were inspected separately from newly executed inference. All artifacts are under `docs/verification/compliance-12/validation/`. The reviewed-data manifest intentionally has no rows; its rejection is recorded rather than replaced with fake examples.

## Data composition and provenance

| Evidence | Count | What it establishes / limitation |
|---|---:|---|
| Existing procedural diagnostic shapes | 96, 12 per category | Real inference on pre-existing synthetic waves, circles, crosses, zigzags, scribbles, random lines, geometric shapes and other doodles. Generator intent is NOT independent invalid-input ground truth. |
| Bundled reference glyph PNGs | 63 | Application reference-art behavior at original resolution, not learner handwriting. |
| Historical preprocessing parity fixtures | 16 rerun with both models | Browser/Python implementation parity, not classification/validity accuracy. |
| Supplied synthetic-negative test CSV | 640 rows | Recorded research scores only; raw referenced images absent; synthetic and unreviewed. |
| Supplied positive-test CSV | 630 rows | Recorded scores only; raw images absent, writer separation unverified. |
| Independently reviewed real calibration / holdout data | **0 available** | Population effectiveness metrics are unavailable. |

`data-inventory.json` records the inspected repository research/data locations and supplied research files. `ml/data` and `research/respondent-data` contain documentation rather than the required labeled captures. Existing source artwork, screenshots and golden tensors cannot be promoted to independent human-reviewed handwriting. The research CSVs reference unavailable `/content/...` and dataset-relative originals. The source metadata states file-level splitting with unverified writer identity, 4,480 synthetic negatives and zero reviewed real negatives.

There is no independently labeled set of imperfect-but-recognizable or incomplete handwriting here. No images or ground-truth labels were fabricated for those categories. Their validity-score behavior remains **unmeasured**, rather than inferred from a model or synthetic shape label.

## Methodology

The local Chromium runner transpiles and uses production capture, preprocessing, WASM services, class mapping, sufficiency, recognition decision and final mastery barrier. Both models receive the same image tensor. Scores retain their raw values. Research pass >=0.9605122804641724; reject <0.6407943367958069; otherwise review. Both review/reject withhold in the development-only experimental pipeline. No new threshold was selected.

Diagnostic procedural shapes use HA as the declared concern-specific target. A separate field enumerates the hypothetical matching-target risk; it is not substituted for ground truth. Image-only inputs have no stroke-sufficiency evidence, so full mastery metrics are unavailable for them. Independent evaluation reports per partition, category and predeclared target, with numerator/denominator and null for missing denominators. Technical failures/insufficient inputs are not model-scored examples and are reported separately. One-attempt eligibility is not an estimated two-attempt population completion rate.

Calibration and holdout are separate mandatory partitions for future real evaluation. The current procedural/reference diagnostic has no pretend calibration/holdout split; three duplicate tensor pairs are explicitly reported. The supplied research test CSV is not reclassified as our independent holdout. Reviewer/provenance declarations must still be audited by humans, and exact hashes cannot rule out all near-duplicate leakage.

## Measured results

### Reproduced wave

Production service at the original 640x320 capture geometry:

- Top-1: **HA**, character confidence **0.9873320460319519** (98.73%).
- Validity: **0.00016325712203979492**, research **reject**.
- Experimental pipeline: `EXPERIMENTAL_UNCERTAIN`; no award path.
- Production gate disabled: HA target remains eligible; a different target receives no credit.

Real exported learner UI, using pointer events that preserve the original 2:1 wave proportions across the responsive canvas:

- HA confidence **0.9884052276611328**, displayed **98.8%**.
- First redraw: one star. Separate retry/redraw: second star and Next enabled.
- SQLite attempt count increased from 4 to 5 to 6 in the isolated test profile. The profile included prior fixture/failed-reproduction attempts; these are not hidden from the evidence. No topic completion or cloud synchronization was performed.
- [Two-star screenshot](verification/compliance-12/validation/ui/real-wave-ha-unresolved-second.png), [raw states and attempt records](verification/compliance-12/validation/ui/real-ui.json).

The initial unadjusted full-screen UI reproduction predicted **BA at 86.8%** against HA, correctly awarded no stars, and timed out waiting for Next. This failed reproduction is preserved in `ui/initial-geometry-failure.log` and `ui/initial-geometry-wave-ba.png`. It prompted an explicit aspect-ratio correction to the test input, not a model or shape-specific application exception. Service and UI scores differ slightly because pointer capture/rasterization is not bit-identical to direct normalized stroke input.

### Newly executed diagnostic behavior

| Category | Samples | Pass | Review | Reject | HA-target awards without gate |
|---|---:|---:|---:|---:|---:|
| Waves | 12 | 0 | 0 | 12 | 11 |
| Circles | 12 | 0 | 0 | 12 | 0 |
| Crosses | 12 | 0 | 0 | 12 | 0 |
| Zigzags | 12 | 0 | 0 | 12 | 0 |
| Scribbles | 12 | 0 | 0 | 12 | 0 |
| Random lines | 12 | 0 | 0 | 12 | 0 |
| Geometric shapes | 12 | 0 | 0 | 12 | 0 |
| Other doodles | 12 | 0 | 0 | 12 | 0 |
| Reference art | 63 | 54 | 6 | 3 | Not measured without strokes |

For these unreviewed diagnostic shapes, pass is **0/96**, and HA-target award eligibility is **11/96 without the gate, 0/96 with research pass required**. Hypothetically choosing each drawing's predicted class as its target would qualify **62/96** without the gate. None of these numbers is an independently measured invalid-input acceptance or false-mastery rate.

Reference-art hard rejection is **3/63 (4.76%)**, with **9/63 (14.29%)** total non-pass if review also withholds. Rejected reference labels: DA/RA, NGA, WA. Review: E/I, GA, HA, NG, NGO/NGU, YA. Top-1 reference classification matches 57/63 labels. These are application-art diagnostics, not a valid-learner false-rejection estimate; they are sufficient reason to investigate positive rejection before enabling the gate. Reference natural-resolution results should not be mixed with older tests that resized art to 256 pixels before preprocessing.

### Recorded research CSV results — not rerun inference

| Set | Pass | Review | Reject |
|---|---:|---:|---:|
| Synthetic unreviewed negatives, 640 | 1 | 2 | 637 |
| Reported positives, 630 | 596 | 28 | 6 |

The supplied negative CSV has a **1/640 (0.15625%)** pass rate; scribbles alone pass **1/80 (1.25%)**. `scribbles_0009.png` records validity **0.9959747**, Top-1 **KE/KI**, confidence **0.9997795**, and matching-target false-credit risk. Thus even the research records contain a high-validity/high-character-confidence synthetic failure. Its original image is unavailable, so stroke sufficiency and actual app mastery cannot be independently rerun for that row.

Reported positive hard rejection is **6/630 (0.95%)**, total non-pass **34/630 (5.40%)**. These scores lack accessible originals and independent writer-disjoint labels here. They do not certify an acceptable production false-rejection rate. Exact source CSV hashes and the failed row are in `supplied-research-summary.json`.

### Required real-world validation metrics

| Metric | Result |
|---|---|
| Independently labeled invalid-input acceptance | **Unavailable** |
| Independently labeled valid-input false rejection/non-pass | **Unavailable** |
| Target-conditioned false mastery acceptance on real captures | **Unavailable** |
| Imperfect/incomplete real-handwriting category behavior | **Unavailable** |

Missing data is the blocker. Zero observed diagnostic passes cannot establish zero real-world invalid acceptance. Conversely, a shape thought invalid by its procedural generator is not a reviewed Baybayin ground-truth label.

## Complete-system verification

- **Jest: 76 suites, 743 tests passed.** This includes mastery barrier, high-confidence wrong-target, retry, progress/persistence, uncertain/rejected/error states, sufficiency, model failures and existing unrelated regression tests. Existing forced-exit advisory remains; this is not whole-app leak certification.
- **Evaluation-tool tests: 6 passed**, including reviewed-label requirements, writer/source/family leakage, altered input hashes and exact metric denominators/nulls. These use explicitly mock validator data, not accuracy samples.
- **TypeScript, Expo lint, Expo web export, PWA service-worker check: passed.** Model assets and thresholds remain in their previous locations and retain their hashes.
- **Browser WASM/Python parity: 16/16 Top-1 matches**, exact preprocessing; character and validity differences remain below 1e-5. Both models load once and reuse sessions. Production flag lockout passed. Current run cold character/validity calls ~1741/1314 ms, warm means ~59.87/57.91 ms on local desktop hardware during other tests; not low-end-device guarantees.
- **Seven browser UI fixture screenshots** at 844x390: high-confidence wrong-target records an unsuccessful attempt, while low-confidence, rejected and error states leave the count unchanged; correct fixture adds an attempt. Retry and single Top-1 presentation passed. These are controlled state tests, not detector accuracy.
- **Seven further real-workflow screenshots**: actual two-wave false mastery, insufficient dots in both languages, offline uncertain fixture without an attempt, submitted-stroke restoration after reload, and actual cached offline ONNX inference. The offline uncertainty result is explicitly a UI fixture; final offline inference is real.
- Screenshot of the two-star failure was visually inspected. Browser JSON, logs, source inputs and scripts make the tests reproducible. Physical touch devices, low-end mobile memory and representative real handwriting remain unverified.

## Decision and minimum remaining work

The known wave can still increase production mastery. It is now explicitly demonstrated rather than described as a possibility. The validity model catches this specific wave but is **not demonstrated sufficiently reliable** for learner rejection. Its own CSV includes a high-confidence pass for a synthetic scribble, and current reference-art diagnostics show withholding of several legitimate reference glyphs.

Collect authorized, independently adjudicated real negatives and valid/imperfect/incomplete attempts, including raw strokes and predeclared targets. Ensure training exclusion, writer/source/family-disjoint calibration and untouched holdout data. Agree acceptable false-rejection and false-mastery criteria plus statistical precision beforehand. Evaluate the existing model first; then assess threshold recalibration on calibration data only. Retraining is warranted only if no calibrated operating point meets the agreed criteria on representative data, not merely because the wave existed. Any retrained model needs fresh untouched validation. Do not raise the threshold to chase one scribble or add a wave-specific rule.

The 0.80 confidence and two-success policy remain mechanically regression-tested, not newly empirically calibrated for invalid inputs. No production gate promotion is included. **Full compliance cannot be claimed until effectiveness and the false-rejection tradeoff are supported by the missing independent data.**

See [evaluation protocol and commands](../scripts/testing/compliance-12-validation/README.md) for collecting data, generating reproducible metrics, and rerunning browser checks.
