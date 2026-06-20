# ECG Classification weights (MaxViT)

This folder only stores the **model checkpoint** and optional **test images**.

The service code lives in [`../ecg-classification/`](../ecg-classification/) and runs as Docker service `ml-ecg-classification` on port **8503**.

## Files

| File | Purpose |
|------|---------|
| `best_maxvit_ecg_model 98.pth` | MaxViT weights (~98% val accuracy) — mounted into the container |
| `test_samples/` | Sample ECG images for manual testing |
| `dataset/` | Original training images (~3 GB) — **not needed** for inference; safe to delete to save space |

## Removed (integrated into ICARE-CVD)

The standalone Next.js frontend, duplicate Docker setup, and local venv were removed — use the consultation UI **ECG Image Classification** section instead.
