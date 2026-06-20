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


# ── Chest X-ray (YOLO12s detection) ───────────────────────────────────────────

class XrayDetection(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    box: list[int]  # [x1, y1, x2, y2]


class XrayResponse(BaseModel):
    findings: dict[str, float]
    risk_level: str              # "high" | "moderate" | "normal"
    interpretation: list[str]
    original_b64: str            # source X-ray JPEG (base64 data-URI)
    annotated_b64: str           # X-ray with bounding boxes (base64 data-URI)
    detections: list[XrayDetection]
    total_detections: int
    inference_time_ms: float
