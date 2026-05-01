from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    device: str
    model_loaded: bool


# ── CT segmentation ───────────────────────────────────────────────────────────

class SliceImages(BaseModel):
    axial: str
    coronal: str
    sagittal: str


class SegmentationResponse(BaseModel):
    voxel_count: int
    pred_shape: list[int]
    volume_ml: float
    elapsed_sec: float
    slices: SliceImages
    mask_b64: str


# ── Chest X-ray ───────────────────────────────────────────────────────────────

class XrayResponse(BaseModel):
    findings: dict[str, float]   # {"Cardiomegaly": 0.72, ...}
    risk_level: str              # "high" | "moderate" | "normal"
    interpretation: list[str]
    xray_b64: str                # processed X-ray PNG (base64 data-URI)
    chart_b64: str               # probability bar chart PNG (base64 data-URI)
