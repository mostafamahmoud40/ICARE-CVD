import os
import torch
from pathlib import Path

BASE_DIR = Path(__file__).parent
DEFAULT_MODEL_PATH = BASE_DIR / "yolo12s.pt"
MODEL_PATH = Path(os.environ.get("XRAY_MODEL_PATH", str(DEFAULT_MODEL_PATH)))

CONF_THRESHOLD = float(os.environ.get("XRAY_CONF_THRESHOLD", "0.25"))
IOU_THRESHOLD = float(os.environ.get("XRAY_IOU_THRESHOLD", "0.45"))
IMG_SIZE = int(os.environ.get("XRAY_IMG_SIZE", "640"))

if torch.cuda.is_available():
    DEVICE = torch.device("cuda:0")
    YOLO_DEVICE: str | int = 0
    GPU_NAME = torch.cuda.get_device_name(0)
else:
    DEVICE = torch.device("cpu")
    YOLO_DEVICE = "cpu"
    GPU_NAME = "CPU only"
