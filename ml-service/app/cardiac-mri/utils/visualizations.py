"""
SRP: This module is responsible ONLY for producing matplotlib figures,
plotly charts, and GIF bytes from plain numpy arrays.

No model inference. No file I/O. No Streamlit calls.
Every public function receives numpy arrays and returns a renderable object or bytes.
"""

import numpy as np
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from io import BytesIO
import imageio


# ── colour constants ───────────────────────────────────────────────────────────

_SEG_GRID_COLORS: dict = {
    1: np.array([255, 220,   0], dtype=np.float32),  # LV    — yellow
    2: np.array([  0, 200,  50], dtype=np.float32),  # Myo   — green
    3: np.array([ 50, 100, 220], dtype=np.float32),  # RV    — blue
}

_GIF_CLASS_COLORS = np.array([
    [  0,   0,   0],
    [  0, 200, 255],  # LV    — cyan
    [255, 140,   0],  # Myo   — orange
    [220,  50, 220],  # RV    — magenta
], dtype=np.float32)

_INTERACTIVE_COLORS: dict = {
    0: np.array([  0,   0,   0], dtype=np.float32),
    1: np.array([255, 220,   0], dtype=np.float32),
    2: np.array([  0, 200,  50], dtype=np.float32),
    3: np.array([ 50, 100, 220], dtype=np.float32),
}

_INTERACTIVE_NAMES: dict = {
    0: "Background",
    1: "LV (Left Ventricle)",
    2: "Myocardium",
    3: "RV (Right Ventricle)",
}

_3D_CLASS_CFG: dict = {
    1: ("LV",         "cyan"),
    2: ("Myocardium", "orange"),
    3: ("RV",         "magenta"),
}


# ── private helpers ────────────────────────────────────────────────────────────

def _norm255(arr: np.ndarray) -> np.ndarray:
    mn, mx = float(arr.min()), float(arr.max())
    return (arr - mn) / (mx - mn) * 255 if mx > mn else arr.copy()


def _norm01(arr: np.ndarray) -> np.ndarray:
    mn, mx = float(arr.min()), float(arr.max())
    return (arr - mn) / (mx - mn) if mx > mn else arr.copy()


# ── public visualization functions ─────────────────────────────────────────────

def plot_intensity_histogram(ed_data: np.ndarray, es_data: np.ndarray):
    """Side-by-side voxel intensity histogram for ED and ES phases."""
    bg = "#0e1117"
    fig, (ax_ed, ax_es) = plt.subplots(1, 2, figsize=(14, 4))
    fig.patch.set_facecolor(bg)
    fig.suptitle("Intensity Histogram — ED vs ES", color="white", fontsize=13, fontweight="bold")

    for ax, data, color, label in [
        (ax_ed, ed_data, "#5bc8f5", "ED"),
        (ax_es, es_data, "#c47a7a", "ES"),
    ]:
        ax.set_facecolor(bg)
        ax.hist(data.ravel(), bins=256, color=color, alpha=0.85)
        ax.set_title(label, color=color, fontsize=12, fontweight="bold")
        ax.set_xlabel("Intensity", color="white")
        ax.set_ylabel("Voxel Count", color="white")
        ax.tick_params(colors="white")
        for sp in ax.spines.values():
            sp.set_edgecolor("#333333")

    plt.tight_layout()
    return fig


def display_overview(ed_data: np.ndarray, es_data: np.ndarray, file_name: str = ""):
    """4-row × N-slice grid: ED | ES | ED−ES diff (RdBu) | colour overlay."""
    num_slices = ed_data.shape[2]
    fig, axes = plt.subplots(4, num_slices, figsize=(3 * num_slices, 12), squeeze=False)
    fig.patch.set_facecolor("black")

    row_labels = ["ED", "ES", "ED – ES", "Overlay (R=ED, G=ES)"]
    row_colors = ["cyan", "salmon", "magenta", "lime"]

    patient_label = file_name.replace(".nii.gz", "").replace("_", " ") if file_name else ""
    title = (
        f"{patient_label} — Cardiac MRI\nED (End Diastole) vs ES (End Systole)"
        if patient_label
        else "Cardiac MRI — ED (End Diastole) vs ES (End Systole)"
    )
    fig.suptitle(title, color="white", fontsize=13, fontweight="bold", y=1.01)

    for i in range(num_slices):
        ed_s, es_s = ed_data[:, :, i], es_data[:, :, i]
        ed_n, es_n = _norm01(ed_s), _norm01(es_s)

        for row, img in [(0, ed_n), (1, es_n)]:
            ax = axes[row, i]
            ax.imshow(img, cmap="gray")
            ax.set_facecolor("black")
            ax.set_xticks([]); ax.set_yticks([])
            for sp in ax.spines.values():
                sp.set_visible(False)
            if row == 0:
                ax.set_xlabel(f"Slice {i + 1}", color="white", fontsize=8)

        diff = ed_s.astype(float) - es_s.astype(float)
        abs_max = float(np.abs(diff).max()) or 1.0
        ax_diff = axes[2, i]
        ax_diff.imshow(diff, cmap="RdBu_r", vmin=-abs_max, vmax=abs_max)
        ax_diff.set_facecolor("white")
        ax_diff.set_xticks([]); ax_diff.set_yticks([])
        for sp in ax_diff.spines.values():
            sp.set_visible(False)

        overlay = np.zeros((*ed_s.shape, 3))
        overlay[:, :, 0] = ed_n
        overlay[:, :, 1] = es_n
        ax_ov = axes[3, i]
        ax_ov.imshow(np.clip(overlay, 0, 1))
        ax_ov.set_facecolor("black")
        ax_ov.set_xticks([]); ax_ov.set_yticks([])
        for sp in ax_ov.spines.values():
            sp.set_visible(False)

    for row_idx, (label, color) in enumerate(zip(row_labels, row_colors)):
        axes[row_idx, 0].set_ylabel(
            label, color=color, fontsize=10, fontweight="bold",
            rotation=0, labelpad=55, va="center",
        )

    plt.tight_layout()
    return fig


def interactive_seg_viewer(
    frame: np.ndarray, mask: np.ndarray, slice_idx: int = 0, phase: str = "ED"
):
    """Plotly heatmap with per-pixel class name on hover."""
    norm = _norm255(frame.astype(float))
    rgb = np.stack([norm, norm, norm], axis=-1).astype(np.float32)

    for cls, color in _INTERACTIVE_COLORS.items():
        if cls == 0:
            continue
        cls_bool = mask == cls
        if np.any(cls_bool):
            rgb[cls_bool] = rgb[cls_bool] * 0.25 + color * 0.75

    rgb = rgb.clip(0, 255).astype(np.uint8)
    label_arr = np.vectorize(
        lambda v: _INTERACTIVE_NAMES.get(int(v), "Background")
    )(mask.clip(0, 3))

    fig = px.imshow(rgb)
    fig.update_traces(
        customdata=label_arr,
        hovertemplate=(
            '<b style="font-size:14px">%{customdata}</b>'
            "<br>x: %{x} &nbsp; y: %{y}"
            "<extra></extra>"
        ),
    )
    fig.update_layout(
        title=dict(
            text=(
                f"{phase} — Slice {slice_idx} &nbsp;|&nbsp; "
                '<span style="color:#FFDC00">&#9632; LV</span>  '
                '<span style="color:#00C832">&#9632; Myocardium</span>  '
                '<span style="color:#3264DC">&#9632; RV</span>'
            ),
            font=dict(color="white", size=13),
        ),
        paper_bgcolor="#0e1117",
        plot_bgcolor="black",
        margin=dict(l=10, r=10, t=50, b=10),
        height=600,
        xaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
        yaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
        hoverlabel=dict(
            bgcolor="#1a1a2e", font_color="white", font_size=13, bordercolor="#555555"
        ),
    )
    return fig


def display_seg_grid(frames: np.ndarray, masks: np.ndarray, title_prefix: str = "ED"):
    """Grid of per-slice segmentation overlays."""
    n = frames.shape[0]
    ncols = min(n, 5)
    nrows = (n + ncols - 1) // ncols

    fig, axes = plt.subplots(nrows, ncols, figsize=(5 * ncols, 5 * nrows), squeeze=False)
    fig.patch.set_facecolor("black")

    for idx in range(n):
        row, col = idx // ncols, idx % ncols
        ax = axes[row, col]

        raw = frames[idx].astype(float)
        mn, mx = raw.min(), raw.max()
        norm = (raw - mn) / (mx - mn) * 255 if mx > mn else raw.copy()
        frame = np.stack([norm, norm, norm], axis=-1).astype(np.float32)

        mask = masks[idx]
        for cls, color in _SEG_GRID_COLORS.items():
            cls_bool = mask == cls
            if np.any(cls_bool):
                frame[cls_bool] = frame[cls_bool] * 0.25 + color * 0.75

        ax.imshow(frame.clip(0, 255).astype(np.uint8))
        ax.set_facecolor("black")
        ax.set_xticks([]); ax.set_yticks([])
        for sp in ax.spines.values():
            sp.set_visible(False)
        ax.set_title(f"S{idx}  thresh={int(mx)}", color="white", fontsize=9, pad=4)

        for cls, color in _SEG_GRID_COLORS.items():
            cls_bool = mask == cls
            if np.any(cls_bool):
                pts = np.argwhere(cls_bool)
                cy, cx = pts.mean(axis=0)
                ax.text(
                    cx, cy, f"{int(np.sum(cls_bool))}.0",
                    color="white", fontsize=7.5, ha="center", va="center", fontweight="bold",
                )

    for idx in range(n, nrows * ncols):
        axes[idx // ncols, idx % ncols].set_visible(False)

    fig.suptitle(
        f"Segmentation Grid — {title_prefix} Phase",
        color="white", fontsize=12, fontweight="bold", y=1.01,
    )
    plt.tight_layout()
    return fig


def build_seg_gif(
    img_ed_frames: np.ndarray,
    img_es_frames: np.ndarray,
    ed_masks: np.ndarray,
    es_masks: np.ndarray,
) -> bytes:
    """Animated GIF alternating ED ↔ ES frames with colour-coded segmentation overlays."""
    frames = []
    for i in range(img_ed_frames.shape[0]):
        for raw, mask in [
            (img_ed_frames[i], ed_masks[i]),
            (img_es_frames[i], es_masks[i]),
        ]:
            arr = _norm255(raw.astype(float))
            frame = np.stack([arr, arr, arr], axis=-1).astype(np.float32)
            m = mask.astype(int)
            colored = _GIF_CLASS_COLORS[m]
            mask_bool = m > 0
            frame[mask_bool] = frame[mask_bool] * 0.4 + colored[mask_bool] * 0.6
            frames.append(frame.clip(0, 255).astype(np.uint8))

    buf = BytesIO()
    imageio.mimsave(buf, frames, format="GIF", duration=0.12, loop=0)
    buf.seek(0)
    return buf.getvalue()


def plot_thickening_map(ed_masks: np.ndarray, es_masks: np.ndarray):
    """Grouped bar chart: myocardial pixel count per slice — proxy for wall thickening."""
    n = ed_masks.shape[0]
    slices = list(range(1, n + 1))
    ed_myo = [int(np.sum(ed_masks[i] == 2)) for i in range(n)]
    es_myo = [int(np.sum(es_masks[i] == 2)) for i in range(n)]

    fig = go.Figure()
    fig.add_trace(go.Bar(x=slices, y=ed_myo, name="ED Myocardium", marker_color="#5bc8f5"))
    fig.add_trace(go.Bar(x=slices, y=es_myo, name="ES Myocardium", marker_color="#c47a7a"))
    fig.update_layout(
        barmode="group",
        title="Myocardial Area per Slice: ED vs ES (Thickening Proxy)",
        xaxis_title="Slice Number",
        yaxis_title="Pixel Count",
    )
    return fig


def plot_wall_motion(ed_masks: np.ndarray, es_masks: np.ndarray):
    """LV centroid displacement (pixels) from ED to ES per slice."""
    n = ed_masks.shape[0]
    slices = list(range(1, n + 1))
    displacements = []
    for i in range(n):
        lv_ed = np.argwhere(ed_masks[i] == 1)
        lv_es = np.argwhere(es_masks[i] == 1)
        d = (
            float(np.linalg.norm(lv_ed.mean(axis=0) - lv_es.mean(axis=0)))
            if len(lv_ed) > 0 and len(lv_es) > 0
            else 0.0
        )
        displacements.append(d)

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=slices, y=displacements,
        mode="lines+markers", name="LV Centroid Shift",
        line=dict(color="#ffa500", width=2),
        fill="tozeroy", fillcolor="rgba(255,165,0,0.15)",
    ))
    fig.update_layout(
        title="Wall Motion: LV Centroid Displacement (ED → ES) per Slice",
        xaxis_title="Slice Number",
        yaxis_title="Displacement (pixels)",
    )
    return fig


def display_3d_rendering(ed_masks: np.ndarray):
    """3D point cloud of LV, Myocardium and RV structures from ED segmentation masks."""
    step = 6
    vol = ed_masks[:, ::step, ::step].astype(float)
    N, H, W = vol.shape
    z_c = np.linspace(0, 1, max(N, 1))
    y_c = np.linspace(0, 1, max(H, 1))
    x_c = np.linspace(0, 1, max(W, 1))

    fig = go.Figure()
    for cls, (label, color) in _3D_CLASS_CFG.items():
        pts = np.argwhere(vol == cls)
        if len(pts) == 0:
            continue
        fig.add_trace(go.Scatter3d(
            x=x_c[pts[:, 2]], y=y_c[pts[:, 1]], z=z_c[pts[:, 0]],
            mode="markers",
            marker=dict(size=2, color=color, opacity=0.5),
            name=label,
        ))
    fig.update_layout(
        title="3D Cardiac Structure Rendering (ED Phase)",
        scene=dict(
            bgcolor="black",
            xaxis=dict(title="X"),
            yaxis=dict(title="Y"),
            zaxis=dict(title="Slice"),
        ),
        paper_bgcolor="#0e1117",
        font=dict(color="white"),
    )
    return fig


def display_mpr(
    ed_vol: np.ndarray, es_vol: np.ndarray, ax_i: int, sag_i: int, cor_i: int
):
    """2-row × 3-col Multi-Planar Reformatting: Axial / Sagittal / Coronal for ED and ES."""
    bg = "black"
    fig, axes = plt.subplots(2, 3, figsize=(15, 8), squeeze=False)
    fig.patch.set_facecolor(bg)
    fig.suptitle(
        "Multi-Planar Reformatting: ED vs ES",
        color="white", fontsize=13, fontweight="bold",
    )
    views = [
        (ed_vol[:, :, ax_i],  es_vol[:, :, ax_i],  "Axial"),
        (ed_vol[sag_i, :, :], es_vol[sag_i, :, :], "Sagittal"),
        (ed_vol[:, cor_i, :], es_vol[:, cor_i, :], "Coronal"),
    ]
    for col_idx, (ed_s, es_s, view_name) in enumerate(views):
        for row_idx, (sl, phase, color) in enumerate([
            (ed_s, "ED", "cyan"),
            (es_s, "ES", "salmon"),
        ]):
            ax = axes[row_idx, col_idx]
            ax.imshow(sl.T, cmap="gray", aspect="auto", origin="lower")
            ax.set_title(f"{phase} – {view_name}", color=color, fontsize=10, fontweight="bold")
            ax.set_facecolor(bg)
            ax.set_xticks([]); ax.set_yticks([])
            for sp in ax.spines.values():
                sp.set_edgecolor("#333333")
    plt.tight_layout()
    return fig


def plot_mean_signal_per_slice(ed_data: np.ndarray, es_data: np.ndarray):
    """Line chart: mean voxel intensity per slice comparing ED and ES phases."""
    ed_means = [ed_data[:, :, i].mean() for i in range(ed_data.shape[2])]
    es_means = [es_data[:, :, i].mean() for i in range(es_data.shape[2])]
    slices = list(range(1, len(ed_means) + 1))

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=slices, y=ed_means, mode="lines+markers", name="ED"))
    fig.add_trace(go.Scatter(x=slices, y=es_means, mode="lines+markers", name="ES"))
    fig.update_layout(
        title="Mean Signal per Slice: ED vs ES",
        xaxis_title="Slice Number",
        yaxis_title="Mean Signal Intensity",
        legend=dict(title="Phase"),
    )
    return fig


def display_video(array: np.ndarray) -> bytes:
    """Animate a (N, H, W) uint8 array as a grayscale GIF and return raw bytes."""
    rgb_array = np.stack((array,) * 3, axis=-1)
    buf = BytesIO()
    imageio.mimsave(buf, rgb_array, format="GIF", duration=0.1, loop=0)
    buf.seek(0)
    return buf.getvalue()
