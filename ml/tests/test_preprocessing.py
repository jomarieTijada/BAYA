from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path

import cv2
import numpy as np

from ml.preprocessing.images import load_image_config, preprocess_png
from ml.preprocessing.tracing import (
    CURRENT_ATTEMPT_SCHEMA_VERSION,
    FEATURE_NAMES,
    TraceValidationError,
    get_attempt_schema_version,
    normalize_trace,
    pad_feature_sequences,
    summarize_attempt,
    validate_attempt,
)
from ml.scripts.audit_device_independence import audit


def make_attempt(
    canvas_size: float,
    coordinates: list[tuple[float, float]],
    *,
    schema_version: int = CURRENT_ATTEMPT_SCHEMA_VERSION,
    attempt_number: int | None = 1,
    layout_mode: str = "compact",
    screen_size: tuple[float, float] = (759, 351),
    pixel_ratio: float = 3.08,
) -> dict:
    points = [
        {"x": x, "y": y, "t": index * 10.0}
        for index, (x, y) in enumerate(coordinates)
    ]
    ended = points[-1]["t"] + 5.0
    return {
        "schemaVersion": schema_version,
        "attemptId": f"synthetic-{canvas_size}",
        "attemptNumber": attempt_number,
        "targetClass": "a",
        "canvasWidth": canvas_size,
        "canvasHeight": canvas_size,
        "screenWidth": screen_size[0],
        "screenHeight": screen_size[1],
        "pixelRatio": pixel_ratio,
        "layoutMode": layout_mode,
        "durationMs": ended,
        "strokes": [
            {
                "strokeId": 0,
                "startedAtMs": 0.0,
                "endedAtMs": ended,
                "points": points,
            }
        ],
    }


class TracePreprocessingTests(unittest.TestCase):
    def test_equivalent_phone_and_tablet_traces_normalize_identically(self) -> None:
        phone_size = 198.65
        tablet_size = 432.16
        proportions = [(0.25, 0.25), (0.5, 0.5), (0.75, 0.75)]
        phone = make_attempt(
            phone_size,
            [(x * phone_size, y * phone_size) for x, y in proportions],
            layout_mode="compact",
            screen_size=(759, 351),
            pixel_ratio=3.08,
        )
        tablet = make_attempt(
            tablet_size,
            [(x * tablet_size, y * tablet_size) for x, y in proportions],
            layout_mode="tablet",
            screen_size=(1094, 653),
            pixel_ratio=1.23,
        )
        phone_features = normalize_trace(phone).values
        tablet_features = normalize_trace(tablet).values
        np.testing.assert_allclose(phone_features, tablet_features, atol=1e-7)
        np.testing.assert_allclose(
            phone_features[:3, :2],
            [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
        )

    def test_boundaries_do_not_create_spatial_jumps(self) -> None:
        attempt = {
            "attemptId": "two-strokes",
            "targetClass": "a",
            "canvasWidth": 200,
            "canvasHeight": 200,
            "durationMs": 70,
            "strokes": [
                {
                    "strokeId": 0,
                    "startedAtMs": 0,
                    "endedAtMs": 20,
                    "points": [{"x": 180, "y": 180, "t": 0}],
                },
                {
                    "strokeId": 1,
                    "startedAtMs": 50,
                    "endedAtMs": 70,
                    "points": [{"x": 20, "y": 20, "t": 50}],
                },
            ],
        }
        features = normalize_trace(attempt).values
        start_index = FEATURE_NAMES.index("stroke_start")
        pen_up_index = FEATURE_NAMES.index("pen_up")
        second_start = features[2]
        self.assertEqual(second_start[start_index], 1)
        self.assertEqual(second_start[2], 0)  # dx
        self.assertEqual(second_start[3], 0)  # dy
        self.assertEqual(second_start[4], 30)  # real inter-stroke pause
        self.assertEqual(int(features[:, pen_up_index].sum()), 2)

    def test_padding_returns_mask_and_refuses_truncation(self) -> None:
        short = normalize_trace(make_attempt(200, [(50, 50)]))
        long = normalize_trace(make_attempt(400, [(100, 100), (200, 200)]))
        padded, mask = pad_feature_sequences([short, long])
        self.assertEqual(padded.shape, (2, 3, len(FEATURE_NAMES)))
        self.assertEqual(mask.tolist(), [[True, True, False], [True, True, True]])
        with self.assertRaises(ValueError):
            pad_feature_sequences([short, long], max_length=2)

    def test_phone_and_tablet_point_counts_share_one_padded_batch(self) -> None:
        phone_coordinates = [
            (198.65 * index / 169, 198.65 * index / 169)
            for index in range(170)
        ]
        tablet_coordinates = [
            (432.16 * index / 69, 432.16 * index / 69)
            for index in range(70)
        ]
        phone = normalize_trace(make_attempt(198.65, phone_coordinates))
        tablet = normalize_trace(
            make_attempt(
                432.16,
                tablet_coordinates,
                layout_mode="tablet",
                screen_size=(1094, 653),
                pixel_ratio=1.23,
            )
        )

        padded, mask = pad_feature_sequences([phone, tablet])
        self.assertEqual(padded.shape, (2, 171, len(FEATURE_NAMES)))
        self.assertEqual(mask.sum(axis=1).tolist(), [171, 71])
        self.assertTrue(np.all(padded[1, 71:] == 0))

    def test_three_strokes_preserve_order_boundaries_and_timing(self) -> None:
        attempt = make_attempt(200, [(20, 20)])
        attempt["durationMs"] = 80
        attempt["strokes"] = [
            {
                "strokeId": 0,
                "startedAtMs": 0,
                "endedAtMs": 20,
                "points": [
                    {"x": 20, "y": 20, "t": 0},
                    {"x": 40, "y": 40, "t": 10},
                ],
            },
            {
                "strokeId": 1,
                "startedAtMs": 40,
                "endedAtMs": 55,
                "points": [
                    {"x": 160, "y": 20, "t": 40},
                    {"x": 140, "y": 40, "t": 50},
                ],
            },
            {
                "strokeId": 2,
                "startedAtMs": 70,
                "endedAtMs": 80,
                "points": [{"x": 100, "y": 160, "t": 70}],
            },
        ]

        features = normalize_trace(attempt)
        self.assertEqual(features.stroke_ids.tolist(), [0, 0, 0, 1, 1, 1, 2, 2])
        self.assertTrue(np.all(np.diff(features.timestamps_ms) >= 0))
        self.assertAlmostEqual(float(features.values[:, FEATURE_NAMES.index("dt_ms")].sum()), 80)
        self.assertEqual(
            np.flatnonzero(features.values[:, FEATURE_NAMES.index("pen_up")]).tolist(),
            [2, 5, 7],
        )
        for index in (0, 3, 6):
            self.assertEqual(features.values[index, FEATURE_NAMES.index("stroke_start")], 1)
            self.assertEqual(features.values[index, FEATURE_NAMES.index("dx")], 0)
            self.assertEqual(features.values[index, FEATURE_NAMES.index("dy")], 0)

    def test_legacy_v1_and_current_v2_use_the_same_pipeline(self) -> None:
        legacy = make_attempt(200, [(50, 50), (100, 100)], schema_version=1, attempt_number=None)
        current = make_attempt(400, [(100, 100), (200, 200)], schema_version=2, attempt_number=1)

        self.assertEqual(get_attempt_schema_version(legacy), 1)
        self.assertEqual(get_attempt_schema_version(current), 2)
        self.assertEqual(validate_attempt(legacy), [])
        self.assertEqual(validate_attempt(current), [])
        np.testing.assert_allclose(normalize_trace(legacy).values, normalize_trace(current).values)

    def test_missing_schema_version_is_read_as_legacy_without_mutation(self) -> None:
        legacy = make_attempt(200, [(50, 50)])
        del legacy["schemaVersion"]
        before = json.dumps(legacy, sort_keys=True)
        self.assertEqual(get_attempt_schema_version(legacy), 1)
        normalize_trace(legacy)
        self.assertEqual(json.dumps(legacy, sort_keys=True), before)

    def test_unsupported_schema_version_is_rejected(self) -> None:
        attempt = make_attempt(200, [(50, 50)], schema_version=3)
        with self.assertRaises(TraceValidationError):
            normalize_trace(attempt)

    def test_five_attempts_remain_five_independent_sequences(self) -> None:
        attempts = []
        for attempt_number in range(1, 6):
            current = make_attempt(
                200,
                [(20 + attempt_number, 20), (100, 100)],
                attempt_number=attempt_number,
            )
            current["attemptId"] = f"a-{attempt_number}"
            attempts.append(current)

        sequences = [normalize_trace(attempt) for attempt in attempts]
        self.assertEqual(len(sequences), 5)
        self.assertEqual([attempt["attemptId"] for attempt in attempts], ["a-1", "a-2", "a-3", "a-4", "a-5"])
        self.assertTrue(all(sequence.values.shape == (3, len(FEATURE_NAMES)) for sequence in sequences))

    def test_tiny_edge_overshoot_is_clipped_only_in_derived_features(self) -> None:
        attempt = make_attempt(200, [(-0.25, 200.25)])
        raw_before = json.dumps(attempt, sort_keys=True)
        features = normalize_trace(attempt).values
        np.testing.assert_allclose(features[0, :2], [0.0, 1.0])
        self.assertEqual(json.dumps(attempt, sort_keys=True), raw_before)

    def test_non_finite_coordinate_is_rejected(self) -> None:
        attempt = make_attempt(200, [(float("nan"), 100)])
        with self.assertRaises(TraceValidationError):
            normalize_trace(attempt)

    def test_optional_centering_uses_isotropic_scale(self) -> None:
        attempt = make_attempt(200, [(20, 40), (120, 90)])
        centered = normalize_trace(attempt, center_and_scale=True).values[:2, :2]
        original_delta = np.array([0.5, 0.25])
        centered_delta = centered[1] - centered[0]
        self.assertAlmostEqual(centered_delta[0] / original_delta[0], centered_delta[1] / original_delta[1])

    def test_out_of_bounds_raw_trace_is_rejected(self) -> None:
        attempt = make_attempt(200, [(50, 50), (250, 100)])
        with self.assertRaises(TraceValidationError):
            normalize_trace(attempt)

    def test_summary_reports_raw_and_normalized_geometry(self) -> None:
        summary = summarize_attempt(make_attempt(200, [(50, 50), (150, 100)]))
        self.assertEqual(summary["rawBoundingBox"], [50, 50, 150, 100])
        self.assertEqual(summary["normalizedBoundingBox"], [0.25, 0.25, 0.75, 0.5])
        self.assertEqual(summary["normalizedCenter"], [0.5, 0.375])


class ImagePreprocessingTests(unittest.TestCase):
    def test_png_becomes_224_rgb_float_divided_by_255(self) -> None:
        bgr = np.full((200, 200, 3), [10, 20, 30], dtype=np.uint8)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.png"
            self.assertTrue(cv2.imwrite(str(path), bgr))
            result = preprocess_png(path)
        self.assertEqual(result.shape, (224, 224, 3))
        self.assertEqual(result.dtype, np.float32)
        np.testing.assert_allclose(result[0, 0], np.array([30, 20, 10]) / 255.0)
        self.assertGreaterEqual(float(result.min()), 0.0)
        self.assertLessEqual(float(result.max()), 1.0)

    def test_scaled_equivalent_source_resolutions_produce_same_tensor(self) -> None:
        phone = np.full((200, 200, 3), 255, dtype=np.uint8)
        phone[50:150, 80:120] = 0
        tablet = np.repeat(np.repeat(phone, 2, axis=0), 2, axis=1)
        with tempfile.TemporaryDirectory() as directory:
            phone_path = Path(directory) / "phone.png"
            tablet_path = Path(directory) / "tablet.png"
            self.assertTrue(cv2.imwrite(str(phone_path), phone))
            self.assertTrue(cv2.imwrite(str(tablet_path), tablet))
            phone_tensor = preprocess_png(phone_path)
            tablet_tensor = preprocess_png(tablet_path)
        np.testing.assert_array_equal(phone_tensor, tablet_tensor)

    def test_non_square_legacy_image_is_letterboxed_not_stretched(self) -> None:
        bgr = np.zeros((100, 200, 3), dtype=np.uint8)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "wide.png"
            self.assertTrue(cv2.imwrite(str(path), bgr))
            result = preprocess_png(path)
        np.testing.assert_allclose(result[0, 0], [1.0, 1.0, 1.0])
        np.testing.assert_allclose(result[112, 112], [0.0, 0.0, 0.0])

    def test_model_has_no_internal_rescaling_layer(self) -> None:
        config = load_image_config()
        self.assertAlmostEqual(config["external_rescale"], 1 / 255)
        model_path = Path("ml/models/v1/Baybayin_MobileNetV2_v1.keras")
        with zipfile.ZipFile(model_path) as archive:
            model_config = json.loads(archive.read("config.json"))
        self.assertNotIn('"class_name": "Rescaling"', json.dumps(model_config))


class ExportAuditTests(unittest.TestCase):
    def test_matched_zip_pair_passes_audit(self) -> None:
        attempt = make_attempt(200, [(50, 50), (100, 100)])
        attempt["imageUri"] = "images/attempt_synthetic-200.png"
        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "export.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("attempts.json", json.dumps([attempt]))
                archive.writestr("images/attempt_synthetic-200.png", b"synthetic")
            report = audit(archive_path)
        self.assertEqual(report["pairingErrors"], [])
        self.assertEqual(report["invalidAttemptCount"], 0)

    def test_five_version_two_attempts_have_unique_ordinals_and_images(self) -> None:
        attempts = []
        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "five-attempt-export.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                for attempt_number in range(1, 6):
                    current = make_attempt(200, [(50, 50), (100, 100)])
                    current["attemptId"] = f"a-{attempt_number}"
                    current["schemaVersion"] = 2
                    current["attemptNumber"] = attempt_number
                    current["imageUri"] = f"images/attempt_a-{attempt_number}.png"
                    attempts.append(current)
                    archive.writestr(
                        f"images/attempt_a-{attempt_number}.png",
                        b"synthetic",
                    )
                archive.writestr("attempts.json", json.dumps(attempts))
            report = audit(archive_path)
        self.assertEqual(report["attemptCount"], 5)
        self.assertEqual(report["pairingErrors"], [])
        self.assertEqual(report["invalidAttemptCount"], 0)

    def test_version_two_duplicate_ordinal_fails_audit(self) -> None:
        attempts = []
        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "duplicate-ordinal.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                for attempt_id in ("a-first", "a-duplicate"):
                    current = make_attempt(200, [(50, 50), (100, 100)])
                    current["attemptId"] = attempt_id
                    current["schemaVersion"] = 2
                    current["attemptNumber"] = 1
                    current["imageUri"] = f"images/attempt_{attempt_id}.png"
                    attempts.append(current)
                    archive.writestr(
                        f"images/attempt_{attempt_id}.png",
                        b"synthetic",
                    )
                archive.writestr("attempts.json", json.dumps(attempts))
            report = audit(archive_path)
        self.assertIn(
            "duplicate attemptNumber for target a: 1",
            report["pairingErrors"],
        )

    def test_mixed_schema_dataset_reports_device_and_point_statistics(self) -> None:
        phone = make_attempt(
            198.65,
            [(198.65 * index / 69, 100) for index in range(70)],
            schema_version=1,
            attempt_number=None,
        )
        phone["attemptId"] = "phone-v1"
        phone["imageUri"] = "images/attempt_phone-v1.png"
        tablet = make_attempt(
            432.16,
            [(432.16 * index / 169, 200) for index in range(170)],
            schema_version=2,
            attempt_number=2,
            layout_mode="tablet",
            screen_size=(1094, 653),
            pixel_ratio=1.23,
        )
        tablet["attemptId"] = "tablet-v2"
        tablet["imageUri"] = "images/attempt_tablet-v2.png"

        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "mixed-device-export.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("attempts.json", json.dumps([phone, tablet]))
                archive.writestr("images/attempt_phone-v1.png", b"synthetic")
                archive.writestr("images/attempt_tablet-v2.png", b"synthetic")
            report = audit(archive_path)

        self.assertEqual(report["schemaVersionsFound"], [1, 2])
        self.assertEqual(report["schemaVersionCounts"], {"1": 1, "2": 1})
        self.assertEqual(report["attemptCountsPerClass"], {"a": 2})
        self.assertEqual(report["layoutModes"], {"compact": 1, "tablet": 1})
        self.assertEqual(report["pointCountStatistics"]["min"], 70)
        self.assertEqual(report["pointCountStatistics"]["max"], 170)
        self.assertEqual(report["pointCountStatistics"]["mean"], 120)
        self.assertEqual(report["missingImages"], [])
        self.assertEqual(report["coordinateErrors"], [])
        self.assertEqual(report["invalidTimestamps"], [])
        self.assertEqual(report["invalidAttemptCount"], 0)

    def test_auditor_reports_missing_image_duplicate_id_bad_ordinal_bounds_and_time(self) -> None:
        valid = make_attempt(200, [(50, 50), (100, 100)])
        valid["attemptId"] = "duplicate-id"
        valid["imageUri"] = "images/attempt_duplicate-id.png"
        invalid = make_attempt(200, [(50, 50), (202, 100)], attempt_number=6)
        invalid["attemptId"] = "duplicate-id"
        invalid["imageUri"] = "images/attempt_duplicate-id.png"
        invalid["strokes"][0]["points"][1]["t"] = -1

        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "invalid-export.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("attempts.json", json.dumps([valid, invalid]))
            report = audit(archive_path)

        self.assertEqual(report["duplicateAttemptIds"], ["duplicate-id"])
        self.assertEqual(report["missingImages"], ["duplicate-id", "duplicate-id"])
        self.assertEqual(len(report["invalidAttemptNumbers"]), 1)
        self.assertGreaterEqual(len(report["outOfRangeNormalizedCoordinates"]), 1)
        self.assertGreaterEqual(len(report["invalidTimestamps"]), 1)


if __name__ == "__main__":
    unittest.main()
