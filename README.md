# ICARE-CVD

Cardiovascular disease (CVD) patient management platform — fullstack web app plus AI services for diagnostics and consultation.

| Layer | Stack |
|-------|--------|
| Frontend | Next.js (App Router) — `http://localhost:3000` |
| Backend | NestJS + PostgreSQL + MinIO + Chroma — `http://localhost:3001` |
| ML services | FastAPI / Flask (Docker + GPU) — ports `5000`–`8503` |

> **Note:** Model weights are **not stored on GitHub**. Download them from Hugging Face Hub (see [Download ML weights](#3-download-ml-weights)).

---

## Prerequisites

| Tool | Version / notes |
|------|-----------------|
| **Git** | Any recent version |
| **Docker** + **Docker Compose** v2 | For backend and ml-service |
| **Node.js** | 20+ (24 recommended — matches backend image) |
| **npm** | Bundled with Node |
| **NVIDIA GPU + drivers** | Required for ml-service and BGE-M3 embeddings |
| [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) | `docker run --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 nvidia-smi` must work |

### API keys (optional per feature)

| Service | Used for |
|---------|----------|
| [Groq](https://console.groq.com/keys) | Patient chat, AI analysis, ECG/Echo reports |
| [Mistral](https://console.mistral.ai/) | Lab report OCR (ml-medical) |
| AWS S3 | Doctor documents (`S3_*` in backend `.env`) |
| [Brevo](https://www.brevo.com/) | Transactional email (optional) |

---

## Repository layout

```
icare-cvd/
├── frontend/          # Next.js UI
├── backend/           # API + Postgres + MinIO + Chroma + BGE-M3
├── ml-service/        # ML services (CT, X-ray, ECG, Echo, MRI, Lab OCR, …)
└── README.md          # This file
```

### Local ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend API | 3001 |
| PostgreSQL | 5432 |
| MinIO API / Console | 9000 / 9001 |
| Chroma | 8001 |
| BGE-M3 embeddings | 8091 |
| ML — CT + X-ray | 8000 |
| ML — ECG arrhythmia | 5050 |
| ML — Echo | 8080 |
| ML — Lab OCR | 5000 |
| ML — ECG RAG | 8502 |
| ML — ECG classification | 8503 |
| ML — Cardiac MRI | 8090 |

---

## Setup (new machine)

### 1. Clone the repo

```bash
git clone <repo-url> icare-cvd
cd icare-cvd
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` — **minimum required** for Docker Compose:

```env
JWT_ACCESS_SECRET=use-a-long-random-secret
JWT_REFRESH_SECRET=use-another-long-random-secret

# AWS S3 for doctor documents (required by docker-compose)
S3_BUCKET_NAME=your-bucket
S3_REGION=eu-north-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

# Optional — AI and email
GROQ_API_KEY=
BREVO_API_KEY=
```

Start infrastructure + API:

```bash
docker compose up -d --build
```

Wait until the backend is ready (first boot may take several minutes — `drizzle push` + BGE-M3 download):

```bash
docker compose ps
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" -d '{"email":"x","password":"y"}'
# 400 = API is up
```

### 3. Download ML weights

Weights live on Hugging Face: **`mstdev0/icare-cvd-weights`**

```bash
cd ../ml-service
pip install -r scripts/requirements-download.txt

export ICARE_ML_HF_REPO=mstdev0/icare-cvd-weights
# If the repo is private:
# export HF_TOKEN=hf_...

python scripts/download_hf_assets.py --full-repo
```

Downloads ~1.7 GB (CT, X-ray YOLO, ECG, Echo, MRI, MaxViT, RAG papers, chroma_db, …).

### 4. ML services

```bash
cp .env.example .env
```

Fill `ml-service/.env`:

```env
GROQ_API_KEY=...
MISTRAL_API_KEY=...
ICARE_ML_HF_REPO=mstdev0/icare-cvd-weights
```

```bash
docker compose build
docker compose up -d
```

Health checks:

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:5050/health
curl -s http://localhost:8503/health
```

### 5. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

Or create `frontend/.env.local` manually:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_ECG_SERVICE_URL=http://localhost:5050
NEXT_PUBLIC_ECHO_API_URL=http://localhost:8080
NEXT_PUBLIC_MRI_SERVICE_URL=http://localhost:8090
NEXT_PUBLIC_ECG_RAG_SERVICE_URL=http://localhost:8502
NEXT_PUBLIC_ECG_CLASSIFICATION_URL=http://localhost:8503
```

Open: **http://localhost:3000**

---

## Demo data (optional)

### Default login accounts

| Role | Email | Password |
|------|-------|----------|
| Doctor | `doctor@gmail.com` | `doctor@23` |
| Assistant | `assistant@gmail.com` | `assistant@23` |
| Patient | `patient@gmail.com` | `patient23@` |
| Admin | `admin@icare-cvd.local` | `Admin123456` |

### Extra patient seeds

```bash
docker cp backend/src/database/seeds/seed_patients.sql icare-cvd-postgres:/tmp/
docker exec icare-cvd-postgres psql -U postgres -d icare_cvd -f /tmp/seed_patients.sql

docker cp backend/src/database/seeds/seed_enrich.sql icare-cvd-postgres:/tmp/
docker exec icare-cvd-postgres psql -U postgres -d icare_cvd -f /tmp/seed_enrich.sql
```

Seed patient password: `Patient123!`

### MinIO patient folders

After adding new patients:

```bash
bash backend/scripts/init-minio-patient-folders.sh
```

---

## Daily workflow

```bash
# Terminal 1 — Backend stack
cd backend && docker compose up -d

# Terminal 2 — ML stack
cd ml-service && docker compose up -d

# Terminal 3 — Frontend
cd frontend && npm run dev
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend cannot reach API | Set `NEXT_PUBLIC_API_URL=http://localhost:3001` and ensure `icare-cvd-backend` is running |
| Backend `docker compose` fails on S3 | Set `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` in `backend/.env` |
| ML returns model not found | Run `download_hf_assets.py --full-repo` from `ml-service/` |
| GPU not available | Check `nvidia-smi` and [Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) |
| Embeddings very slow on first start | BGE-M3 downloads ~2 GB — wait until `icare-cvd-embeddings` is `healthy` |
| Patient avatars / uploads fail | Run `init-minio-patient-folders.sh` and confirm MinIO on `:9000` |
| Port 8090 conflict | `ml-mri` uses 8090 — backend embeddings use 8091 |

---

## Where ML weights live

| Location | Contents |
|----------|----------|
| **GitHub** | Source code only — no `.pt` / `.pth` / `.pkl` |
| **Hugging Face** | All weights — `mstdev0/icare-cvd-weights` |
| **Local disk** | `ml-service/app/**` after download |

To upload new weights (maintainers):

```bash
cd ml-service
export ICARE_ML_HF_REPO=mstdev0/icare-cvd-weights
export HF_TOKEN=hf_...
python scripts/upload_hf_assets.py --skip-missing --include-heavy --include-samples
```

Canonical path list: `ml-service/scripts/hf_assets_manifest.py`

---

## Further reading

- [frontend/AGENTS.md](frontend/AGENTS.md) — frontend development guide
- [backend/README.md](backend/README.md) — NestJS backend
- [backend/.env.example](backend/.env.example) — all backend env vars
- [frontend/.env.example](frontend/.env.example) — frontend env template
- [ml-service/docker-compose.yml](ml-service/docker-compose.yml) — ML services
- [ml-service/scripts/download_hf_assets.py](ml-service/scripts/download_hf_assets.py) — weight download script

---

## License

Graduation / research project — see the repository license file if present.
