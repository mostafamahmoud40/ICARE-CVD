"""
app.py — thin FastAPI router.

All business logic lives in:
  inference/  (models, preprocessor, visualizer, pipeline)
  services/   (ai_report)
  config.py   (constants)
"""
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import DEFAULT_SEG_MODEL, DEFAULT_EF_MODEL, DEVICE
from models import DeepLabSegModel, R2Plus1DEFModel
from preprocessor import VideoPreprocessor
from visualizer import Visualizer
from pipeline import InferencePipeline
from ai_report import generate_report, chat as ai_chat

BASE_DIR = Path(__file__).parent

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(title="EchoEF Analyzer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Factory (DIP: compose concrete types here, not in business logic) ───────

def _build_pipeline(seg_path: str, ef_path: str) -> InferencePipeline:
    return InferencePipeline(
        seg_model    = DeepLabSegModel(seg_path),
        ef_model     = R2Plus1DEFModel(ef_path),
        preprocessor = VideoPreprocessor(),
        visualizer   = Visualizer(),
    )


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    import torch
    return {
        "status":             "ok",
        "device":             str(DEVICE),
        "cuda":               torch.cuda.is_available(),
        "default_seg_exists": os.path.exists(DEFAULT_SEG_MODEL),
        "default_ef_exists":  os.path.exists(DEFAULT_EF_MODEL),
    }


@app.post("/analyze")
async def analyze(
    video:          UploadFile       = File(...),
    seg_model_file: UploadFile | None = File(None),
    ef_model_file:  UploadFile | None = File(None),
):
    tmp_files: list[str] = []
    try:
        suf     = Path(video.filename).suffix or ".avi"
        tmp_vid = tempfile.NamedTemporaryFile(delete=False, suffix=suf)
        tmp_vid.write(await video.read())
        tmp_vid.close()
        tmp_files.append(tmp_vid.name)

        if seg_model_file and seg_model_file.filename:
            t = tempfile.NamedTemporaryFile(delete=False, suffix=".pt")
            t.write(await seg_model_file.read()); t.close()
            tmp_files.append(t.name); seg_path = t.name
        else:
            if not os.path.exists(DEFAULT_SEG_MODEL):
                raise HTTPException(400, "Default segmentation model not found.")
            seg_path = DEFAULT_SEG_MODEL

        if ef_model_file and ef_model_file.filename:
            t = tempfile.NamedTemporaryFile(delete=False, suffix=".pt")
            t.write(await ef_model_file.read()); t.close()
            tmp_files.append(t.name); ef_path = t.name
        else:
            if not os.path.exists(DEFAULT_EF_MODEL):
                raise HTTPException(400, "Default EF model not found.")
            ef_path = DEFAULT_EF_MODEL

        return JSONResponse(_build_pipeline(seg_path, ef_path).run(tmp_vid.name))

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(500, f"{e}\n\n{traceback.format_exc()}")
    finally:
        for f in tmp_files:
            try: os.unlink(f)
            except Exception: pass


@app.post("/generate_report")
async def generate_report_route(request: Request):
    try:
        return {"report": generate_report(await request.json())}
    except Exception as e:
        import traceback
        raise HTTPException(500, f"{e}\n\n{traceback.format_exc()}")


@app.post("/chat")
async def chat_route(request: Request):
    try:
        payload = await request.json()
        return {"response": ai_chat(
            user_message  = payload["message"],
            analysis_data = payload.get("analysis_data", {}),
            history       = payload.get("history", []),
        )}
    except Exception as e:
        import traceback
        raise HTTPException(500, f"{e}\n\n{traceback.format_exc()}")

if __name__ == "__main__":
    import uvicorn
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    uvicorn.run("app:app", host="0.0.0.0", port=args.port, reload=False)
