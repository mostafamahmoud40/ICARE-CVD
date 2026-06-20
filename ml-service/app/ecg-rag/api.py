"""
SRP: Exposes the ECG-Diagnosis-with-LLM-and-RAG pipeline as a REST API.
DIP: Pipeline components (RAG, LLM, preprocessing) are imported as modules;
     the API layer never re-implements logic.
"""

import base64
import io
import os
import sys
import tempfile
from contextlib import asynccontextmanager

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.append(os.path.dirname(__file__))

from preprocessing import read_raw_ecg, save_wfdb_upload
from rag_impl import (
    create_embeddings,
    extract_features,
    extract_full_features,
    load_collection,
    retrieve_similar_cases,
    store_embeddings,
)
from preprocessing import extract_text_from_pdf
from llm_service import generate_diagnosis


# ── helpers ────────────────────────────────────────────────────────────────────

def _fig_to_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode()


def _normalize_lead_name(name: str) -> str:
    key = str(name or "").strip().upper().replace(" ", "")
    aliases = {
        "AVR": "aVR",
        "AVL": "aVL",
        "AVF": "aVF",
        "MLII": "II",
    }
    return aliases.get(key, key)


def _draw_ecg_paper_grid(ax, duration_s: float, y_min: float, y_max: float) -> None:
    # ECG paper: 25 mm/s -> small square = 0.04 s, big square = 0.20 s
    # Vertical scale commonly 10 mm/mV -> small square = 0.1 mV, big = 0.5 mV
    small_x, major_x = 0.04, 0.20
    small_y, major_y = 0.10, 0.50

    for x in np.arange(0, duration_s + small_x, small_x):
        ax.axvline(x, color="#f9b8b8", linewidth=0.35, zorder=0)
    for x in np.arange(0, duration_s + major_x, major_x):
        ax.axvline(x, color="#ef8f8f", linewidth=0.7, zorder=0)

    start_y = np.floor(y_min / small_y) * small_y
    end_y = np.ceil(y_max / small_y) * small_y
    for y in np.arange(start_y, end_y + small_y, small_y):
        ax.axhline(y, color="#f9b8b8", linewidth=0.35, zorder=0)
    for y in np.arange(start_y, end_y + major_y, major_y):
        ax.axhline(y, color="#ef8f8f", linewidth=0.7, zorder=0)


def _draw_calibration_pulse(ax, duration_s: float, baseline_y: float = 0.0) -> None:
    # 1 mV, 200 ms calibration pulse at right side.
    x0 = max(duration_s - 0.30, 0.02)
    cal_x = [x0, x0, x0 + 0.04, x0 + 0.04, x0 + 0.24, x0 + 0.24]
    cal_y = [baseline_y, baseline_y + 1.0, baseline_y + 1.0, baseline_y, baseline_y, baseline_y]
    ax.plot(cal_x, cal_y, color="#111111", linewidth=1.05, zorder=4)


def _render_hospital_style_ecg(raw_signal: np.ndarray, sig_names: list[str], fs: int) -> str:
    normalized_names = [_normalize_lead_name(s) for s in sig_names]
    lead_map = {name: raw_signal[:, i] for i, name in enumerate(normalized_names)}

    ordered = [
        ("I", "aVR", "V1", "V4"),
        ("II", "aVL", "V2", "V5"),
        ("III", "aVF", "V3", "V6"),
    ]
    rhythm_lead = "II" if "II" in lead_map else normalized_names[0]

    duration_s = min(raw_signal.shape[0] / fs, 10.0)
    n_samples = int(duration_s * fs)
    segment_s = duration_s / 4.0
    segment_n = max(1, int(segment_s * fs))
    t_segment = np.arange(segment_n) / fs
    t_full = np.arange(n_samples) / fs

    fig = plt.figure(figsize=(12.5, 7.5), facecolor="#fff4f4")
    gs = fig.add_gridspec(4, 1, height_ratios=[1, 1, 1, 1.15], hspace=0.10)

    row_ylim = (-1.8, 1.8)
    for row_idx, row_leads in enumerate(ordered):
        ax = fig.add_subplot(gs[row_idx, 0])
        ax.set_facecolor("#fff4f4")
        _draw_ecg_paper_grid(ax, duration_s=duration_s, y_min=row_ylim[0], y_max=row_ylim[1])

        for col_idx, lead in enumerate(row_leads):
            start = col_idx * segment_n
            end = min(start + segment_n, raw_signal.shape[0])
            if end <= start or lead not in lead_map:
                continue

            y = lead_map[lead][start:end]
            t = t_segment[: y.shape[0]] + (col_idx * segment_s)
            ax.plot(t, y, color="#111111", linewidth=0.9, zorder=3)

            # Lead label near each segment start, matching ECG sheet conventions.
            ax.text(
                col_idx * segment_s + 0.02,
                row_ylim[1] - 0.15,
                lead,
                fontsize=9,
                fontweight="bold",
                color="#111111",
                ha="left",
                va="top",
            )

        _draw_calibration_pulse(ax, duration_s=duration_s)
        ax.set_xlim(0, duration_s)
        ax.set_ylim(*row_ylim)
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_visible(False)

    # Long rhythm strip.
    ax_rhythm = fig.add_subplot(gs[3, 0])
    ax_rhythm.set_facecolor("#fff4f4")
    rhythm_ylim = (-1.8, 1.8)
    _draw_ecg_paper_grid(ax_rhythm, duration_s=duration_s, y_min=rhythm_ylim[0], y_max=rhythm_ylim[1])

    y_rhythm = lead_map[rhythm_lead][:n_samples]
    ax_rhythm.plot(t_full[: y_rhythm.shape[0]], y_rhythm, color="#111111", linewidth=0.9, zorder=3)
    ax_rhythm.text(
        0.02, rhythm_ylim[1] - 0.15, rhythm_lead, fontsize=9, fontweight="bold",
        color="#111111", ha="left", va="top",
    )
    _draw_calibration_pulse(ax_rhythm, duration_s=duration_s)
    ax_rhythm.set_xlim(0, duration_s)
    ax_rhythm.set_ylim(*rhythm_ylim)
    ax_rhythm.set_xticks([])
    ax_rhythm.set_yticks([])
    for spine in ax_rhythm.spines.values():
        spine.set_visible(False)

    fig.subplots_adjust(left=0.02, right=0.995, top=0.985, bottom=0.06)
    return _fig_to_b64(fig)


def _make_serializable(obj):
    """Recursively convert numpy / bool_ types to Python natives for JSON."""
    if isinstance(obj, dict):
        return {k: _make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_make_serializable(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj


# ── lifespan — load RAG collection once ───────────────────────────────────────

_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    collection = load_collection()
    if collection is None:
        db_dir = os.path.join(os.path.dirname(__file__), "database")
        pdf_paths = [
            os.path.join(db_dir, "paper03.pdf"),
            os.path.join(db_dir, "paper04.pdf"),
        ]
        text_chunks = extract_text_from_pdf(pdf_paths, chunk_size=500)
        embeddings = create_embeddings(text_chunks)
        collection = store_embeddings(text_chunks, embeddings)
    _state["collection"] = collection
    yield
    _state.clear()


# ── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ICARE-CVD — ECG Diagnosis with LLM + RAG",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    import torch

    return {
        "status": "ok",
        "collection_ready": bool(_state.get("collection")),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "cuda": torch.cuda.is_available(),
    }


@app.post("/analyze")
async def analyze(
    dat_file: UploadFile = File(..., description="WFDB .dat signal file"),
    hea_file: UploadFile = File(..., description="WFDB .hea header file"),
):
    """
    Accept a WFDB ECG recording pair (.dat + .hea), run the full NeuroKit2
    feature-extraction pipeline, retrieve similar cases from ChromaDB, and
    return structured features + two base64 PNG plots.

    Response shape:
      full_features  — structured dict (rhythm, hrv, intervals, amplitudes, …)
      legacy_features — flat dict forwarded to /diagnose
      retrieved      — similar-case context string for the LLM
      ecg_plot_b64   — multi-lead signal PNG (base64)
      cleaned_plot_b64 — cleaned lead + R-peaks PNG (base64)
      sig_names, sampling_rate, duration_sec, r_peaks_count, hospital_plot_b64
    """
    dat_bytes = await dat_file.read()
    hea_bytes = await hea_file.read()

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            ecg_path = save_wfdb_upload(dat_bytes, hea_bytes, dest_dir=tmpdir)
            ecg_signal, _info, raw_signal, sig_names, fs = read_raw_ecg(ecg_path)

            legacy_feat = extract_features(
                ecg_signal, raw_signal=raw_signal, sig_names=sig_names, sampling_rate=fs
            )
            full_feat = extract_full_features(ecg_signal, raw_signal, sig_names, sampling_rate=fs)
            retrieved = retrieve_similar_cases(str(legacy_feat), _state["collection"])

            total_sec = raw_signal.shape[0] / fs
            plot_sec = min(total_sec, 10.0)
            plot_n = int(plot_sec * fs)
            n_avail = int(raw_signal.shape[0])
            # Header fs × duration can overshoot the real .dat length after uploads;
            # mismatched (time_ax, y) lengths distort traces badly in matplotlib.
            n_plot = min(n_avail, plot_n)
            if n_plot < 1:
                raise HTTPException(status_code=500, detail="ECG has no samples to plot.")
            time_ax = np.arange(n_plot) / fs

            # ── multi-lead plot ───────────────────────────────────────────────
            n_leads = raw_signal.shape[1]
            n_cols = 2 if n_leads > 1 else 1
            n_rows = int(np.ceil(n_leads / n_cols))

            fig1, axes = plt.subplots(
                n_rows, n_cols,
                figsize=(14, max(2.0, 2.0 * n_rows)),
                sharex=True,
            )
            axes = np.atleast_2d(axes) if n_leads > 1 else np.array([[axes]])
            for i in range(n_leads):
                ax = axes[i // n_cols, i % n_cols]
                y = np.asarray(raw_signal[:n_plot, i], dtype=float)
                finite = y[np.isfinite(y)]
                ax.plot(time_ax, y, color="#222", linewidth=0.7)
                ax.set_title(sig_names[i], fontsize=9)
                ax.set_ylabel("mV", fontsize=8)
                ax.grid(True, alpha=0.3)
                # Autoscale alone explodes the y-range on noise / NaNs / bad uploads.
                # Pin each lead with a robust percentile window (clinical ~few mV).
                if finite.size >= 8:
                    lo, hi = np.percentile(finite, (0.5, 99.5))
                    span = float(hi - lo)
                    pad = max(span * 0.25, 0.35)
                    ax.set_ylim(lo - pad, hi + pad)
                elif finite.size > 0:
                    ymax = float(np.nanmax(np.abs(finite)))
                    pad = max(ymax * 0.2, 0.35)
                    ax.set_ylim(-ymax - pad, ymax + pad)
                else:
                    ax.set_ylim(-2.0, 2.0)
            for j in range(n_leads, n_rows * n_cols):
                axes[j // n_cols, j % n_cols].axis("off")
            for c in range(n_cols):
                axes[-1, c].set_xlabel("Time (s)")
            fig1.tight_layout()
            ecg_plot_b64 = _fig_to_b64(fig1)
            hospital_plot_b64 = _render_hospital_style_ecg(raw_signal, sig_names, fs)

            # ── cleaned lead + R-peaks ────────────────────────────────────────
            ecg_clean = ecg_signal["ECG_Clean"].to_numpy()
            r_peaks_all = np.where(ecg_signal["ECG_R_Peaks"].fillna(0).to_numpy() == 1)[0]
            r_peaks_plot = r_peaks_all[r_peaks_all < n_plot]

            fig2, ax2 = plt.subplots(figsize=(12, 3))
            ax2.plot(time_ax, ecg_clean[:n_plot], color="#d62728", linewidth=0.8)
            if len(r_peaks_plot):
                ax2.scatter(
                    r_peaks_plot / fs,
                    ecg_clean[r_peaks_plot],
                    color="blue", s=20, zorder=5, label="R-peaks",
                )
                ax2.legend(fontsize=8)
            ax2.set_xlabel("Time (s)")
            ax2.set_ylabel("Amplitude (mV)")
            ax2.set_title("Cleaned signal — processing lead with R-peaks")
            ax2.grid(True, alpha=0.3)
            cleaned_plot_b64 = _fig_to_b64(fig2)

        return JSONResponse(content={
            "full_features":    _make_serializable(full_feat),
            "legacy_features":  _make_serializable(legacy_feat),
            "retrieved":        str(retrieved),
            "ecg_plot_b64":     ecg_plot_b64,
            "hospital_plot_b64": hospital_plot_b64,
            "cleaned_plot_b64": cleaned_plot_b64,
            "sig_names":        sig_names,
            "sampling_rate":    int(fs),
            "duration_sec":     round(total_sec, 2),
            "r_peaks_count":    int(len(r_peaks_all)),
        })

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/diagnose")
async def diagnose(
    features_json: str = Form(..., description="JSON string of legacy features dict"),
    query: str = Form(..., description="Clinical question from the physician"),
    retrieved: str = Form("", description="Retrieved context string from /analyze"),
    medical_history: str = Form("", description="Optional plain-text patient history"),
):
    """
    Send ECG features + retrieved context to the Groq LLM and return a
    structured diagnosis table (Markdown) assessing MI, CD, HYP, STTC, Other.
    """
    import json

    try:
        features = json.loads(features_json)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid features_json: {e}") from e

    history_text: str | None = medical_history.strip() or None

    try:
        result = generate_diagnosis(features, retrieved, query, history_text)
        return {"diagnosis": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8502))
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=False)
