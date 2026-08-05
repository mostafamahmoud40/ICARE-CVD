"""
Chest X-ray cardiovascular pathology detection.

Uses TorchXRayVision DenseNet121 (pre-trained on all public datasets) to
predict probabilities for four cardiovascular findings and generate
visualizations for display in the frontend.
"""

import base64
import io

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import skimage.io
import torch
import torchvision.transforms as transforms
import torchxrayvision as xrv

matplotlib.use("Agg")

# ─── Constants ────────────────────────────────────────────────────────────────

CARDIO_LABELS = [
    "Cardiomegaly",
    "Edema",
    "Effusion",
    "Enlarged Cardiomediastinum",
]

THRESHOLDS = {
    "Cardiomegaly":              0.6,
    "Edema":                     0.5,
    "Effusion":                  0.5,
    "Enlarged Cardiomediastinum": 0.5,
}


# ─── Model loading ────────────────────────────────────────────────────────────

def load_xray_model(device: torch.device):
    """
    Download (first run) and load DenseNet121 weights.
    Called once at application startup.
    """
    model = xrv.models.DenseNet(weights="densenet121-res224-all")
    model = model.to(device)
    model.eval()
    return model


# ─── Preprocessing ────────────────────────────────────────────────────────────

def _preprocess(image_path: str) -> tuple[torch.Tensor, np.ndarray]:
    """Load and preprocess a chest X-ray; return (tensor, display_array)."""
    img = skimage.io.imread(image_path)
    img = xrv.datasets.normalize(img, 255)          # → [-1024, 1024]

    if len(img.shape) == 3:
        img = img.mean(2)                            # RGB → grayscale

    img = img[None, ...]                             # (1, H, W)

    transform = transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224),
    ])
    img_processed = transform(img)                   # (1, 224, 224)

    display = img_processed[0].copy()                # (224, 224) for visuals
    tensor = torch.from_numpy(img_processed)[None, ...]  # (1, 1, 224, 224)
    return tensor, display


# ─── Inference ────────────────────────────────────────────────────────────────

def run_xray_inference(
    image_path: str,
    model,
    device: torch.device,
) -> tuple[dict[str, float], np.ndarray]:
    """
    Run the DenseNet model on a chest X-ray image.

    Returns:
      - cardio : dict of {label: probability} for the four cardiovascular labels
      - display : (224, 224) float array of the preprocessed image for rendering
    """
    tensor, display = _preprocess(image_path)
    tensor = tensor.to(device)

    with torch.no_grad():
        outputs = model(tensor)

    all_results = dict(zip(model.pathologies, outputs[0].cpu().numpy()))
    cardio = {label: float(all_results.get(label, 0.0)) for label in CARDIO_LABELS}
    return cardio, display


# ─── Interpretation ───────────────────────────────────────────────────────────

def interpret(cardio: dict[str, float]) -> tuple[str, list[str]]:
    """
    Apply clinical thresholds and return (risk_level, findings_list).
    risk_level: "high" | "moderate" | "normal"
    """
    findings: list[str] = []

    if cardio["Cardiomegaly"] > THRESHOLDS["Cardiomegaly"]:
        findings.append("Enlarged heart detected")
    if cardio["Edema"] > THRESHOLDS["Edema"]:
        findings.append("Pulmonary edema (possible heart failure)")
    if cardio["Effusion"] > THRESHOLDS["Effusion"]:
        findings.append("Pleural effusion detected")
    if cardio["Enlarged Cardiomediastinum"] > THRESHOLDS["Enlarged Cardiomediastinum"]:
        findings.append("Mediastinal enlargement detected")

    if cardio["Cardiomegaly"] > 0.6 and (
        cardio["Edema"] > 0.4 or cardio["Effusion"] > 0.4
    ):
        risk = "high"
        findings.append("HIGH RISK: Possible Congestive Heart Failure")
    elif cardio["Edema"] > 0.4 and cardio["Effusion"] > 0.4:
        risk = "moderate"
        findings.append("Possible early Heart Failure")
    elif any(v > 0.4 for v in cardio.values()):
        risk = "moderate"
    else:
        risk = "normal"
        findings.append("No strong cardiovascular abnormality detected")

    return risk, findings


# ─── Visualization ────────────────────────────────────────────────────────────

def generate_xray_visuals(
    display: np.ndarray,
    cardio: dict[str, float],
) -> tuple[str, str]:
    """
    Render the X-ray and a probability bar chart as base64 PNG data-URIs.

    Returns (xray_b64, chart_b64).
    """
    # ── X-ray image ───────────────────────────────────────────────────────────
    img_show = display - display.min()
    denom = img_show.max()
    if denom > 1e-6:
        img_show = img_show / denom

    fig_xray, ax_xray = plt.subplots(figsize=(3, 3), facecolor="#0d1117")
    ax_xray.imshow(img_show, cmap="gray", interpolation="bilinear")
    ax_xray.axis("off")
    fig_xray.tight_layout(pad=0)
    buf = io.BytesIO()
    fig_xray.savefig(buf, format="png", dpi=110,
                     bbox_inches="tight", facecolor="#0d1117", edgecolor="none")
    plt.close(fig_xray)
    buf.seek(0)
    xray_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode()

    # ── Bar chart ─────────────────────────────────────────────────────────────
    labels = list(cardio.keys())
    values = [v * 100 for v in cardio.values()]
    colors = [
        "#ef4444" if v > 60 else "#f59e0b" if v > 40 else "#22c55e"
        for v in values
    ]

    fig_chart, ax = plt.subplots(figsize=(5, 2.5), facecolor="#0d1117")
    bars = ax.barh(labels, values, color=colors, height=0.5)
    ax.set_xlim(0, 105)
    ax.set_xlabel("Probability (%)", color="#8b949e", fontsize=9)
    ax.set_facecolor("#0d1117")
    for spine in ax.spines.values():
        spine.set_color("#30363d")
    ax.tick_params(axis="x", colors="#8b949e", labelsize=8)
    ax.tick_params(axis="y", colors="#c9d1d9", labelsize=9)
    for bar, val in zip(bars, values):
        ax.text(
            min(val + 1.5, 102), bar.get_y() + bar.get_height() / 2,
            f"{val:.0f}%",
            va="center", ha="left", color="#c9d1d9", fontsize=8, fontweight="bold",
        )
    fig_chart.tight_layout(pad=0.5)
    buf2 = io.BytesIO()
    fig_chart.savefig(buf2, format="png", dpi=110,
                      bbox_inches="tight", facecolor="#0d1117", edgecolor="none")
    plt.close(fig_chart)
    buf2.seek(0)
    chart_b64 = "data:image/png;base64," + base64.b64encode(buf2.read()).decode()

    return xray_b64, chart_b64
