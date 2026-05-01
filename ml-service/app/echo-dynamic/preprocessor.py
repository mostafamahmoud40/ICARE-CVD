"""
S — Single responsibility: video I/O and tensor conversion only.
"""
import cv2
import numpy as np
import torch
from torchvision import transforms

from config import DEVICE, MEAN, STD


class VideoPreprocessor:
    """Loads video frames and converts them to model-ready tensors."""

    def __init__(self, target_size: tuple[int, int] = (112, 112)) -> None:
        self._size = target_size

    def load_frames(self, path: str) -> np.ndarray:
        cap, frames = cv2.VideoCapture(path), []
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, self._size)
            frames.append(frame)
        cap.release()
        return np.array(frames, dtype=np.float32)

    def get_fps(self, path: str) -> float:
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        return float(fps) if fps > 0 else 30.0

    def frame_to_tensor(self, frame: np.ndarray) -> torch.Tensor:
        x = torch.tensor(frame / 255.0, dtype=torch.float32).permute(2, 0, 1)
        return (
            transforms.functional.normalize(x, [MEAN] * 3, [STD] * 3)
            .unsqueeze(0)
            .to(DEVICE)
        )

    def clip_to_tensor(
        self, frames: np.ndarray, n_frames: int = 32, period: int = 2
    ) -> torch.Tensor:
        sampled = frames[::period]
        if len(sampled) < n_frames:
            pad     = np.tile(sampled[-1:], (n_frames - len(sampled), 1, 1, 1))
            sampled = np.concatenate([sampled, pad], axis=0)
        sampled = (sampled[:n_frames] / 255.0 - MEAN) / STD
        clip    = torch.tensor(sampled, dtype=torch.float32).permute(3, 0, 1, 2)
        return clip.unsqueeze(0).to(DEVICE)
