# BAYA machine learning

The hybrid pipeline keeps both artifacts from each attempt:

- `images/attempt_<attemptId>.png` is standardized by
  `ml.preprocessing.images` to `224 x 224 x 3`, RGB, float32, and `/255` for
  the existing MobileNetV2 classifier. The model contains no internal
  `Rescaling` layer, so external `/255` is required. Non-square legacy images
  are white-letterboxed before resizing; current square collection images are
  resized square-to-square.
- Raw `strokes` plus `canvasWidth` and `canvasHeight` are transformed by
  `ml.preprocessing.tracing`. Raw exports are never overwritten or augmented
  with normalized coordinates.

Schema version 2 is the current collection format. The preprocessing boundary
also accepts explicit version-1 attempts and treats a missing `schemaVersion`
as version 1 for the earliest legacy exports. This compatibility is read-only:
it never relabels or rewrites the source record.

## Temporal features

The baseline feature order is:

`x_norm, y_norm, dx, dy, dt_ms, stroke_start, pen_up`

`x_norm = x / canvasWidth` and `y_norm = y / canvasHeight`. At each stroke
start, `dx` and `dy` are zero, so separate strokes are never connected by a
false movement. A separate `pen_up` event repeats the final location and uses
the recorder's real `endedAtMs`; `dt_ms` therefore retains stroke-end timing
and genuine inter-stroke pauses.

`screenWidth`, `screenHeight`, `pixelRatio`, and `layoutMode` remain available
to the dataset auditor, but they are not trajectory model features. They must
not be introduced as classifier inputs without a separate, reviewed research
decision because they can encode device identity.

Sequences remain variable length. `pad_feature_sequences` pads only at batch
time and returns an explicit boolean mask. It refuses to truncate. This is the
initial strategy because it preserves every collected point and boundary;
resampling can be evaluated later as a versioned experiment. Its `max_length`
parameter is configurable; when omitted, the current batch maximum is used, so
no unexplained dataset-wide sequence limit is hard-coded.

`dt_ms` remains genuine elapsed time. If training benefits from scaling or a
log transform, fit that transform on the training split only and version it
with the model; never replace the recorded timestamps in the raw dataset.

Character centering/scaling is implemented as an opt-in experiment. It uses
one isotropic scale for both axes and preserves all stroke relationships. It
is disabled by default until validation shows that removing placement/size
variation improves generalization without erasing useful Baybayin or kudlit
signals.

## Validation

Run the automated suite from the repository root:

```text
python -m unittest discover -s ml/tests -v
```

Audit a real export (JSON or ZIP) and print pairing, bounds, and normalized
geometry diagnostics:

```text
python -m ml.scripts.audit_device_independence path/to/BAYA_dataset.zip
```

The report includes schema versions, targets, attempt ordinals, canvas and
screen sizes, layout-mode groups, per-attempt point/stroke/duration values,
point-count percentiles, missing/orphan images, duplicate IDs, invalid
coordinates, and timing violations. Auditing is read-only.
