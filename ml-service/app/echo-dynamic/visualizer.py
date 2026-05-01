"""
S — Single responsibility: result visualization only.
"""
import base64
import io

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image as PILImage

_BG   = "#0f172a"
_CARD = "#1e293b"


class Visualizer:
    """Converts raw inference data into base64-encoded images and GIFs."""

    @staticmethod
    def _apply_overlay(frame: np.ndarray, mask: np.ndarray) -> np.ndarray:
        out = frame.copy().astype(np.uint8)
        out[mask == 1] = (
            out[mask == 1] * 0.5 + np.array([255, 0, 0]) * 0.5
        ).astype(np.uint8)
        return out

    @staticmethod
    def _fig_to_b64(fig) -> str:
        buf = io.BytesIO()
        fig.savefig(
            buf, format="png", dpi=150,
            bbox_inches="tight", facecolor=fig.get_facecolor(),
        )
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode()

    def frame_grid(
        self,
        frames: np.ndarray,
        masks: np.ndarray,
        areas: np.ndarray,
        es_idx: int,
        ed_idx: int,
        ef_pred: float,
        label: str,
    ) -> str:
        fig, axes = plt.subplots(2, 3, figsize=(15, 9))
        fig.patch.set_facecolor(_BG)
        for ax in axes.flat:
            ax.set_facecolor(_CARD)
        fig.suptitle(
            f"Predicted EF: {ef_pred:.1f}%  —  {label}",
            fontsize=14, fontweight="bold", color="white",
        )

        indices = [0, ed_idx, es_idx]
        labels  = ["Frame 0", f"ED (frame {ed_idx})", f"ES (frame {es_idx})"]
        for col, (idx, lbl) in enumerate(zip(indices, labels)):
            axes[0, col].imshow(frames[idx].astype(np.uint8))
            axes[0, col].set_title(lbl, color="white")
            axes[0, col].axis("off")
            axes[1, col].imshow(self._apply_overlay(frames[idx], masks[idx]))
            axes[1, col].set_title(f"LV area = {areas[idx]} px", color="white")
            axes[1, col].axis("off")

        axes[0, 0].set_ylabel("Raw",          fontsize=11, color="white")
        axes[1, 0].set_ylabel("Segmentation", fontsize=11, color="white")
        plt.tight_layout()
        return self._fig_to_b64(fig)

    def overlay_gif(
        self, frames: np.ndarray, masks: np.ndarray, orig_fps: float = 30.0
    ) -> str:
        step        = max(1, round(orig_fps / 15))
        s_frames    = frames[::step].astype(np.uint8)
        s_masks     = masks[::step]
        duration_ms = max(33, int(1000 * step / max(orig_fps, 1)))

        images = [
            PILImage.fromarray(self._apply_overlay(f, m))
            for f, m in zip(s_frames, s_masks)
        ]

        buf = io.BytesIO()
        images[0].save(
            buf, format="GIF", save_all=True,
            append_images=images[1:],
            loop=0, duration=duration_ms, optimize=True,
        )
        buf.seek(0)
        return base64.b64encode(buf.read()).decode()
