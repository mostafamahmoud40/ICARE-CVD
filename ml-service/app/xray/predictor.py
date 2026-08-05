"""
Chest X-ray pathology detection with YOLO12s.

Runs object detection on GPU when available, draws bounding boxes on the source
image, and returns structured findings for the ICARE consultation UI.
"""

from __future__ import annotations

import base64
import io
import time

import cv2
import numpy as np
import torch
from PIL import Image
from ultralytics import YOLO

from .config import CONF_THRESHOLD, DEVICE, GPU_NAME, IMG_SIZE, IOU_THRESHOLD, MODEL_PATH, YOLO_DEVICE

CLASS_COLORS = [
    (0, 212, 255),
    (255, 71, 87),
    (46, 213, 115),
    (255, 165, 2),
    (175, 122, 197),
    (52, 172, 224),
    (255, 218, 68),
    (255, 107, 107),
    (29, 209, 161),
    (250, 177, 160),
]


def load_xray_model() -> YOLO:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"X-ray model not found at: {MODEL_PATH}")

    print(f"[xray] Loading YOLO12s from {MODEL_PATH}")
    print(f"[xray] Inference device: {YOLO_DEVICE} ({GPU_NAME})")

    model = YOLO(str(MODEL_PATH))

    if YOLO_DEVICE != "cpu":
        model.to("cuda:0")
        # Warm-up so weights are on GPU before the first API request.
        dummy = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
        model.predict(
            dummy,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            imgsz=IMG_SIZE,
            device=YOLO_DEVICE,
            verbose=False,
        )
        torch.cuda.synchronize()
        print(f"[xray] GPU warm-up complete on {GPU_NAME}")
    else:
        print("[xray] CUDA unavailable — running on CPU")

    return model


def _get_class_color(class_id: int) -> tuple[int, int, int]:
    return CLASS_COLORS[class_id % len(CLASS_COLORS)]


def read_image_bytes(file_bytes: bytes) -> np.ndarray:
    pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)


def image_to_data_uri(image_np: np.ndarray) -> str:
    _, buffer = cv2.imencode(".jpg", image_np, [cv2.IMWRITE_JPEG_QUALITY, 90])
    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def draw_detections(image_np: np.ndarray, detections: list[dict]) -> np.ndarray:
    img = image_np.copy()
    h, w = img.shape[:2]

    for det in detections:
        x1, y1, x2, y2 = det["box"]
        cls_id = det["class_id"]
        conf = det["confidence"]
        label = det["class"]
        color = _get_class_color(cls_id)

        label_text = f"{label} {conf:.0%}"
        font_scale = max(0.5, min(w, h) / 1000)
        thickness = max(1, int(min(w, h) / 400))

        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness + 1)

        (tw, th), baseline = cv2.getTextSize(
            label_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness,
        )
        label_y = max(y1, th + 10)
        cv2.rectangle(img, (x1, label_y - th - baseline - 4), (x1 + tw + 4, label_y), color, -1)
        cv2.putText(
            img,
            label_text,
            (x1 + 2, label_y - baseline - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            (0, 0, 0),
            thickness,
        )

    return img


def run_xray_inference(
    file_bytes: bytes,
    model: YOLO,
) -> tuple[list[dict], np.ndarray, float]:
    """
    Run YOLO12s on a chest X-ray.

    Returns (detections, source_bgr, inference_time_ms).
    Each detection: {class_id, class, confidence, box}.
    """
    image_np = read_image_bytes(file_bytes)
    t_start = time.perf_counter()
    results = model.predict(
        image_np,
        conf=CONF_THRESHOLD,
        iou=IOU_THRESHOLD,
        imgsz=IMG_SIZE,
        device=YOLO_DEVICE,
        verbose=False,
    )
    if YOLO_DEVICE != "cpu":
        torch.cuda.synchronize()
    inference_ms = (time.perf_counter() - t_start) * 1000

    result = results[0]
    detections: list[dict] = []

    if result.boxes is not None and len(result.boxes) > 0:
        boxes = result.boxes.xyxy.cpu().numpy().astype(int)
        confs = result.boxes.conf.cpu().numpy().tolist()
        cls_ids = result.boxes.cls.cpu().numpy().astype(int).tolist()

        for i in range(len(boxes)):
            cls_id = int(cls_ids[i])
            detections.append({
                "class_id": cls_id,
                "class": model.names[cls_id],
                "confidence": round(float(confs[i]), 4),
                "box": boxes[i].tolist(),
            })

    detections.sort(key=lambda item: item["confidence"], reverse=True)
    return detections, image_np, inference_ms


def findings_from_detections(detections: list[dict]) -> dict[str, float]:
    findings: dict[str, float] = {}
    for det in detections:
        label = det["class"]
        findings[label] = max(findings.get(label, 0.0), det["confidence"])
    return findings


def interpret(detections: list[dict]) -> tuple[str, list[str]]:
    if not detections:
        return "normal", ["No abnormalities detected above the model threshold."]

    interpretation: list[str] = []
    for det in detections:
        interpretation.append(
            f"{det['class']} — {det['confidence']:.0%} confidence (localized region)",
        )

    max_conf = max(det["confidence"] for det in detections)
    if max_conf >= 0.6:
        risk = "high"
        interpretation.append("Elevated findings — correlate with clinical presentation.")
    elif max_conf >= 0.4:
        risk = "moderate"
        interpretation.append("Borderline detections — review annotated regions carefully.")
    else:
        risk = "normal"
        interpretation.append("Low-confidence detections only — verify on source image.")

    return risk, interpretation


def build_xray_visuals(
    image_np: np.ndarray,
    detections: list[dict],
) -> tuple[str, str]:
    """Return (original_data_uri, annotated_data_uri)."""
    annotated = draw_detections(image_np, detections)
    return image_to_data_uri(image_np), image_to_data_uri(annotated)


def device_summary() -> dict[str, str | bool]:
    return {
        "device": str(DEVICE),
        "yolo_device": str(YOLO_DEVICE),
        "gpu_name": GPU_NAME,
        "cuda_available": torch.cuda.is_available(),
    }
