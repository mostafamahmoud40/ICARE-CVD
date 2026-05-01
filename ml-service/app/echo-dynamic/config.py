import os
import sys
import torch
from pathlib import Path

_here = Path(__file__).resolve().parent
for _root in (_here, _here.parent):
    if (_root / "ml_env.py").is_file():
        _s = str(_root)
        if _s not in sys.path:
            sys.path.insert(0, _s)
        break
from ml_env import load_ml_service_dotenv

load_ml_service_dotenv()

BASE_DIR          = Path(__file__).parent
DEFAULT_SEG_MODEL = str(BASE_DIR / "deeplabv3_resnet50_random.pt")
DEFAULT_EF_MODEL  = str(BASE_DIR / "r2plus1d_18_32_2_pretrained.pt")
DEVICE            = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MEAN              = 30.097857 / 255.0
STD               = 47.459534 / 255.0
GROQ_API_KEY      = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL        = "qwen/qwen3-32b"
