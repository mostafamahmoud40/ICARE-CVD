"""MaxViT ECG image classification — REST API for ICARE-CVD."""

from __future__ import annotations

import base64
import io
import os
import sys

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))

from model_loader import MaxViTECGModel
from wfdb_io import wfdb_bytes_to_image

MODEL_PATH = os.environ.get(
    "ECG_CLASSIFICATION_MODEL_PATH",
    "/service/models/maxvit_ecg_98.pth",
)

app = FastAPI(title="ICARE-CVD — ECG Image Classification (MaxViT)", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: MaxViTECGModel | None = None


def _get_model() -> MaxViTECGModel:
    global _model
    if _model is None:
        _model = MaxViTECGModel(MODEL_PATH)
    return _model


def _image_to_b64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _predict_image(image: Image.Image, source: str, sig_names: list[str] | None = None, fs: int | None = None):
    result = _get_model().predict(image)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    payload = {
        **result,
        "source": source,
        "input_preview_b64": _image_to_b64(image),
        "sig_names": sig_names or [],
        "sampling_rate": fs,
    }
    return JSONResponse(content=payload)


@app.get("/health")
def health():
    import torch

    ready = os.path.exists(MODEL_PATH)
    return {
        "status": "ok" if ready else "model_missing",
        "model_loaded": _model is not None,
        "model_path": MODEL_PATH,
        "model_exists": ready,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "cuda": torch.cuda.is_available(),
        "classes": ["Normal", "Atrial Fibrillation", "Myocardial Infarction"],
    }


@app.post("/predict/image")
async def predict_image(file: UploadFile = File(..., description="ECG strip image (PNG/JPG)")):
    """Classify an uploaded ECG image."""
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid image: {exc}") from exc
    return _predict_image(image, source="image")


@app.post("/predict/wfdb")
async def predict_wfdb(
    dat_file: UploadFile = File(..., description="WFDB .dat"),
    hea_file: UploadFile = File(..., description="WFDB .hea"),
):
    """Render a WFDB pair to a 12-lead strip image, then classify."""
    dat_bytes = await dat_file.read()
    hea_bytes = await hea_file.read()
    try:
        image, sig_names, fs = wfdb_bytes_to_image(dat_bytes, hea_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _predict_image(image, source="wfdb", sig_names=sig_names, fs=fs)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8503))
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=False)
