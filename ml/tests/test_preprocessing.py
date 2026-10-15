from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path


from ml.preprocessing.tracing import (
    CURRENT_ATTEMPT_SCHEMA_VERSION,
    get_attempt_schema_version,
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


class RawAttemptValidationTests(unittest.TestCase):













    def test_summary_reports_raw_and_normalized_geometry(self) -> None:
        summary = summarize_attempt(make_attempt(200, [(50, 50), (150, 100)]))
        self.assertEqual(summary["rawBoundingBox"], [50, 50, 150, 100])
        self.assertEqual(summary["normalizedBoundingBox"], [0.25, 0.25, 0.75, 0.5])
        self.assertEqual(summary["normalizedCenter"], [0.5, 0.375])




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
