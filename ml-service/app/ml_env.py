"""
Load secrets from ml-service/.env (same folder as docker-compose.yml).

Docker Compose passes these variables into containers (`env_file: .env`); calling
this in code only matters when you run Python directly on the host.
"""

from pathlib import Path

from dotenv import load_dotenv


def load_ml_service_dotenv() -> None:
    p = Path(__file__).resolve().parent
    while p != p.parent:
        if (p / "docker-compose.yml").is_file():
            load_dotenv(p / ".env")
            return
        p = p.parent
    load_dotenv()
