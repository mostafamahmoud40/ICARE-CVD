"""WFDB upload helpers and ECG strip rendering for image-based classifiers."""

from __future__ import annotations

import io
import os
import tempfile

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import wfdb
from PIL import Image


def save_wfdb_upload(dat_bytes: bytes, hea_bytes: bytes, dest_dir: str) -> str:
    os.makedirs(dest_dir, exist_ok=True)
    text = hea_bytes.decode("utf-8", errors="replace")
    lines = [l for l in text.splitlines() if l.strip() and not l.strip().startswith("#")]
    if not lines:
        raise ValueError("Header file is empty or invalid.")

    record_name = lines[0].split()[0]
    data_files: list[str] = []
    for line in lines[1:]:
        token = line.split()[0]
        if token not in data_files:
            data_files.append(token)
    if not data_files:
        raise ValueError("Header references no data file.")

    with open(os.path.join(dest_dir, f"{record_name}.hea"), "wb") as f:
        f.write(hea_bytes)
    for data_file in data_files:
        with open(os.path.join(dest_dir, data_file), "wb") as f:
            f.write(dat_bytes)

    return os.path.join(dest_dir, record_name)


def read_wfdb_record(path: str):
    record = wfdb.rdrecord(path)
    fs = int(record.fs) if record.fs else 100
    raw = np.asarray(record.p_signal, dtype=float)
    if not np.isfinite(raw).all():
        raw = np.nan_to_num(raw, nan=0.0, posinf=0.0, neginf=0.0)
    return raw, list(record.sig_name), fs


def render_ecg_strip_image(raw_signal: np.ndarray, sig_names: list[str], fs: int) -> Image.Image:
    """Render a 12-lead grid PNG suitable for the MaxViT ECG image classifier."""
    n_leads = raw_signal.shape[1]
    duration_s = min(raw_signal.shape[0] / fs, 10.0)
    n_plot = min(int(duration_s * fs), raw_signal.shape[0])
    time_ax = np.arange(n_plot) / fs

    n_cols = 2 if n_leads > 1 else 1
    n_rows = int(np.ceil(n_leads / n_cols))

    fig, axes = plt.subplots(
        n_rows,
        n_cols,
        figsize=(12, max(2.0, 1.8 * n_rows)),
        sharex=True,
        facecolor="white",
    )
    axes = np.atleast_2d(axes) if n_leads > 1 else np.array([[axes]])

    for i in range(n_leads):
        ax = axes[i // n_cols, i % n_cols]
        y = raw_signal[:n_plot, i]
        ax.plot(time_ax, y, color="#111", linewidth=0.7)
        ax.set_title(sig_names[i], fontsize=9, fontweight="bold")
        finite = y[np.isfinite(y)]
        if finite.size >= 8:
            lo, hi = np.percentile(finite, (1, 99))
            pad = max((hi - lo) * 0.25, 0.35)
            ax.set_ylim(lo - pad, hi + pad)
        ax.grid(True, alpha=0.25)
        ax.set_facecolor("#fff8f8")

    for j in range(n_leads, n_rows * n_cols):
        axes[j // n_cols, j % n_cols].axis("off")

    for c in range(n_cols):
        axes[-1, c].set_xlabel("Time (s)", fontsize=8)

    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return Image.open(buf).convert("RGB")


def wfdb_bytes_to_image(dat_bytes: bytes, hea_bytes: bytes) -> tuple[Image.Image, list[str], int]:
    with tempfile.TemporaryDirectory() as tmpdir:
        path = save_wfdb_upload(dat_bytes, hea_bytes, dest_dir=tmpdir)
        raw, sig_names, fs = read_wfdb_record(path)
        return render_ecg_strip_image(raw, sig_names, fs), sig_names, fs
