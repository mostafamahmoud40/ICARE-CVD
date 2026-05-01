"""Shared paths for Hugging Face upload/download — relative to ml-service/ root."""

REPO_ENV = "ICARE_ML_HF_REPO"

# Must match the layout inside the HF model repo (used when not using --full-repo).
DEFAULT_FILES: list[str] = [
    "app/cardiac-mri/models/UNet.pt",
    "app/cardiac-mri/models/classifier.pkl",
    "app/cardiac-mri/models/fct.model",
    "app/cardiac-mri/models/vautoencoder.model",
    "app/cardiac-mri/transformers/labelencoder.joblib",
    "app/cardiac-mri/transformers/robustscaler.joblib",
    "app/cardiac-mri/utils/vae/transformers/labelencoder.joblib",
    "app/echo-dynamic/deeplabv3_resnet50_random.pt",
    "app/echo-dynamic/r2plus1d_18_32_2_pretrained.pt",
    "app/CT/coronary_segmentation_model.pth",
    "app/ecg/ecgtransform_mit_best.pt",
    "segmentation.nii.gz",
    # RAG: needed to build Chroma if you do not download chroma_db from Hub
    "app/ecg-rag/database/paper03.pdf",
    "app/ecg-rag/database/paper04.pdf",
]

# Large demo videos (echo) — optional
OPTIONAL_FILES: list[str] = [
    "app/echo-dynamic/samples/Mildly_Reduced_EF47.1_0X7FF6111130FB1E5E.avi",
    "app/echo-dynamic/samples/Normal_EF68.2_0X2728207F531EE47D.avi",
]

# Large trees — optional; not required for minimal ECG inference (only ecgtransform_mit_best.pt).
OPTIONAL_FOLDER_PREFIXES: list[str] = [
    "app/ecg/checkpoint_best",
    "app/ecg-rag/database/chroma_db",
]
