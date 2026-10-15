"""Read-only validation and geometry summaries of raw collected canvas metadata.

This module does not construct or transform model inputs.
"""

from __future__ import annotations

from math import isfinite
from typing import Any, Mapping



LEGACY_ATTEMPT_SCHEMA_VERSION = 1
CURRENT_ATTEMPT_SCHEMA_VERSION = 2
SUPPORTED_ATTEMPT_SCHEMA_VERSIONS = frozenset(
    {LEGACY_ATTEMPT_SCHEMA_VERSION, CURRENT_ATTEMPT_SCHEMA_VERSION}
)
ATTEMPTS_PER_CHARACTER = 5


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    result = float(value)
    return result if isfinite(result) else None


def get_attempt_schema_version(attempt: Mapping[str, Any]) -> int | None:
    """Resolve an exported schema version without changing the source record.

    The earliest BAYA exports could omit ``schemaVersion``; those records are
    treated as legacy version 1. Invalid explicit values return ``None``.
    """

    value = attempt.get("schemaVersion", LEGACY_ATTEMPT_SCHEMA_VERSION)
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value


def validate_attempt(
    attempt: Mapping[str, Any],
    *,
    coordinate_tolerance: float = 0.5,
    timing_tolerance_ms: float = 0.5,
) -> list[str]:
    """Return all schema, coordinate, boundary, and timing violations.

    A small tolerance accommodates platform gesture/layout rounding. Values
    outside that tolerance are rejected rather than silently repaired.
    """

    errors: list[str] = []
    schema_version = get_attempt_schema_version(attempt)
    if schema_version not in SUPPORTED_ATTEMPT_SCHEMA_VERSIONS:
        errors.append(f"unsupported schemaVersion {attempt.get('schemaVersion')!r}")

    attempt_number = attempt.get("attemptNumber")
    has_valid_attempt_number = (
        isinstance(attempt_number, int)
        and not isinstance(attempt_number, bool)
        and 1 <= attempt_number <= ATTEMPTS_PER_CHARACTER
    )
    if schema_version == CURRENT_ATTEMPT_SCHEMA_VERSION and not has_valid_attempt_number:
        errors.append(
            f"schemaVersion {CURRENT_ATTEMPT_SCHEMA_VERSION} requires "
            f"attemptNumber 1..{ATTEMPTS_PER_CHARACTER}"
        )
    elif schema_version == LEGACY_ATTEMPT_SCHEMA_VERSION and (
        attempt_number is not None and not has_valid_attempt_number
    ):
        errors.append(
            f"legacy attemptNumber must be null or 1..{ATTEMPTS_PER_CHARACTER}"
        )

    canvas_width = _number(attempt.get("canvasWidth"))
    canvas_height = _number(attempt.get("canvasHeight"))
    if canvas_width is None or canvas_width <= 0:
        errors.append("canvasWidth must be a finite positive number")
    if canvas_height is None or canvas_height <= 0:
        errors.append("canvasHeight must be a finite positive number")

    strokes = attempt.get("strokes")
    if not isinstance(strokes, list) or not strokes:
        errors.append("strokes must be a non-empty list")
        return errors

    previous_end = 0.0
    point_count = 0
    first_point_time: float | None = None
    for stroke_index, stroke in enumerate(strokes):
        if not isinstance(stroke, Mapping):
            errors.append(f"stroke {stroke_index} must be an object")
            continue

        stroke_id = stroke.get("strokeId")
        if stroke_id != stroke_index:
            errors.append(
                f"stroke {stroke_index} has non-sequential strokeId {stroke_id!r}"
            )

        started = _number(stroke.get("startedAtMs"))
        ended = _number(stroke.get("endedAtMs"))
        if started is None or ended is None:
            errors.append(f"stroke {stroke_index} has invalid boundary timing")
        else:
            if started < previous_end - timing_tolerance_ms:
                errors.append(f"stroke {stroke_index} starts before the prior stroke ends")
            if ended < started - timing_tolerance_ms:
                errors.append(f"stroke {stroke_index} ends before it starts")
            previous_end = ended

        points = stroke.get("points")
        if not isinstance(points, list) or not points:
            errors.append(f"stroke {stroke_index} must contain at least one point")
            continue

        previous_time = started if started is not None else 0.0
        for point_index, point in enumerate(points):
            point_count += 1
            if not isinstance(point, Mapping):
                errors.append(f"stroke {stroke_index} point {point_index} must be an object")
                continue
            x = _number(point.get("x"))
            y = _number(point.get("y"))
            timestamp = _number(point.get("t"))
            if x is None or y is None or timestamp is None:
                errors.append(
                    f"stroke {stroke_index} point {point_index} has a non-finite value"
                )
                continue
            if canvas_width is not None and not (
                -coordinate_tolerance <= x <= canvas_width + coordinate_tolerance
            ):
                errors.append(f"stroke {stroke_index} point {point_index} x is outside canvas")
            if canvas_height is not None and not (
                -coordinate_tolerance <= y <= canvas_height + coordinate_tolerance
            ):
                errors.append(f"stroke {stroke_index} point {point_index} y is outside canvas")
            if timestamp < previous_time - timing_tolerance_ms:
                errors.append(
                    f"stroke {stroke_index} point {point_index} time is non-monotonic"
                )
            if started is not None and timestamp < started - timing_tolerance_ms:
                errors.append(f"stroke {stroke_index} point {point_index} precedes touch-down")
            if ended is not None and timestamp > ended + timing_tolerance_ms:
                errors.append(f"stroke {stroke_index} point {point_index} follows touch-up")
            if first_point_time is None:
                first_point_time = timestamp
            previous_time = timestamp

    if point_count and first_point_time is not None and abs(first_point_time) > timing_tolerance_ms:
        errors.append("the first actual touch point must have t=0")

    duration = _number(attempt.get("durationMs"))
    if duration is None or duration < 0:
        errors.append("durationMs must be a finite non-negative number")
    elif abs(duration - previous_end) > timing_tolerance_ms:
        errors.append("durationMs must equal the final stroke endedAtMs")
    return errors


def summarize_attempt(attempt: Mapping[str, Any]) -> dict[str, Any]:
    """Return device-independence diagnostics for one exported attempt."""

    errors = validate_attempt(attempt)
    raw_strokes = attempt.get("strokes", [])
    safe_strokes = raw_strokes if isinstance(raw_strokes, list) else []
    raw_points: list[Mapping[str, Any]] = []
    for stroke in safe_strokes:
        if not isinstance(stroke, Mapping):
            continue
        stroke_points = stroke.get("points")
        if not isinstance(stroke_points, list):
            continue
        raw_points.extend(point for point in stroke_points if isinstance(point, Mapping))
    points = [
        point
        for point in raw_points
        if _number(point.get("x")) is not None and _number(point.get("y")) is not None
    ]
    summary: dict[str, Any] = {
        "schemaVersion": get_attempt_schema_version(attempt),
        "attemptId": attempt.get("attemptId"),
        "attemptNumber": attempt.get("attemptNumber"),
        "targetClass": attempt.get("targetClass"),
        "canvasWidth": attempt.get("canvasWidth"),
        "canvasHeight": attempt.get("canvasHeight"),
        "screenWidth": attempt.get("screenWidth"),
        "screenHeight": attempt.get("screenHeight"),
        "pixelRatio": attempt.get("pixelRatio"),
        "layoutMode": attempt.get("layoutMode"),
        "durationMs": attempt.get("durationMs"),
        "strokeCount": len(safe_strokes),
        "pointCount": len(raw_points),
        "validationErrors": errors,
    }
    canvas_width = _number(attempt.get("canvasWidth"))
    canvas_height = _number(attempt.get("canvasHeight"))
    if (
        not points
        or canvas_width is None
        or canvas_height is None
        or canvas_width <= 0
        or canvas_height <= 0
    ):
        return summary

    xs = [float(point["x"]) for point in points]
    ys = [float(point["y"]) for point in points]
    width = canvas_width
    height = canvas_height
    raw_bbox = [min(xs), min(ys), max(xs), max(ys)]
    normalized_bbox = [
        raw_bbox[0] / width,
        raw_bbox[1] / height,
        raw_bbox[2] / width,
        raw_bbox[3] / height,
    ]
    summary.update(
        {
            "rawBoundingBox": raw_bbox,
            "normalizedBoundingBox": normalized_bbox,
            "normalizedCenter": [
                (normalized_bbox[0] + normalized_bbox[2]) / 2.0,
                (normalized_bbox[1] + normalized_bbox[3]) / 2.0,
            ],
            "normalizedCharacterWidth": normalized_bbox[2] - normalized_bbox[0],
            "normalizedCharacterHeight": normalized_bbox[3] - normalized_bbox[1],
        }
    )
    return summary
