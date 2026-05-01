"""
Coronary artery segmentation — model loading, inference, and slice visualization.

Responsibilities (SRP):
  - Load a BasicUNet model from a checkpoint once.
  - Build the MONAI preprocessing transform pipeline.
  - Run sliding-window inference on a NIfTI CT image.
  - Generate axial / coronal / sagittal slice PNG images for display.
"""

import base64
import gc
import io
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import torch
from monai.inferers import SlidingWindowInferer
from monai.networks.nets import BasicUNet
from monai.transforms import (
    Compose,
    EnsureChannelFirstd,
    LoadImaged,
    NormalizeIntensityd,
    SpatialPadd,
    Spacingd,
)

matplotlib.use("Agg")  # non-interactive backend — safe in server context

ROI_SIZE = (96, 96, 96)


# ─── Transform pipeline ───────────────────────────────────────────────────────

def build_transform() -> Compose:
    """
    Preprocessing pipeline that matches training exactly.
    Only uses the 'image' key — no label required at inference time.
    """
    return Compose(
        [
            LoadImaged(keys=["image"]),
            EnsureChannelFirstd(keys=["image"]),
            SpatialPadd(keys=["image"], spatial_size=ROI_SIZE),
            NormalizeIntensityd(keys="image", nonzero=True, channel_wise=True),
            Spacingd(keys=["image"], pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
        ]
    )


# ─── Model loading ────────────────────────────────────────────────────────────

def load_model(model_path: str, device: torch.device) -> BasicUNet:
    """
    Instantiate BasicUNet, load checkpoint weights, and put it in eval mode.
    Called once at application startup — never on each request.
    """
    model = BasicUNet(
        spatial_dims=3,
        in_channels=1,
        out_channels=2,
        features=(32, 64, 128, 256, 512, 32),
    ).to(device)

    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model


# ─── Inference ────────────────────────────────────────────────────────────────

def run_inference(
    image_path: str,
    model: BasicUNet,
    transform: Compose,
    device: torch.device,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    """
    Preprocess a NIfTI CT image, run sliding-window segmentation, and return:
      - pred     : uint8 ndarray shape (H, W, D), values 0/1
      - affine   : 4×4 float64 affine for the resampled space
      - image_np : float32 ndarray shape (H, W, D), intensity-normalised CT
      - stats    : dict with prediction_shape and coronary_voxel_count
    """
    data = transform({"image": image_path})

    # data["image"] is a MONAI MetaTensor — clone to avoid deprecation warning.
    image: torch.Tensor = data["image"].clone().detach().unsqueeze(0)  # (1,1,H,W,D)

    affine: np.ndarray = np.eye(4, dtype=np.float64)
    if hasattr(data["image"], "meta") and "affine" in data["image"].meta:
        raw = data["image"].meta["affine"]
        affine = raw.numpy() if isinstance(raw, torch.Tensor) else np.asarray(raw)

    _clear_gpu_cache()

    inferer = SlidingWindowInferer(
        roi_size=ROI_SIZE,
        sw_batch_size=1,
        overlap=0.5,
        mode="gaussian",
        device=device,
    )

    with torch.no_grad():
        image_gpu = image.to(device)
        output = inferer(image_gpu, model)
        output = output.cpu()
        del image_gpu

    _clear_gpu_cache()

    pred: np.ndarray = torch.argmax(output, dim=1).numpy()[0].astype(np.uint8)
    image_np: np.ndarray = image.numpy()[0, 0]  # (H, W, D)

    stats = {
        "prediction_shape": list(pred.shape),
        "coronary_voxel_count": int((pred == 1).sum()),
    }

    return pred, affine, image_np, stats


# ─── Visualization ────────────────────────────────────────────────────────────

def generate_slice_images(image_np: np.ndarray, pred_np: np.ndarray) -> dict[str, str]:
    """
    Render axial / coronal / sagittal middle slices as base64 PNG data-URIs.

    image_np : float32 (H, W, D) — intensity-normalised CT volume
    pred_np  : uint8   (H, W, D) — binary segmentation mask (0 = background, 1 = coronary)

    Returns a dict:  {"axial": "data:image/png;base64,...", "coronal": ..., "sagittal": ...}
    """
    H, W, D = pred_np.shape

    # Percentile windowing for good contrast (skip zeros = air/padding)
    nonzero = image_np[image_np != 0]
    if nonzero.size > 0:
        p1, p99 = np.percentile(nonzero, [1, 99])
    else:
        p1, p99 = float(image_np.min()), float(image_np.max())

    img_display = np.clip(image_np, p1, p99)
    denom = max(p99 - p1, 1e-6)
    img_display = (img_display - p1) / denom  # [0, 1]

    orientations = {
        "axial":    (img_display[:, :, D // 2].T,  pred_np[:, :, D // 2].T),
        "coronal":  (img_display[:, W // 2, :].T,  pred_np[:, W // 2, :].T),
        "sagittal": (img_display[H // 2, :, :].T,  pred_np[H // 2, :, :].T),
    }

    result: dict[str, str] = {}
    for name, (img_slice, mask_slice) in orientations.items():
        fig, ax = plt.subplots(figsize=(4, 4), facecolor="#0d1117")
        ax.imshow(img_slice, cmap="gray", origin="lower", interpolation="bilinear")

        if mask_slice.any():
            overlay = np.ma.masked_where(mask_slice == 0, mask_slice.astype(float))
            ax.imshow(
                overlay,
                cmap="Reds",
                alpha=0.65,
                origin="lower",
                interpolation="bilinear",
                vmin=0,
                vmax=1,
            )

        ax.set_title(name.capitalize(), color="#e5eeea", fontsize=11,
                     pad=6, fontweight="bold", fontfamily="monospace")
        ax.axis("off")
        fig.tight_layout(pad=0.4)

        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=110, bbox_inches="tight",
                    facecolor="#0d1117", edgecolor="none")
        plt.close(fig)
        buf.seek(0)
        result[name] = "data:image/png;base64," + base64.b64encode(buf.read()).decode()

    return result


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _clear_gpu_cache() -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
