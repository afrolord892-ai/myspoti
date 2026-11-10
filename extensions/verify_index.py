#!/usr/bin/env python3
"""Verify the extension index against the package ZIPs committed in this repository."""
from __future__ import annotations

import hashlib
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.json"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    try:
        data = json.loads(INDEX.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"cannot read index.json: {exc}")

    if data.get("format") != 1 or not isinstance(data.get("extensions"), list):
        fail("index.json must have format=1 and an extensions array")

    seen: set[str] = set()
    for entry in data["extensions"]:
        extension_id = entry.get("id")
        if not extension_id or extension_id in seen:
            fail(f"missing or duplicate extension id: {extension_id!r}")
        seen.add(extension_id)

        url = entry.get("url", "")
        if not url or "://" in url or url.startswith("/"):
            fail(f"{extension_id}: package URL must be a relative repository path")
        package = (ROOT / url).resolve()
        if ROOT not in package.parents or not package.is_file():
            fail(f"{extension_id}: package not found or escapes repository: {url}")

        payload = package.read_bytes()
        digest = hashlib.sha256(payload).hexdigest()
        if digest != entry.get("sha256"):
            fail(f"{extension_id}: sha256 mismatch")
        if len(payload) != int(entry.get("size", -1)):
            fail(f"{extension_id}: size mismatch")

        try:
            with zipfile.ZipFile(package) as archive:
                names = set(archive.namelist())
                if not {"manifest.json", "main.js"}.issubset(names):
                    fail(f"{extension_id}: package must contain manifest.json and main.js")
                if len(names) > 30 or any(".." in pathlib.PurePosixPath(n).parts for n in names):
                    fail(f"{extension_id}: invalid ZIP member list")
                manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
        except Exception as exc:
            fail(f"{extension_id}: invalid package ZIP: {exc}")

        for key in ("id", "version", "versionCode"):
            if manifest.get(key) != entry.get(key):
                fail(f"{extension_id}: index and manifest disagree on {key}")

        print(f"OK {extension_id} {entry['version']} ({len(payload)} bytes)")

    print(f"Verified {len(seen)} extension package(s).")


if __name__ == "__main__":
    main()
