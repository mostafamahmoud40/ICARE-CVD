"""
S — Orchestrates the inference steps; delegates each step to a specialist.
D — Depends on abstractions (BaseSegmentationModel, BaseEFModel), not concretions.
    Concrete classes are injected by the caller (factory in app.py).
"""
import numpy as np
import scipy.signal

from config import DEVICE
from models import BaseSegmentationModel, BaseEFModel
from preprocessor import VideoPreprocessor
from visualizer import Visualizer


class InferencePipeline:

    def __init__(
        self,
        seg_model:    BaseSegmentationModel,
        ef_model:     BaseEFModel,
        preprocessor: VideoPreprocessor,
        visualizer:   Visualizer,
    ) -> None:
        self._seg  = seg_model
        self._ef   = ef_model
        self._prep = preprocessor
        self._viz  = visualizer

    def run(self, video_path: str) -> dict:
        fps    = self._prep.get_fps(video_path)
        frames = self._prep.load_frames(video_path)
        T      = len(frames)

        masks, areas = [], []
        for frame in frames:
            mask = self._seg.predict_mask(self._prep.frame_to_tensor(frame))
            masks.append(mask)
            areas.append(int(mask.sum()))

        masks  = np.array(masks)
        areas  = np.array(areas)
        es_idx = int(np.argmin(areas))
        ed_idx = int(np.argmax(areas))

        sorted_a   = sorted(areas)
        trim_range = (
            sorted_a[round(len(areas) ** 0.95)]
            - sorted_a[round(len(areas) ** 0.05)]
        )
        systole_frames = set(
            scipy.signal.find_peaks(
                -areas, distance=20, prominence=0.50 * trim_range
            )[0]
        )

        ef_pred = self._ef.predict_ef(self._prep.clip_to_tensor(frames))
        label   = (
            "Normal"         if ef_pred >= 55 else
            "Mildly Reduced" if ef_pred >= 40 else
            "Reduced"
        )

        return dict(
            ef          = round(ef_pred, 1),
            label       = label,
            es_frame    = es_idx,
            ed_frame    = ed_idx,
            es_area     = int(areas[es_idx]),
            ed_area     = int(areas[ed_idx]),
            total_frames= T,
            device      = str(DEVICE),
            frame_viz   = self._viz.frame_grid(
                frames, masks, areas, es_idx, ed_idx, ef_pred, label
            ),
            overlay_gif = self._viz.overlay_gif(frames, masks, fps),
            chart_data  = dict(
                areas          = areas.tolist(),
                es_frame       = es_idx,
                ed_frame       = ed_idx,
                systole_frames = [int(s) for s in sorted(systole_frames)],
            ),
        )
