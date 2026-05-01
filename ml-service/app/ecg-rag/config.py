import os
import sys
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

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"