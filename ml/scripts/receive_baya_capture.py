"""Receive one development-only browser capture on localhost and then exit."""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import re


DESTINATION = Path(__file__).resolve().parents[1] / "diagnostics" / "captures"
MAX_BYTES = 5_000_000
ALLOWED_ORIGINS = {"http://localhost:8081", "http://127.0.0.1:8081"}


class CaptureHandler(BaseHTTPRequestHandler):
    def _cors(self) -> None:
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def do_OPTIONS(self) -> None:
        if self.path != "/capture" or self.headers.get("Origin") not in ALLOWED_ORIGINS:
            self.send_error(403)
            return
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:
        if self.path != "/capture" or self.headers.get("Origin") not in ALLOWED_ORIGINS:
            self.send_error(403)
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BYTES:
            self.send_error(413)
            return
        try:
            body = self.rfile.read(length)
            capture = json.loads(body)
            if capture.get("schemaVersion") != 1 or capture.get("targetClass") != "ka":
                raise ValueError("Expected a version 1 KA capture")
            stamp = re.sub(r"[^0-9TZ-]", "-", capture["capturedAt"])
            DESTINATION.mkdir(parents=True, exist_ok=True)
            path = DESTINATION / f"baya-capture-ka-{stamp}.json"
            path.write_bytes(body)
        except (ValueError, KeyError, TypeError) as error:
            self.send_error(400, str(error))
            return
        self.send_response(201)
        self._cors()
        self.end_headers()
        self.wfile.write(b"saved")
        print(path, flush=True)
        self.server.capture_path = path
        self.server.shutdown_requested = True


def main() -> None:
    server = HTTPServer(("127.0.0.1", 8765), CaptureHandler)
    server.timeout = 1
    server.shutdown_requested = False
    server.capture_path = None
    print(f"Waiting for one KA capture at http://127.0.0.1:8765/capture -> {DESTINATION}", flush=True)
    try:
        while not server.shutdown_requested:
            server.handle_request()
    finally:
        server.server_close()
    if server.capture_path is not None:
        from ml.scripts.diagnose_baya_capture import compare_notebook
        compare_notebook(server.capture_path)


if __name__ == "__main__":
    main()
