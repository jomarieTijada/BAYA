"""Preprocess raw BAYA stroke traces without modifying the collected data.

The exported ``x`` and ``y`` values are canvas-local logical pixels. This
module is the boundary where they become device-independent model features.
Stroke-end rows are derived from the recorder's real ``endedAtMs`` values so
the sequence retains lift timing and inter-stroke pauses without inventing
timestamps or connecting separate strokes spatially.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Any, Mapping, Sequence

import numpy as np
from numpy.typing import NDArray


FEATURE_NAMES = (
    "x_norm",
    "y_norm",
    "dx",
    "dy",
    "dt_ms",
    "stroke_start",
    "pen_up",
)

LEGACY_ATTEMPT_SCHEMA_VERSION = 1
CURRENT_ATTEMPT_SCHEMA_VERSION = 2
SUPPORTED_ATTEMPT_SCHEMA_VERSIONS = frozenset(
    {LEGACY_ATTEMPT_SCHEMA_VERSION, CURRENT_ATTEMPT_SCHEMA_VERSION}
)
ATTEMPTS_PER_CHARACTER = 5


class TraceValidationError(ValueError):
    """Raised when an attempt cannot be safely transformed."""

    def __init__(self, errors: Sequence[str]):
        self.errors = tuple(errors)
        super().__init__("Invalid handwriting trace: " + "; ".join(self.errors))


@dataclass(frozen=True)
class TraceFeatures:
    """A variable-length temporal feature sequence and its event metadata."""

    values: NDArray[np.float32]
    stroke_ids: NDArray[np.int32]
    timestamps_ms: NDArray[np.float32]
    feature_names: tuple[str, ...] = FEATURE_NAMES


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


def _normalized_points(
    attempt: Mapping[str, Any],
    *,
    center_and_scale: bool,
    target_extent: float,
) -> list[list[tuple[float, float, float]]]:
    width = float(attempt["canvasWidth"])
    height = float(attempt["canvasHeight"])
    strokes: list[list[tuple[float, float, float]]] = []
    flat_xy: list[tuple[float, float]] = []

    for stroke in attempt["strokes"]:
        normalized_stroke: list[tuple[float, float, float]] = []
        for point in stroke["points"]:
            # Validation permits only sub-pixel excursions. Clip those in the
            # derived representation; the raw export is never changed.
            x_norm = min(1.0, max(0.0, float(point["x"]) / width))
            y_norm = min(1.0, max(0.0, float(point["y"]) / height))
            timestamp = float(point["t"])
            normalized_stroke.append((x_norm, y_norm, timestamp))
            flat_xy.append((x_norm, y_norm))
        strokes.append(normalized_stroke)

    if not center_and_scale:
        return strokes
    if not 0 < target_extent <= 1:
        raise ValueError("target_extent must be in (0, 1]")

    xs, ys = zip(*flat_xy)
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    largest_extent = max(max_x - min_x, max_y - min_y)
    scale = target_extent / largest_extent if largest_extent > 1e-12 else 1.0

    # One isotropic scale is used for both axes. This preserves aspect ratio,
    # stroke relationships, and kudlit placement.
    return [
        [
            (
                (x_norm - center_x) * scale + 0.5,
                (y_norm - center_y) * scale + 0.5,
                timestamp,
            )
            for x_norm, y_norm, timestamp in stroke
        ]
        for stroke in strokes
    ]


def normalize_trace(
    attempt: Mapping[str, Any],
    *,
    center_and_scale: bool = False,
    target_extent: float = 0.8,
) -> TraceFeatures:
    """Convert one raw attempt into device-independent LSTM event features.

    ``center_and_scale`` is deliberately opt-in. Canvas normalization is the
    canonical baseline; centering must be evaluated as an experiment because
    absolute placement and writing size may contain useful handwriting signal.
    """

    errors = validate_attempt(attempt)
    if errors:
        raise TraceValidationError(errors)

    normalized = _normalized_points(
        attempt,
        center_and_scale=center_and_scale,
        target_extent=target_extent,
    )
    rows: list[list[float]] = []
    stroke_ids: list[int] = []
    timestamps: list[float] = []
    previous_event_time = 0.0

    for stroke_index, (stroke, points) in enumerate(zip(attempt["strokes"], normalized)):
        previous_x = previous_y = 0.0
        for point_index, (x_norm, y_norm, timestamp) in enumerate(points):
            is_start = point_index == 0
            dx = 0.0 if is_start else x_norm - previous_x
            dy = 0.0 if is_start else y_norm - previous_y
            dt = max(0.0, timestamp - previous_event_time)
            rows.append([x_norm, y_norm, dx, dy, dt, float(is_start), 0.0])
            stroke_ids.append(stroke_index)
            timestamps.append(timestamp)
            previous_x, previous_y = x_norm, y_norm
            previous_event_time = timestamp

        # Explicit boundary event at the real touch-up timestamp. Repeating
        # the final location with zero displacement prevents a false line to
        # the next stroke while retaining lift and pause timing.
        ended = float(stroke["endedAtMs"])
        rows.append(
            [previous_x, previous_y, 0.0, 0.0, max(0.0, ended - previous_event_time), 0.0, 1.0]
        )
        stroke_ids.append(stroke_index)
        timestamps.append(ended)
        previous_event_time = ended

    return TraceFeatures(
        values=np.asarray(rows, dtype=np.float32),
        stroke_ids=np.asarray(stroke_ids, dtype=np.int32),
        timestamps_ms=np.asarray(timestamps, dtype=np.float32),
    )


def pad_feature_sequences(
    sequences: Sequence[TraceFeatures | NDArray[np.floating[Any]]],
    *,
    max_length: int | None = None,
    pad_value: float = 0.0,
) -> tuple[NDArray[np.float32], NDArray[np.bool_]]:
    """Pad a batch and return an explicit mask without truncating raw events."""

    arrays = [item.values if isinstance(item, TraceFeatures) else np.asarray(item) for item in sequences]
    if not arrays:
        raise ValueError("at least one sequence is required")
    feature_count = len(FEATURE_NAMES)
    if any(array.ndim != 2 or array.shape[1] != feature_count for array in arrays):
        raise ValueError(f"every sequence must have shape (events, {feature_count})")

    required_length = max(array.shape[0] for array in arrays)
    target_length = required_length if max_length is None else max_length
    if target_length < required_length:
        raise ValueError(
            "max_length would truncate a sequence; choose a larger value or an explicit resampling policy"
        )

    padded = np.full(
        (len(arrays), target_length, feature_count),
        pad_value,
        dtype=np.float32,
    )
    mask = np.zeros((len(arrays), target_length), dtype=np.bool_)
    for index, array in enumerate(arrays):
        length = array.shape[0]
        padded[index, :length] = array.astype(np.float32, copy=False)
        mask[index, :length] = True
    return padded, mask


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
