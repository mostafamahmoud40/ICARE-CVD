"""MaxViT ECG image classifier (3-class)."""

from __future__ import annotations

import base64
import io
import os
import traceback

import cv2
import numpy as np
import timm
import torch
from PIL import Image
from torchvision import transforms

CLASSES = ["Normal", "Atrial Fibrillation", "Myocardial Infarction"]

CLASS_COLORS = {
    "Normal": "#22c55e",
    "Atrial Fibrillation": "#f59e0b",
    "Myocardial Infarction": "#ef4444",
}


class MaxViTECGModel:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = timm.create_model("maxvit_base_tf_384.in1k", pretrained=False, num_classes=3)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"ECG classification weights not found: {model_path}")
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
        self.model.to(self.device)
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((384, 384)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def predict(self, image: Image.Image) -> dict:
        try:
            orig_image = image.convert("RGB")
            input_tensor = self.transform(orig_image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                output = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(output[0], dim=0)
                confidence, predicted_idx = torch.max(probabilities, 0)
                pred_label = CLASSES[predicted_idx.item()]

            gradcam_base64 = self._gradcam(orig_image, input_tensor)

            return {
                "prediction": pred_label,
                "confidence": float(confidence),
                "probabilities": {CLASSES[i]: float(probabilities[i]) for i in range(len(CLASSES))},
                "color": CLASS_COLORS.get(pred_label, "#6b7280"),
                "gradcam_b64": gradcam_base64,
            }
        except Exception as exc:
            traceback.print_exc()
            return {"error": str(exc)}

    def _gradcam(self, orig_image: Image.Image, input_tensor: torch.Tensor) -> str:
        try:
            input_tensor = input_tensor.clone().detach().requires_grad_(True)
            out = self.model(input_tensor)
            score = out.max()
            self.model.zero_grad()
            score.backward()

            if input_tensor.grad is None:
                return ""

            saliency = input_tensor.grad.data.abs()
            saliency, _ = torch.max(saliency, dim=1)
            cam = saliency[0].cpu().numpy()
            cam = cv2.GaussianBlur(cam, (15, 15), 0)
            cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-7)

            img_np = np.array(orig_image.resize((384, 384)))
            heatmap_img = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
            heatmap_img = cv2.cvtColor(heatmap_img, cv2.COLOR_BGR2RGB)
            overlay = cv2.addWeighted(img_np, 0.5, heatmap_img, 0.5, 0)

            ok, buffer = cv2.imencode(".jpg", cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
            if not ok:
                return ""
            return base64.b64encode(buffer).decode()
        except Exception:
            return ""
