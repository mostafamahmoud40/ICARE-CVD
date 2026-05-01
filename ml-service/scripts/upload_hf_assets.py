#!/usr/bin/env python3
"""
Upload ML artifacts to Hugging Face Hub (same layout as download_hf_assets.py).

Typical layout on disk (either under ml-service/ or under ml-service/weights/):
  app/cardiac-mri/models/UNet.pt
  segmentation.nii.gz
  ...

Examples:
  export ICARE_ML_HF_REPO=mstdev0/icare-cvd-weights
  # Upload from a folder that mirrors repo paths (like your "weights" dir):
  python scripts/upload_hf_assets.py --folder weights

  # Upload from ml-service root (default):
  python scripts/upload_hf_assets.py

  pip install -r scripts/requirements-download.txt
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from hf_assets_manifest import (
    DEFAULT_FILES,
    OPTIONAL_FILES,
    OPTIONAL_FOLDER_PREFIXES,
    REPO_ENV,
)


def _ml_service_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _ensure_hf() -> None:
    try:
        from huggingface_hub import upload_folder  # noqa: F401
    except ImportError as e:
        print(
            "Missing huggingface_hub. Run: pip install -r scripts/requirements-download.txt",
            file=sys.stderr,
        )
        raise SystemExit(1) from e


def _collect_allow_patterns(
    root: Path,
    *,
    include_heavy: bool,
    include_samples: bool,
    only_prefix: list[str],
    skip_missing: bool,
) -> list[str]:
    files = list(DEFAULT_FILES)
    if include_samples:
        files = files + list(OPTIONAL_FILES)
    prefixes = list(OPTIONAL_FOLDER_PREFIXES) if include_heavy else []

    if only_prefix:
        pfx = tuple(only_prefix)
        files = [f for f in files if any(f.startswith(p) for p in pfx)]
        prefixes = [
            x
            for x in prefixes
            if any(x.startswith(p) or p.startswith(x.rstrip("/")) for p in pfx)
        ]

    patterns: list[str] = []
    for rel in files:
        path = root / rel
        if path.is_file():
            patterns.append(rel)
        elif skip_missing:
            print(f"[skip] missing file: {rel}", file=sys.stderr)
        else:
            raise FileNotFoundError(f"Expected file under {root}: {rel}")

    for prefix in prefixes:
        globs = f"{prefix.rstrip('/')}/**"
        dirpath = root / prefix
        if dirpath.is_dir():
            patterns.append(globs)
        elif skip_missing:
            print(f"[skip] missing dir: {prefix}", file=sys.stderr)
        else:
            raise FileNotFoundError(f"Expected directory under {root}: {prefix}")

    return patterns


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Upload ML weights to Hugging Face (model repo)")
    p.add_argument(
        "--repo",
        default=os.environ.get(REPO_ENV),
        help=f"HF repo id (default: env {REPO_ENV})",
    )
    p.add_argument(
        "--folder",
        type=Path,
        default=None,
        help="Local folder whose tree matches HF paths (default: ml-service/). "
        "Use this if you keep copies under ./weights/ like upload_folder(folder_path='weights').",
    )
    p.add_argument(
        "--path-in-repo",
        default=None,
        dest="path_in_repo",
        metavar="PATH",
        help="Optional subpath inside the Hub repo (usually omit so app/ sits at repo root)",
    )
    p.add_argument(
        "--include-heavy",
        action="store_true",
        help="Also upload OPTIONAL_FOLDER_PREFIXES (ECG checkpoint, Chroma DB, …)",
    )
    p.add_argument(
        "--include-samples",
        action="store_true",
        help="Also upload OPTIONAL_FILES (echo sample .avi videos)",
    )
    p.add_argument(
        "--full-folder",
        action="store_true",
        help="Upload everything under --folder (except ignore_patterns), no manifest filter",
    )
    p.add_argument(
        "--only-prefix",
        action="append",
        default=[],
        metavar="PATH",
        help="Only upload paths under this prefix (repeatable)",
    )
    p.add_argument(
        "--skip-missing",
        action="store_true",
        help="Skip files/folders that are not present locally instead of failing",
    )
    p.add_argument("--dry-run", action="store_true", help="List patterns only; no upload")
    p.add_argument(
        "--commit-message",
        default="Update ICARE-CVD ML weights",
        help="Git commit message on the Hub repo",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    repo_id = args.repo
    if not repo_id:
        print(
            f"Set --repo or {REPO_ENV} (e.g. mstdev0/icare-cvd-weights).",
            file=sys.stderr,
        )
        raise SystemExit(2)

    root = (args.folder if args.folder is not None else _ml_service_root()).resolve()
    if not root.is_dir():
        print(f"Not a directory: {root}", file=sys.stderr)
        raise SystemExit(2)

    _ensure_hf()

    if args.full_folder:
        if args.dry_run:
            print(f"[dry-run] would upload entire tree under {root} (respecting ignore_patterns)")
            return
        from huggingface_hub import upload_folder

        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN")
        upload_folder(
            folder_path=root,
            repo_id=repo_id,
            repo_type="model",
            path_in_repo=args.path_in_repo,
            ignore_patterns=[
                "**/.git/**",
                "**/__pycache__/**",
                "**/.venv/**",
                "**/venv/**",
                "**/*.pyc",
            ],
            token=token,
            commit_message=args.commit_message,
        )
        print(f"Uploaded to https://huggingface.co/{repo_id}")
        return

    try:
        allow_patterns = _collect_allow_patterns(
            root,
            include_heavy=args.include_heavy,
            include_samples=args.include_samples,
            only_prefix=args.only_prefix,
            skip_missing=args.skip_missing,
        )
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        raise SystemExit(1) from e

    if not allow_patterns:
        print("Nothing to upload (empty pattern list).", file=sys.stderr)
        raise SystemExit(1)

    if args.dry_run:
        for x in allow_patterns:
            print(x)
        return

    from huggingface_hub import upload_folder

    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN")

    upload_folder(
        folder_path=root,
        repo_id=repo_id,
        repo_type="model",
        path_in_repo=args.path_in_repo,
        allow_patterns=allow_patterns,
        ignore_patterns=[
            "**/.git/**",
            "**/__pycache__/**",
            "**/.venv/**",
            "**/venv/**",
            "**/*.pyc",
        ],
        token=token,
        commit_message=args.commit_message,
    )
    print(f"Uploaded to https://huggingface.co/{repo_id}")


if __name__ == "__main__":
    main()
