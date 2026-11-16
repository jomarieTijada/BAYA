# Independent handwriting evaluation

Run from repository root. Models and research thresholds remain unchanged. This tool does not approve or enable production gating.

## Current evidence and diagnostic run

`node scripts/testing/compliance-12-validation/run.mjs --diagnostic`

This reuses the existing 96 procedural samples in `docs/verification/compliance-12/synthetic-manifest.json` and 63 bundled reference glyphs. No new handwriting images or ground-truth labels are generated. Every procedural case uses HA as a declared diagnostic target, matching the reported concern; `targetMatchedDiagnostic` is separately marked as a hypothetical target equal to the prediction. These are not real-world false-acceptance rates. Reference images are processed at their natural resolution; they are not the older 256-pixel reference rendering experiment. Duplicate tensors are reported.

## Collect and label before inference

Use authorized real handwriting and captured strokes across all 63 classes, from representative writers/devices. Include correct, imperfect-but-recognizable, incomplete, random scribble and unrelated-shape categories. Independent Baybayin reviewers must decide what is recognizable; incomplete is not a label inferred from confidence. Two reviewers label blinded to predictions; adjudicate disagreements before inference. Record provenance and authorization references, never unnecessary personal identities. Use pseudonymous writer IDs. Verify exclusion from training data and audit near duplicates.

Assign writer, capture-session/source group and duplicate/augmentation families to calibration OR holdout, never both. Do not use dataset-wide source names as capture-family group IDs. Freeze the lesson target independently of the prediction. Cover all categories/classes; agree acceptable error rates, confidence intervals, sample sizes and device requirements with reviewers before examining the holdout. The software has no invented sample-size or error-rate approval rule.

Copy `reviewed-manifest.template.json` outside the repository or to your approved data location and populate `records`. The empty template intentionally fails validation. Each record requires:

| Field | Meaning |
|---|---|
| id | Unique sample ID |
| split | `calibration` or `holdout` |
| category | `valid`, `imperfect-recognizable`, `incomplete`, `random-scribble`, `unrelated-shape` |
| valid | Independent boolean label; true only for first two categories |
| trueLabel | Canonical class for valid samples, from `id_to_label.json` |
| target | Predeclared lesson target, not classifier-selected |
| reviewers | At least two distinct reviewer pseudonyms |
| adjudicated | true after disagreements resolved |
| provenance / authorization | Traceable source and authorized-use references |
| trainingExcluded | true only after checking training exclusion |
| writerId / sourceGroup / duplicateFamily | Nonempty pseudonymous grouping keys |
| kind | `image` or `strokes` |
| file | Path relative to manifest (or absolute local path) |
| sha256 | SHA-256 of the exact input file |

`image` is a browser-decodable RGBA/grayscale image of ink alone, no tracing-guide overlay. Its image bytes are decoded and processed by production preprocessing. Image-only samples cannot prove stroke sufficiency, so mastery metrics are null/unmeasurable for them; model validity/classification metrics remain available. `strokes` is a JSON file containing `{ "strokes": [...], "geometry": { "width": ..., "height": ... } }`, with normalized x/y points and optional monotonic timestamps as captured by BAYA. Both models receive the production capture tensor. Preserve raw captures rather than reconstructing strokes from an image. Do not represent two copies of one stroke attempt as two independent mastery trials.

## Evaluate with locked research thresholds

`node scripts/testing/compliance-12-validation/run.mjs <reviewed-manifest.json> <new-output-directory>`

Requires installed Chrome, Node and repository dependencies. The server binds loopback and the browser uses a fresh temporary profile. Inputs remain local. The tool rejects missing review, hash mismatches, duplicate byte content, conflicting labels, missing partitions and writer/source/family leakage before inference. It also checks decoded/preprocessed tensor duplicates across splits. Reviewer declarations do not prove authentic review; audit source records separately. Exact hashes cannot detect every near duplicate.

`frozen-run.json` records the input manifest hash and exact research thresholds before inference. `results.json` includes model hashes, per-sample scores, partition/category/target metrics and duplicate tensors. Thresholds are not tuned on holdout and no automatic promotion occurs. Use calibration results to propose a separately reviewed recalibration study; do not repeatedly tune against this holdout. Any future changed threshold set must be versioned and frozen before a new untouched holdout. This runner intentionally evaluates the existing thresholds only.

Metric definitions:

- Invalid-input acceptance = independent invalid samples scoring pass / scored invalid samples.
- Valid hard rejection = valid samples below reject threshold / scored valid samples.
- Valid non-pass = valid samples in review OR reject / scored valid samples. This is the effective withholding rate for the current experimental pipeline.
- Target-conditioned false mastery = independently invalid captured-stroke attempts satisfying production sufficiency, recognized confidence and the predeclared target / invalid captured-stroke attempts; reported both without the gate and with research pass required, per target and overall.
- Counts/rates for empty denominators are explicit `0/0` with rate `null`, never 0% success. Model inference failures and insufficient inputs are separately counted as not scored. These cannot earn mastery. A one-attempt award metric is not a measured two-attempt completion rate. Failed image-only cases also remain unmeasurable for mastery because stroke sufficiency is unavailable.

Inspect every error and missing category before interpreting results. `productionApproval:false` remains even with complete data; sufficiency of validation requires human review of sampling, labels, uncertainty, failures and agreed criteria. Rates on correlated samples are not independent population estimates.

## Verification

- `node --test scripts/testing/compliance-12-validation/evaluation.test.mjs` checks label prerequisites, leakage, hashes, denominators and missing evidence using explicitly mock metadata inputs; never accuracy data.
- `node scripts/testing/verify-dual-resnet-browser.mjs` checks actual WASM/Python parity and session reuse.
- Start `node scripts/testing/compliance-12-validation/ui-server.mjs` in a separate terminal, then run `node scripts/testing/compliance-12-validation/ui-fixtures.mjs` followed by `node scripts/testing/compliance-12-validation/ui-real.mjs`.

The UI server serves the final web export at port 5082 and starts isolated headless Chrome on debugging port 9358. Fixture tests inject documented output states only for UI/persistence barriers. Real tests use actual model inference for the wave, retry, blank/dot checks and cached offline inference. Wave pointer coordinates preserve the original 2:1 input proportions across canvas sizes; initial unadjusted geometry produced BA and is retained as a failed reproduction in evidence. Stop the server afterward. No user profile/database or cloud workspace is used.
