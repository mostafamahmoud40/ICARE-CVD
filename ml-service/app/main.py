"""
ICARE-CVD ML Service — FastAPI application.

Models loaded at startup (once):
  - BasicUNet        → POST /api/v1/ct/segment   (coronary artery CT segmentation)
  - DenseNet121 xrv  → POST /api/v1/xray/analyze  (chest X-ray cardiovascular findings)
"""

import base64
import os
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path

import nibabel as nib
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .predictor import build_transform, generate_slice_images, load_model, run_inference
from .schemas import HealthResponse, SegmentationResponse, SliceImages, XrayResponse
from .xray_predictor import (
    generate_xray_visuals,
    interpret,
    load_xray_model,
    run_xray_inference,
)

# ─── Environment (secrets in ml-service/.env) ───────────────────────────────────
try:
    from app.ml_env import load_ml_service_dotenv
except ImportError:
    import sys

    _here = Path(__file__).resolve().parent
    for _root in (_here, _here.parent):
        if (_root / "ml_env.py").is_file():
            _s = str(_root)
            if _s not in sys.path:
                sys.path.insert(0, _s)
            break
    from ml_env import load_ml_service_dotenv

load_ml_service_dotenv()

# ─── Configuration ────────────────────────────────────────────────────────────

MODEL_PATH: str = os.getenv(
    "MODEL_PATH",
    str(Path(__file__).parent / "CT" / "coronary_segmentation_model.pth"),
)

_state: dict = {}


# ─── Lifespan — both models loaded ONCE at startup ───────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"[startup] Device: {device}")

    # CT segmentation model
    ct_model = load_model(MODEL_PATH, device)
    ct_transform = build_transform()
    print("[startup] CT segmentation model loaded (BasicUNet)")

    # Chest X-ray model (downloads weights on first run)
    xray_model = load_xray_model(device)
    print("[startup] Chest X-ray model loaded (DenseNet121-xrv)")

    if torch.cuda.is_available():
        props = torch.cuda.get_device_properties(0)
        print(f"[startup] GPU: {props.name} — {props.total_memory / (1024**3):.1f} GB VRAM")

    _state.update({
        "device":       device,
        "ct_model":     ct_model,
        "ct_transform": ct_transform,
        "xray_model":   xray_model,
    })

    yield

    _state.clear()
    print("[shutdown] Models released")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ICARE-CVD ML Service",
    description="Coronary CT segmentation + Chest X-ray cardiovascular analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        device=str(_state.get("device", "not initialised")),
        model_loaded=bool(_state),
    )


# ── CT segmentation ───────────────────────────────────────────────────────────

@app.post("/api/v1/ct/segment", response_model=SegmentationResponse, tags=["CT"])
async def ct_segment(
    file: UploadFile = File(..., description="Cardiac CT in NIfTI format (.nii / .nii.gz)"),
) -> SegmentationResponse:
    """3D coronary artery segmentation using sliding-window BasicUNet."""
    filename = file.filename or ""
    if not (filename.endswith(".nii") or filename.endswith(".nii.gz")):
        raise HTTPException(status_code=400, detail="File must be .nii or .nii.gz")

    contents = await file.read()
    suffix = ".nii.gz" if filename.endswith(".nii.gz") else ".nii"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        t0 = time.perf_counter()
        pred, affine, image_np, stats = run_inference(
            tmp_path, _state["ct_model"], _state["ct_transform"], _state["device"],
        )
        elapsed_sec = round(time.perf_counter() - t0, 1)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    slices_b64 = generate_slice_images(image_np, pred)

    nii_img = nib.Nifti1Image(pred, affine=affine)
    with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as out_tmp:
        out_path = out_tmp.name
    try:
        nib.save(nii_img, out_path)
        mask_bytes = Path(out_path).read_bytes()
    finally:
        Path(out_path).unlink(missing_ok=True)

    return SegmentationResponse(
        voxel_count=stats["coronary_voxel_count"],
        pred_shape=stats["prediction_shape"],
        volume_ml=round(stats["coronary_voxel_count"] / 1000, 2),
        elapsed_sec=elapsed_sec,
        slices=SliceImages(**slices_b64),
        mask_b64=base64.b64encode(mask_bytes).decode(),
    )


# ── Chest X-ray ───────────────────────────────────────────────────────────────

@app.post("/api/v1/xray/analyze", response_model=XrayResponse, tags=["X-ray"])
async def xray_analyze(
    file: UploadFile = File(..., description="Chest X-ray image (JPEG / PNG)"),
) -> XrayResponse:
    """
    Detect cardiovascular pathologies from a chest X-ray using DenseNet121.

    Returns probabilities for: Cardiomegaly, Edema, Effusion,
    Enlarged Cardiomediastinum — plus rendered visualizations.
    """
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}:
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, BMP, or TIFF).",
        )

    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        cardio, display = run_xray_inference(
            tmp_path, _state["xray_model"], _state["device"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    risk_level, interpretation = interpret(cardio)
    xray_b64, chart_b64 = generate_xray_visuals(display, cardio)

    return XrayResponse(
        findings=cardio,
        risk_level=risk_level,
        interpretation=interpretation,
        xray_b64=xray_b64,
        chart_b64=chart_b64,
    )
