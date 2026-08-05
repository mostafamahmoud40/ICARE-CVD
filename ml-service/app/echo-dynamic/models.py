"""
S — Each class has exactly one reason to change: its model architecture.
O — Add new architectures by subclassing; never modify existing ones.
D — InferencePipeline depends on these abstractions, not on torch internals.
"""
from abc import ABC, abstractmethod

import numpy as np
import torch
import torch.nn as nn
import torchvision

from config import DEVICE


# ── Abstract interfaces (ISP: one method each) ─────────────────────────────

class BaseSegmentationModel(ABC):
    """Contract: frame tensor → binary LV mask."""

    @abstractmethod
    def predict_mask(self, tensor: torch.Tensor) -> np.ndarray: ...


class BaseEFModel(ABC):
    """Contract: clip tensor → scalar EF value."""

    @abstractmethod
    def predict_ef(self, tensor: torch.Tensor) -> float: ...


# ── Shared checkpoint loader (private helper) ───────────────────────────────

def _load_checkpoint(path: str) -> dict:
    ckpt = torch.load(path, map_location=DEVICE, weights_only=False)
    sd   = ckpt.get("state_dict", ckpt)
    return {k.replace("module.", ""): v for k, v in sd.items()}


# ── Concrete implementations ────────────────────────────────────────────────

class DeepLabSegModel(BaseSegmentationModel):
    """DeepLabV3-ResNet50 segmentation model."""

    def __init__(self, path: str) -> None:
        sd          = _load_checkpoint(path)
        num_classes = next(
            (int(v.shape[0]) for k, v in sd.items() if k == "classifier.4.weight"),
            1,
        )
        net = torchvision.models.segmentation.deeplabv3_resnet50(
            weights=None, num_classes=num_classes
        )
        net.load_state_dict(sd)
        self._net = net.to(DEVICE).eval()

    def predict_mask(self, tensor: torch.Tensor) -> np.ndarray:
        with torch.no_grad():
            return (self._net(tensor)["out"][0, 0] > 0).cpu().numpy().astype(np.uint8)


class R2Plus1DEFModel(BaseEFModel):
    """R(2+1)D-18 regression model for ejection fraction."""

    def __init__(self, path: str) -> None:
        sd  = _load_checkpoint(path)
        net = torchvision.models.video.r2plus1d_18(weights=None)
        net.fc = nn.Linear(net.fc.in_features, 1)
        net.load_state_dict(sd)
        self._net = net.to(DEVICE).eval()

    def predict_ef(self, tensor: torch.Tensor) -> float:
        with torch.no_grad():
            return float(self._net(tensor).item())
