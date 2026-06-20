"""
SRP: This module is responsible ONLY for exposing the cardiac MRI diagnosis
     pipeline as an HTTP REST API.

DIP: All models are loaded once at startup via FastAPI lifespan and injected
     into the predict endpoint — nothing is imported globally or hardcoded.
"""

import base64
import os
import tempfile
import time
from contextlib import asynccontextmanager
from io import BytesIO

import joblib
import matplotlib
matplotlib.use("Agg")  # Must be set before any pyplot import
import matplotlib.pyplot as plt
import nibabel as nib
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import utils.interface as interface
from utils.visualizations import (
    build_seg_gif,
    display_3d_rendering,
    display_mpr,
    display_overview,
    display_seg_grid,
    display_video,
    plot_intensity_histogram,
    plot_mean_signal_per_slice,
    plot_thickening_map,
    plot_wall_motion,
)


# ── private helpers ────────────────────────────────────────────────────────────

def _fig_to_b64(fig) -> str:
    """Serialize a matplotlib Figure to a PNG base64 string and close it."""
    buf = BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=100)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode()


def _plotly_to_b64(fig) -> str:
    """Render a Plotly figure to a PNG base64 string via kaleido."""
    img_bytes = fig.to_image(format="png", width=1000, height=400)
    return base64.b64encode(img_bytes).decode()


def _plotly_to_json(fig) -> dict:
    """Serialize a Plotly figure to a JSON dict for interactive React rendering."""
    return fig.to_plotly_json()


def _gif_to_b64(gif_bytes: bytes) -> str:
    return base64.b64encode(gif_bytes).decode()


# ── application lifespan ───────────────────────────────────────────────────────

_models: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all model weights once at startup; release on shutdown."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[startup] Device: {device}")

    seg_model = torch.load("models/fct.model", map_location=device, weights_only=False)
    seg_model.to(device).eval()

    vae = torch.load("models/vautoencoder.model", map_location=device, weights_only=False)
    vae.to(device).eval()

    classifier = joblib.load("models/classifier.pkl")
    scaler = joblib.load("transformers/robustscaler.joblib")

    if torch.cuda.is_available():
        props = torch.cuda.get_device_properties(0)
        print(f"[startup] GPU: {props.name} — {props.total_memory / (1024**3):.1f} GB VRAM")

    _models["device"] = device
    _models["seg_model"] = seg_model
    _models["vae"] = vae
    _models["classifier"] = classifier
    _models["scaler"] = scaler

    yield

    _models.clear()


# ── FastAPI application ────────────────────────────────────────────────────────

app = FastAPI(
    title="ICARE-CVD — Cardiac Cine-MRI Diagnosis Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    device = _models.get("device")
    return {
        "status": "ok",
        "models_loaded": bool(_models),
        "device": str(device) if device else "not initialised",
        "cuda": torch.cuda.is_available(),
    }


@app.post("/predict")
async def predict(
    ed_file: UploadFile = File(..., description="End-Diastolic phase NIfTI (.nii.gz)"),
    es_file: UploadFile = File(..., description="End-Systolic phase NIfTI (.nii.gz)"),
):
    """
    Run the full 3-stage cardiac MRI diagnosis pipeline:
      1. FCT segmentation → LV / RV / Myocardium masks (ED + ES)
      2. Feature extraction → 20 manual + 32 VAE deep features
      3. Ensemble classification → NOR | HCM | DCM | MINF | RV

    Returns the predicted class, 20 clinical features, elapsed time,
    5 base64-encoded static images/GIFs, and 4 interactive Plotly JSON charts.
    """
    tmp_ed_path = tmp_es_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tmp_ed:
            tmp_ed.write(await ed_file.read())
            tmp_ed_path = tmp_ed.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tmp_es:
            tmp_es.write(await es_file.read())
            tmp_es_path = tmp_es.name

        img_ed_nib = nib.load(tmp_ed_path, mmap=False)
        img_es_nib = nib.load(tmp_es_path, mmap=False)
        data_ed = img_ed_nib.get_fdata()
        data_es = img_es_nib.get_fdata()

        # ── run classification pipeline ───────────────────────────────────────
        t0 = time.perf_counter()
        classification, patient_df, batch_seg, img_ed_f, img_es_f = interface.classify(
            data_ed,
            data_es,
            _models["seg_model"],
            _models["vae"],
            _models["classifier"],
            _models["scaler"],
            img_ed_nib.header,
            img_es_nib.header,
            img_ed_nib.affine,
            img_es_nib.affine,
        )
        elapsed = round(time.perf_counter() - t0, 2)

        ed_masks = batch_seg[:, 0, :, :].astype(int)
        es_masks = batch_seg[:, 1, :, :].astype(int)

        # ── map clinical features DataFrame → dict ────────────────────────────
        row = patient_df.iloc[0]
        clinical = {
            "ed_vol_lv":           float(row["ED[vol(LV)]"]),
            "es_vol_lv":           float(row["ES[vol(LV)]"]),
            "ed_vol_rv":           float(row["ED[vol(RV)]"]),
            "es_vol_rv":           float(row["ES[vol(RV)]"]),
            "ed_mass_myo":         float(row["ED[mass(MYO)]"]),
            "es_vol_myo":          float(row["ES[vol(MYO)]"]),
            "ef_lv":               float(row["EF(LV)"]),
            "ef_rv":               float(row["EF(RV)"]),
            "ed_ratio_lv_rv":      float(row["ED[vol(LV)/vol(RV)]"]),
            "es_ratio_lv_rv":      float(row["ES[vol(LV)/vol(RV)]"]),
            "ed_ratio_myo_lv":     float(row["ED[mass(MYO)/vol(LV)]"]),
            "es_ratio_myo_lv":     float(row["ES[vol(MYO)/vol(LV)]"]),
            "es_max_mean_mwt":     float(row["ES[max(mean(MWT|SA)|LA)]"]),
            "es_stdev_mean_mwt":   float(row["ES[stdev(mean(MWT|SA)|LA)]"]),
            "es_mean_stdev_mwt":   float(row["ES[mean(stdev(MWT|SA)|LA)]"]),
            "es_stdev_stdev_mwt":  float(row["ES[stdev(stdev(MWT|SA)|LA)]"]),
            "ed_max_mean_mwt":     float(row["ED[max(mean(MWT|SA)|LA)]"]),
            "ed_stdev_mean_mwt":   float(row["ED[stdev(mean(MWT|SA)|LA)]"]),
            "ed_mean_stdev_mwt":   float(row["ED[mean(stdev(MWT|SA)|LA)]"]),
            "ed_stdev_stdev_mwt":  float(row["ED[stdev(stdev(MWT|SA)|LA)]"]),
        }

        # ── generate all visualizations ───────────────────────────────────────
        video_arr = (
            np.concatenate([data_ed, data_es], axis=2).transpose(2, 0, 1).astype("uint8")
        )
        mid_ax  = data_ed.shape[2] // 2
        mid_sag = data_ed.shape[0] // 2
        mid_cor = data_ed.shape[1] // 2

        return {
            "diagnosis_class":       classification,
            "elapsed_sec":           elapsed,
            "clinical_features":     clinical,
            "raw_gif_b64":           _gif_to_b64(display_video(video_arr)),
            "seg_gif_b64":           _gif_to_b64(
                build_seg_gif(img_ed_f, img_es_f, ed_masks, es_masks)
            ),
            "seg_grid_ed_b64":       _fig_to_b64(
                display_seg_grid(img_ed_f, ed_masks, title_prefix="ED")
            ),
            "seg_grid_es_b64":       _fig_to_b64(
                display_seg_grid(img_es_f, es_masks, title_prefix="ES")
            ),
            "mean_signal_chart_json": _plotly_to_json(
                plot_mean_signal_per_slice(data_ed, data_es)
            ),
            "overview_img_b64":       _fig_to_b64(
                display_overview(data_ed, data_es, ed_file.filename or "")
            ),
            "histogram_img_b64":      _fig_to_b64(
                plot_intensity_histogram(data_ed, data_es)
            ),
            "thickening_chart_json":  _plotly_to_json(
                plot_thickening_map(ed_masks, es_masks)
            ),
            "wall_motion_chart_json": _plotly_to_json(
                plot_wall_motion(ed_masks, es_masks)
            ),
            "rendering_3d_json":      _plotly_to_json(
                display_3d_rendering(ed_masks)
            ),
            "mpr_img_b64":           _fig_to_b64(
                display_mpr(data_ed, data_es, mid_ax, mid_sag, mid_cor)
            ),
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    finally:
        if tmp_ed_path and os.path.exists(tmp_ed_path):
            os.unlink(tmp_ed_path)
        if tmp_es_path and os.path.exists(tmp_es_path):
            os.unlink(tmp_es_path)
