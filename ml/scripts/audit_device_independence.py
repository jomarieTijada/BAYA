"""Audit a BAYA attempts.json file or exported ZIP without modifying it.

Usage:
    python -m ml.scripts.audit_device_independence path/to/attempts.json
    python -m ml.scripts.audit_device_independence path/to/BAYA_dataset.zip
"""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
from collections import Counter, defaultdict
from math import floor, isfinite
from pathlib import Path, PurePosixPath
from statistics import mean, median
from typing import Any, Iterable, Mapping

from ml.preprocessing.tracing import (
    ATTEMPTS_PER_CHARACTER,
    CURRENT_ATTEMPT_SCHEMA_VERSION,
    LEGACY_ATTEMPT_SCHEMA_VERSION,
    SUPPORTED_ATTEMPT_SCHEMA_VERSIONS,
    get_attempt_schema_version,
    summarize_attempt,
)


def _load(source: Path) -> tuple[list[dict[str, Any]], set[str] | None]:
    if source.suffix.lower() == ".zip":
        with zipfile.ZipFile(source) as archive:
            attempts = json.loads(archive.read("attempts.json"))
            names = set(archive.namelist())
        return attempts, names
    return json.loads(source.read_text(encoding="utf-8")), None


def _finite_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if isfinite(number) else None


def _percentile(sorted_values: list[float], percentile: float) -> float | None:
    if not sorted_values:
        return None
    position = (len(sorted_values) - 1) * percentile / 100.0
    lower = floor(position)
    upper = min(lower + 1, len(sorted_values) - 1)
    fraction = position - lower
    return sorted_values[lower] * (1.0 - fraction) + sorted_values[upper] * fraction


def _distribution(values: Iterable[int | float]) -> dict[str, int | float | None]:
    ordered = sorted(float(value) for value in values)
    if not ordered:
        return {
            "count": 0,
            "min": None,
            "max": None,
            "mean": None,
            "median": None,
            "p50": None,
            "p90": None,
            "p95": None,
            "p99": None,
        }
    return {
        "count": len(ordered),
        "min": ordered[0],
        "max": ordered[-1],
        "mean": mean(ordered),
        "median": median(ordered),
        "p50": _percentile(ordered, 50),
        "p90": _percentile(ordered, 90),
        "p95": _percentile(ordered, 95),
        "p99": _percentile(ordered, 99),
    }


def _size_counts(
    summaries: Iterable[Mapping[str, Any]],
    width_key: str,
    height_key: str,
) -> list[dict[str, int | float]]:
    counts: Counter[tuple[float, float]] = Counter()
    for summary in summaries:
        width = _finite_number(summary.get(width_key))
        height = _finite_number(summary.get(height_key))
        if width is not None and height is not None:
            counts[(width, height)] += 1
    return [
        {"width": width, "height": height, "count": count}
        for (width, height), count in sorted(counts.items())
    ]


def _layout_groups(summaries: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    grouped: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for summary in summaries:
        raw_layout = summary.get("layoutMode")
        layout = raw_layout if isinstance(raw_layout, str) and raw_layout else "unknown"
        grouped[layout].append(summary)

    result: dict[str, dict[str, Any]] = {}
    for layout, items in sorted(grouped.items()):
        durations = [
            value
            for item in items
            if (value := _finite_number(item.get("durationMs"))) is not None
        ]
        result[layout] = {
            "attemptCount": len(items),
            "pointCountStatistics": _distribution(item["pointCount"] for item in items),
            "strokeCountStatistics": _distribution(item["strokeCount"] for item in items),
            "durationMsStatistics": _distribution(durations),
            "canvasSizes": _size_counts(items, "canvasWidth", "canvasHeight"),
            "screenSizes": _size_counts(items, "screenWidth", "screenHeight"),
        }
    return result


def _invalid_summary(attempt_index: int) -> dict[str, Any]:
    return {
        "schemaVersion": None,
        "attemptId": None,
        "attemptNumber": None,
        "targetClass": None,
        "canvasWidth": None,
        "canvasHeight": None,
        "screenWidth": None,
        "screenHeight": None,
        "pixelRatio": None,
        "layoutMode": None,
        "durationMs": None,
        "strokeCount": 0,
        "pointCount": 0,
        "validationErrors": [f"attempt {attempt_index} must be a JSON object"],
    }


def audit(source: Path) -> dict[str, Any]:
    attempts, archive_names = _load(source)
    if not isinstance(attempts, list):
        raise ValueError("attempts.json must contain a JSON array")

    pairing_errors: list[str] = []
    schema_errors: list[str] = []
    invalid_attempt_numbers: list[str] = []
    missing_images: list[str] = []
    duplicate_attempt_ids: list[str] = []
    seen_ids: set[str] = set()
    seen_ordinals: set[tuple[str, int]] = set()
    expected_images: set[str] = set()
    schema_counts: Counter[int] = Counter()
    target_counts: Counter[str] = Counter()
    layout_counts: Counter[str] = Counter()
    summaries: list[dict[str, Any]] = []

    for attempt_index, attempt in enumerate(attempts):
        if not isinstance(attempt, dict):
            pairing_errors.append(f"attempt {attempt_index} is not a JSON object")
            summaries.append(_invalid_summary(attempt_index))
            continue

        attempt_id = attempt.get("attemptId")
        attempt_label = attempt_id if isinstance(attempt_id, str) and attempt_id else f"attempt {attempt_index}"
        schema_version = get_attempt_schema_version(attempt)
        if schema_version in SUPPORTED_ATTEMPT_SCHEMA_VERSIONS:
            schema_counts[schema_version] += 1
        else:
            schema_errors.append(
                f"{attempt_label}: unsupported schemaVersion {attempt.get('schemaVersion')!r}"
            )

        attempt_number = attempt.get("attemptNumber")
        valid_attempt_number = (
            isinstance(attempt_number, int)
            and not isinstance(attempt_number, bool)
            and 1 <= attempt_number <= ATTEMPTS_PER_CHARACTER
        )
        if schema_version == CURRENT_ATTEMPT_SCHEMA_VERSION and not valid_attempt_number:
            invalid_attempt_numbers.append(
                f"{attempt_label}: schemaVersion {CURRENT_ATTEMPT_SCHEMA_VERSION} requires "
                f"attemptNumber 1..{ATTEMPTS_PER_CHARACTER}"
            )
        elif schema_version == LEGACY_ATTEMPT_SCHEMA_VERSION and (
            attempt_number is not None and not valid_attempt_number
        ):
            invalid_attempt_numbers.append(
                f"{attempt_label}: legacy attemptNumber must be null or "
                f"1..{ATTEMPTS_PER_CHARACTER}"
            )

        target_class = attempt.get("targetClass")
        if isinstance(target_class, str) and target_class:
            target_counts[target_class] += 1
            if valid_attempt_number:
                ordinal_key = (target_class, attempt_number)
                if ordinal_key in seen_ordinals:
                    pairing_errors.append(
                        f"duplicate attemptNumber for target {target_class}: {attempt_number}"
                    )
                else:
                    seen_ordinals.add(ordinal_key)

        raw_layout = attempt.get("layoutMode")
        layout_counts[raw_layout if isinstance(raw_layout, str) and raw_layout else "unknown"] += 1

        if not isinstance(attempt_id, str) or not attempt_id:
            pairing_errors.append("attempt has a missing or invalid attemptId")
        else:
            if attempt_id in seen_ids:
                duplicate_attempt_ids.append(attempt_id)
                pairing_errors.append(f"duplicate attemptId: {attempt_id}")
            else:
                seen_ids.add(attempt_id)

            expected_image = f"images/attempt_{attempt_id}.png"
            expected_images.add(expected_image)
            image_uri = attempt.get("imageUri")
            if PurePosixPath(str(image_uri)).as_posix() != expected_image:
                pairing_errors.append(
                    f"{attempt_id}: imageUri {image_uri!r} does not match {expected_image!r}"
                )
            if archive_names is not None and expected_image not in archive_names:
                missing_images.append(attempt_id)
                pairing_errors.append(f"{attempt_id}: paired PNG is missing from the ZIP")

        summaries.append(summarize_attempt(attempt))

    archive_images = (
        {
            name
            for name in archive_names
            if name.startswith("images/") and name.lower().endswith(".png")
        }
        if archive_names is not None
        else None
    )
    orphan_images = sorted(archive_images - expected_images) if archive_images is not None else []
    pairing_errors.extend(f"orphan PNG not referenced by attempts.json: {name}" for name in orphan_images)

    coordinate_errors: list[dict[str, Any]] = []
    out_of_range: list[dict[str, Any]] = []
    invalid_timestamps: list[dict[str, Any]] = []
    for summary in summaries:
        for error in summary["validationErrors"]:
            item = {"attemptId": summary.get("attemptId"), "error": error}
            if "outside canvas" in error:
                out_of_range.append(item)
                coordinate_errors.append(item)
            elif "canvasWidth" in error or "canvasHeight" in error or "non-finite value" in error:
                coordinate_errors.append(item)
            if any(token in error for token in ("time", "touch", "durationMs")):
                invalid_timestamps.append(item)

    durations = [
        value
        for summary in summaries
        if (value := _finite_number(summary.get("durationMs"))) is not None
    ]
    point_counts = [summary["pointCount"] for summary in summaries]
    stroke_counts = [summary["strokeCount"] for summary in summaries]

    return {
        "source": str(source),
        "attemptCount": len(attempts),
        "totalAttempts": len(attempts),
        "supportedSchemaVersions": sorted(SUPPORTED_ATTEMPT_SCHEMA_VERSIONS),
        "schemaVersionsFound": sorted(schema_counts),
        "schemaVersionCounts": {str(key): schema_counts[key] for key in sorted(schema_counts)},
        "schemaErrors": schema_errors,
        "targetClasses": sorted(target_counts),
        "attemptCountsPerClass": dict(sorted(target_counts.items())),
        "canvasSizes": _size_counts(summaries, "canvasWidth", "canvasHeight"),
        "layoutModes": dict(sorted(layout_counts.items())),
        "deviceScreenSizes": _size_counts(summaries, "screenWidth", "screenHeight"),
        "pointCountsPerAttempt": [
            {"attemptId": summary.get("attemptId"), "pointCount": summary["pointCount"]}
            for summary in summaries
        ],
        "strokeCountsPerAttempt": [
            {"attemptId": summary.get("attemptId"), "strokeCount": summary["strokeCount"]}
            for summary in summaries
        ],
        "durationsMsPerAttempt": [
            {"attemptId": summary.get("attemptId"), "durationMs": summary.get("durationMs")}
            for summary in summaries
        ],
        "pointCountStatistics": _distribution(point_counts),
        "strokeCountStatistics": _distribution(stroke_counts),
        "durationMsStatistics": _distribution(durations),
        "layoutModeGroups": _layout_groups(summaries),
        "archiveImageCount": len(archive_images) if archive_images is not None else None,
        "missingImages": missing_images,
        "orphanImages": orphan_images,
        "duplicateAttemptIds": duplicate_attempt_ids,
        "invalidAttemptNumbers": invalid_attempt_numbers,
        "coordinateErrors": coordinate_errors,
        "outOfRangeNormalizedCoordinates": out_of_range,
        "invalidTimestamps": invalid_timestamps,
        "pairingErrors": pairing_errors,
        "invalidAttemptCount": sum(bool(item["validationErrors"]) for item in summaries),
        "attempts": summaries,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="attempts.json or BAYA export ZIP")
    args = parser.parse_args(argv)
    report = audit(args.source)
    print(json.dumps(report, indent=2))
    return int(
        bool(
            report["pairingErrors"]
            or report["schemaErrors"]
            or report["invalidAttemptNumbers"]
            or report["invalidAttemptCount"]
        )
    )


if __name__ == "__main__":
    sys.exit(main())
