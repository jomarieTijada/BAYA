from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path


MIGRATION_DIR = Path("packages/db/drizzle")


def apply_migration(connection: sqlite3.Connection, filename: str) -> None:
    sql = (MIGRATION_DIR / filename).read_text(encoding="utf-8")
    connection.executescript(sql.replace("--> statement-breakpoint", ""))


class HandwritingSchemaMigrationTests(unittest.TestCase):
    def test_v2_default_preserves_existing_v1_rows(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / "migration-test.sqlite"
            connection = sqlite3.connect(database_path)
            try:
                for filename in (
                    "0000_shiny_morph.sql",
                    "0001_fancy_surge.sql",
                    "0002_lovely_vermin.sql",
                    "0003_elite_storm.sql",
                ):
                    apply_migration(connection, filename)

                connection.execute(
                    """
                    INSERT INTO handwriting_samples (
                        id, target_class, strokes_json, canvas_width,
                        canvas_height, duration_ms, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    ("legacy-v1", "a", "[]", 200, 200, 0, 1),
                )
                self.assertEqual(
                    connection.execute(
                        "SELECT schema_version FROM handwriting_samples WHERE id = ?",
                        ("legacy-v1",),
                    ).fetchone(),
                    (1,),
                )

                apply_migration(connection, "0004_square_pet_avengers.sql")
                connection.execute(
                    """
                    INSERT INTO handwriting_samples (
                        id, target_class, attempt_number, strokes_json,
                        canvas_width, canvas_height, duration_ms, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    ("new-v2", "a", 1, "[]", 200, 200, 0, 2),
                )

                versions = dict(
                    connection.execute(
                        "SELECT id, schema_version FROM handwriting_samples ORDER BY id"
                    ).fetchall()
                )
                self.assertEqual(versions, {"legacy-v1": 1, "new-v2": 2})
            finally:
                connection.close()


if __name__ == "__main__":
    unittest.main()
