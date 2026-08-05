#!/usr/bin/env python3
"""
Download ML artifacts from a Hugging Face Hub repo into the ml-service tree.

Setup on Hugging Face:
  Create a model repo (or dataset) and upload files so paths match this repo,
  relative to the ml-service/ folder — e.g. app/cardiac-mri/models/UNet.pt

After clone:
  cd ml-service
  pip install -r scripts/requirements-download.txt
  export ICARE_ML_HF_REPO=your-org/icare-cvd-ml-weights

  # Recommended if your Hub repo mirrors this folder tree — pulls *everything*:
  python scripts/download_hf_assets.py --full-repo

  # Or selective files from hf_assets_manifest.py (+ optional flags):
  python scripts/download_hf_assets.py --include-heavy --include-samples

By default, files that already exist locally (non-empty) are skipped. Use --force to re-download.

Private repo: set HF_TOKEN or huggingface-cli login.
Environment:
  ICARE_ML_HF_REPO  — required unless --repo is passed
  HF_TOKEN          — optional; also reads HUGGINGFACE_HUB_TOKEN
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


def _ensure_hf():
    try:
        from huggingface_hub import hf_hub_download, list_repo_files, snapshot_download  # noqa: F401
    except ImportError as e:
        print(
            "Missing huggingface_hub. Run: pip install -r scripts/requirements-download.txt",
            file=sys.stderr,
        )
        raise SystemExit(1) from e


def _should_skip_local(dest: Path, *, skip_existing: bool) -> bool:
    if not skip_existing:
        return False
    try:
        return dest.is_file() and dest.stat().st_size > 0
    except OSError:
        return False


def download_files(
    repo_id: str,
    root: Path,
    rel_paths: list[str],
    *,
    revision: str | None,
    dry_run: bool,
    token: str | None,
    continue_on_error: bool,
    skip_existing: bool,
) -> tuple[int, int]:
    """Returns (downloaded_count, skipped_count)."""
    from huggingface_hub import hf_hub_download
    from huggingface_hub.utils import EntryNotFoundError
    from tqdm import tqdm

    n_dl = 0
    n_skip = 0

    for rel in tqdm(rel_paths, desc="files"):
        dest = root / rel
        if dry_run:
            if _should_skip_local(dest, skip_existing=skip_existing):
                print(f"[dry-run] skip (exists): {rel}")
                n_skip += 1
            else:
                print(f"[dry-run] would fetch {rel!r} -> {dest}")
            continue

        dest.parent.mkdir(parents=True, exist_ok=True)
        if _should_skip_local(dest, skip_existing=skip_existing):
            n_skip += 1
            continue

        try:
            hf_hub_download(
                repo_id=repo_id,
                filename=rel,
                local_dir=root,
                local_dir_use_symlinks=False,
                revision=revision,
                token=token,
                force_download=False,
            )
            n_dl += 1
        except EntryNotFoundError:
            if continue_on_error:
                print(f"[skip] not in repo: {rel}", file=sys.stderr)
                continue
            raise

    return n_dl, n_skip


def _paths_under_prefixes(remote_paths: list[str], prefixes: list[str]) -> list[str]:
    out: list[str] = []
    for rel in remote_paths:
        for p in prefixes:
            pre = p.rstrip("/")
            if rel == pre or rel.startswith(pre + "/"):
                out.append(rel)
                break
    return out


def download_full_repo(
    repo_id: str,
    root: Path,
    *,
    revision: str | None,
    dry_run: bool,
    token: str | None,
    skip_existing: bool,
) -> tuple[int, int]:
    """Full repo: skip existing files when skip_existing; else one snapshot (fast re-download)."""
    from huggingface_hub import hf_hub_download, list_repo_files, snapshot_download

    n_dl = 0
    n_skip = 0

    if dry_run:
        print(f"[dry-run] full repo {repo_id!r} -> {root} (skip_existing={skip_existing})")
        return 0, 0

    if not skip_existing:
        snapshot_download(
            repo_id=repo_id,
            local_dir=str(root),
            repo_type="model",
            local_dir_use_symlinks=False,
            revision=revision,
            token=token,
            force_download=True,
        )
        return -1, 0

    paths = list_repo_files(repo_id, repo_type="model", revision=revision, token=token)
    to_fetch: list[str] = []
    for rel in paths:
        dest = root / rel
        if _should_skip_local(dest, skip_existing=skip_existing):
            n_skip += 1
            continue
        to_fetch.append(rel)

    from tqdm import tqdm as tqdm_bar

    for rel in tqdm_bar(to_fetch, desc="full-repo"):
        dest = root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        hf_hub_download(
            repo_id=repo_id,
            filename=rel,
            local_dir=root,
            local_dir_use_symlinks=False,
            revision=revision,
            token=token,
            force_download=False,
        )
        n_dl += 1

    return n_dl, n_skip


def download_folder_prefixes(
    repo_id: str,
    root: Path,
    prefixes: list[str],
    *,
    revision: str | None,
    dry_run: bool,
    token: str | None,
    continue_on_error: bool,
    skip_existing: bool,
) -> tuple[int, int]:
    from huggingface_hub import hf_hub_download, list_repo_files, snapshot_download
    from huggingface_hub.utils import EntryNotFoundError, HfHubHTTPError
    from tqdm import tqdm

    n_dl = 0
    n_skip = 0

    if not prefixes:
        return 0, 0

    if dry_run:
        for p in prefixes:
            print(f"[dry-run] would fetch under {p}/** (skip_existing={skip_existing})")
        return 0, 0

    if not skip_existing:
        patterns = [f"{p.rstrip('/')}/**" for p in prefixes]
        try:
            snapshot_download(
                repo_id=repo_id,
                local_dir=str(root),
                local_dir_use_symlinks=False,
                revision=revision,
                token=token,
                allow_patterns=patterns,
                force_download=True,
            )
        except (EntryNotFoundError, HfHubHTTPError) as e:
            if continue_on_error:
                print(f"[skip] folder snapshot: {e}", file=sys.stderr)
                return 0, 0
            raise
        return -1, 0

    try:
        all_paths = list_repo_files(repo_id, repo_type="model", revision=revision, token=token)
    except (EntryNotFoundError, HfHubHTTPError) as e:
        if continue_on_error:
            print(f"[skip] list_repo_files: {e}", file=sys.stderr)
            return 0, 0
        raise

    rels = _paths_under_prefixes(all_paths, prefixes)
    for rel in tqdm(rels, desc="folders"):
        dest = root / rel
        if _should_skip_local(dest, skip_existing=skip_existing):
            n_skip += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        hf_hub_download(
            repo_id=repo_id,
            filename=rel,
            local_dir=root,
            local_dir_use_symlinks=False,
            revision=revision,
            token=token,
            force_download=False,
        )
        n_dl += 1

    return n_dl, n_skip


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Pull ML weights from Hugging Face into ml-service/")
    p.add_argument(
        "--full-repo",
        action="store_true",
        help="Download the entire Hub model repo into ml-service/ (same paths as on Hub). "
        "Best when the Hub tree mirrors this project; ignores manifest lists unless combined logic is needed.",
    )
    p.add_argument(
        "--repo",
        default=os.environ.get(REPO_ENV),
        help=f"Hugging Face repo id (default: env {REPO_ENV})",
    )
    p.add_argument(
        "--revision",
        default=os.environ.get("ICARE_ML_HF_REVISION"),
        help="Branch / tag / commit (optional)",
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Re-download even when a non-empty file already exists locally (disables skip-existing)",
    )
    p.add_argument("--dry-run", action="store_true", help="Print actions only")
    p.add_argument(
        "--include-heavy",
        action="store_true",
        help="Also download OPTIONAL_FOLDER_PREFIXES (ECG checkpoint, Chroma DB, …)",
    )
    p.add_argument(
        "--include-samples",
        action="store_true",
        help="Also download OPTIONAL_FILES (echo sample .avi videos)",
    )
    p.add_argument(
        "--only-prefix",
        action="append",
        default=[],
        metavar="PATH",
        help="Restrict to paths starting with this prefix (repeatable). Example: --only-prefix app/cardiac-mri/",
    )
    p.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Skip missing files (404) instead of failing — useful while uploading weights gradually",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    repo_id = args.repo
    if not repo_id:
        print(
            f"Set --repo or {REPO_ENV} to your Hugging Face model repo id "
            "(e.g. org/icare-cvd-ml-weights).",
            file=sys.stderr,
        )
        raise SystemExit(2)

    skip_existing = not args.force
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN")
    root = _ml_service_root()
    _ensure_hf()

    total_dl = 0
    total_skip = 0
    used_heavy_snapshot = False

    if args.full_repo:
        dl, sk = download_full_repo(
            repo_id,
            root,
            revision=args.revision,
            dry_run=args.dry_run,
            token=token,
            skip_existing=skip_existing,
        )
        if not args.dry_run:
            if dl < 0:
                print(f"Done. Full repo snapshot merged under {root} (--force refresh).")
            else:
                print(f"Done. Full repo under {root} (downloaded={dl}, skipped_existing={sk})")
        return

    files = list(DEFAULT_FILES)
    if args.include_samples:
        files = files + list(OPTIONAL_FILES)

    if args.only_prefix:
        pfx = tuple(args.only_prefix)
        files = [f for f in files if any(f.startswith(p) for p in pfx)]

    dl, sk = download_files(
        repo_id,
        root,
        files,
        revision=args.revision,
        dry_run=args.dry_run,
        token=token,
        continue_on_error=args.continue_on_error,
        skip_existing=skip_existing,
    )
    if dl >= 0:
        total_dl += dl
    total_skip += sk

    if args.include_heavy:
        folder_prefixes = list(OPTIONAL_FOLDER_PREFIXES)
        if args.only_prefix:
            pfx = tuple(args.only_prefix)
            folder_prefixes = [
                x
                for x in folder_prefixes
                if any(x.startswith(p) or p.startswith(x.rstrip("/")) for p in pfx)
            ]
        dl, sk = download_folder_prefixes(
            repo_id,
            root,
            folder_prefixes,
            revision=args.revision,
            dry_run=args.dry_run,
            token=token,
            continue_on_error=args.continue_on_error,
            skip_existing=skip_existing,
        )
        if dl < 0:
            used_heavy_snapshot = True
        elif dl >= 0:
            total_dl += dl
        total_skip += sk

    if not args.dry_run:
        tail = f"downloaded={total_dl}, skipped_existing={total_skip}"
        if used_heavy_snapshot:
            tail += "; heavy folders: snapshot refresh (--force)"
        print(f"Done. Assets under {root} ({tail})")


if __name__ == "__main__":
    main()
