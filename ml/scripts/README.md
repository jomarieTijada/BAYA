# ML scripts

`audit_device_independence.py` validates a BAYA `attempts.json` file or export
ZIP without modifying it. It supports legacy schema version 1 and current
version 2, and checks unique attempt/image pairing, attempt ordinals, raw trace
bounds, stroke order, and timing.

Its JSON report includes target and schema counts, canvas/screen/layout groups,
per-attempt point/stroke/duration values, min/max/mean/median and P50/P90/P95/P99
point-count statistics, missing/orphan images, duplicate IDs, invalid ordinals,
out-of-range normalized coordinates, and invalid timestamps.

Run it from the repository root:

```powershell
python -m ml.scripts.audit_device_independence path\to\BAYA_dataset.zip
```
