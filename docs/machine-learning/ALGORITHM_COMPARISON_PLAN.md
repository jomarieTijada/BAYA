# Algorithm Comparison Plan

## Purpose

This plan defines a fair, reproducible study for choosing a BAYA handwriting evaluator. It does not select a winner or claim measured results.

## Research Objective

Compare candidate approaches for their ability to evaluate learner-drawn Baybayin characters and kudlit in a way that is accurate, responsive, explainable enough for corrective feedback, compatible with target Android devices, and practical to integrate into the planned Expo application.

## Candidate Families

- Dynamic Time Warping as a transparent sequence-alignment baseline.
- Multidimensional Dynamic Time Warping using joint coordinate or derived-feature sequences.
- Reference template matching for spatial and structural comparison.
- Statistical baselines that establish minimum performance with simple, explainable features.
- Neural models where available data, accuracy, runtime, model size, and export feasibility justify their complexity.

The comparison remains open to a hybrid only if the hybrid is separately versioned and evaluated under the same controls.

## Dataset Controls

Raw collected data is immutable. External data remains distinguishable by source and license. Processed data is derived into a new version and never overwrites raw data.

Each experiment identifies:

- Raw and external dataset versions used.
- Processed dataset version.
- Participant-aware or otherwise leakage-safe split version.
- Label and annotation-guide version.
- Exclusion and quality-control decisions.
- Preprocessing version.

Training, validation, and test boundaries must prevent the same learner or near-duplicate sample from creating misleading performance where the study design requires participant independence.

## Preprocessing Controls

Candidate comparisons use a documented common preprocessing baseline unless the experiment explicitly studies preprocessing. The recorded pipeline covers input validation, coordinate normalization, scale normalization, translation normalization, smoothing, resampling, stroke segmentation, kudlit separation, and preservation of stroke order.

If an algorithm requires a different representation, the difference is part of that candidate's version and is reported. Ablation studies change one defined factor at a time.

## Accuracy and Error Criteria

- Overall accuracy on the held-out evaluation set.
- Character-level correctness and per-character breakdown.
- Kudlit-placement performance.
- False acceptance rate.
- False rejection rate.
- Confusion or error patterns relevant to learner feedback.
- Stability across writers, devices, stroke counts, and supported variations where the dataset permits.

Thresholds and aggregation rules are defined before the final evaluation.

## Performance and Integration Criteria

- Average response time.
- High-percentile response time.
- Preprocessing, evaluator-only, and end-to-end response time.
- Model or template size.
- Peak and steady memory usage.
- Android device compatibility.
- Offline compatibility.
- Runtime and export compatibility, including ONNX only when applicable.
- Suitability for character-formation, stroke-structure, stroke-execution, and kudlit-placement feedback.
- Ease of integration into the Expo application through a replaceable adapter.
- Remote fallback feasibility when local evaluation is unavailable.

Device, operating system, runtime, build mode, warm-up, sample count, and artifact version accompany each measurement.

## Experiment Design

Every experiment receives an immutable identity and a complete configuration. The configuration names its research question, dataset and split versions, preprocessing version, algorithm or model version, parameters, controlled randomness where applicable, environment, metrics, and expected outputs.

Algorithm comparison runs use identical held-out samples and metric definitions. Repeated runs or confidence estimates are used where appropriate. Statistical analysis reports uncertainty and practical effect, not only a ranking.

Latency tests distinguish cold and warm behavior. Mobile tests prioritize representative lower-resource Android devices as well as the primary development device. Offline tests prevent hidden remote dependencies.

## Corrective Feedback Review

Technical accuracy is not the only decision factor. For sampled true acceptances, true rejections, false acceptances, and false rejections, reviewers assess whether the evaluator produces stable evidence that can support a useful learner message.

An opaque candidate with marginally higher classification accuracy may be rejected if it cannot support safe corrective feedback, exceeds resource constraints, or cannot run reliably on target devices.

## Version Attribution

Every evaluated attempt identifies the dataset context, preprocessing version, algorithm or model version, template version where applicable, configuration, and execution mode. Future production results must identify the active manifest and evaluator versions.

## Selection Process

1. Verify dataset lineage and split integrity.
2. Establish transparent baselines.
3. Evaluate all candidate families under common metrics.
4. Conduct error analysis and relevant ablations.
5. Measure target-device latency, size, memory, compatibility, and offline behavior.
6. Review corrective-feedback suitability.
7. Document limitations and trade-offs.
8. Recommend a candidate or hybrid with explicit approval criteria.
9. Create a production candidate manifest.
10. Promote only after compatibility and rollback review.

The final decision may favor different local and remote evaluators if both satisfy a shared result contract and their selection policy is documented.

## Outputs

Expected future outputs include reproducible configurations, metric definitions, evaluation tables, error analysis, compatibility results, statistical interpretation, candidate manifests, and a recommendation report. No dataset, experiment output, model, or template is created by this documentation task.
