# ECG Image Classification (MaxViT)

3-class ECG strip image classifier integrated into ICARE-CVD.

- **Classes:** Normal · Atrial Fibrillation · Myocardial Infarction
- **Port:** `8503`
- **Weights:** bind-mounted from `../Ecg_Classification/best_maxvit_ecg_model 98.pth`

## Endpoints

- `GET /health`
- `POST /predict/image` — upload PNG/JPG ECG strip
- `POST /predict/wfdb` — upload `.hea` + `.dat`; server renders 12-lead strip then classifies

## Run

```bash
cd ml-service
docker compose build ml-ecg-classification
docker compose up -d ml-ecg-classification
```

Frontend env (optional): `NEXT_PUBLIC_ECG_CLASSIFICATION_URL=http://localhost:8503`
