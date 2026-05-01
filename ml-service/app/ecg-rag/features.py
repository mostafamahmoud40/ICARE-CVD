"""Comprehensive ECG feature extraction.

Computes:
  - Rhythm (HR mean/min/max, RR variability)
  - HRV time-domain (SDNN, RMSSD, pNN50)
  - Wave intervals (PR, QT, QTc Bazett & Fridericia, P-dur, T-dur, ST-dur, QRS-dur)
  - Per-lead amplitudes (R, Q, S, T) for all 12 leads
  - Mean QRS axis (degrees) + classification
  - ST elevation/depression at J+80ms per lead + MI territory localization
  - T-wave inversion per lead (with normal-vs-concerning flag)
  - LVH criteria (Sokolow-Lyon, Cornell)
  - RVH criteria (R(V1), R/S ratio)
  - Atrial enlargement (LAE/RAE)
  - Conduction abnormalities (AVB, LBBB/RBBB, WPW)
  - Signal quality (mean ECG_Quality)
"""
from __future__ import annotations

import numpy as np


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _peak_indices(series):
    """Convert a 0/1 marker column from neurokit2 into integer indices."""
    return np.where(series.fillna(0).to_numpy() == 1)[0]


def _canonicalize_lead_names(sig_names):
    """Normalize WFDB lead names ('AVR','I','V5'...) into canonical 'aVR','I','V5'..."""
    out = []
    for n in sig_names:
        u = n.upper().strip()
        if u == "AVR":
            out.append("aVR")
        elif u == "AVL":
            out.append("aVL")
        elif u == "AVF":
            out.append("aVF")
        else:
            out.append(u)
    return out


def _avg_interval_ms(starts, ends, sampling_rate, lo_ms, hi_ms):
    """Pair each start with the nearest following end. Average physiologically valid intervals."""
    durs = []
    for s in starts:
        following = ends[ends > s]
        if len(following):
            d = (following[0] - s) / sampling_rate * 1000.0
            if lo_ms <= d <= hi_ms:
                durs.append(d)
    return float(np.mean(durs)) if durs else 0.0


# ---------------------------------------------------------------------------
# 1. Rhythm & HRV
# ---------------------------------------------------------------------------
def compute_rr_intervals_ms(r_peaks, sampling_rate):
    if len(r_peaks) < 2:
        return np.array([])
    return np.diff(r_peaks).astype(float) / sampling_rate * 1000.0


def compute_heart_rate(rr_ms):
    if len(rr_ms) == 0:
        return {"mean_bpm": 0.0, "min_bpm": 0.0, "max_bpm": 0.0,
                "rr_cv": 0.0, "rhythm_regular": False, "classification": "Unknown"}
    hrs = 60000.0 / rr_ms
    cv = float(np.std(rr_ms) / np.mean(rr_ms)) if np.mean(rr_ms) else 0.0
    mean_hr = float(np.mean(hrs))
    if mean_hr < 60:
        cls = "Bradycardia"
    elif mean_hr > 100:
        cls = "Tachycardia"
    else:
        cls = "Normal"
    return {
        "mean_bpm": mean_hr,
        "min_bpm": float(np.min(hrs)),
        "max_bpm": float(np.max(hrs)),
        "rr_cv": cv,
        "rhythm_regular": bool(cv < 0.1),
        "classification": cls,
    }


def compute_hrv(rr_ms):
    """Time-domain HRV indices (need ≥ 3 RR intervals)."""
    out = {"sdnn_ms": 0.0, "rmssd_ms": 0.0, "pnn50_pct": 0.0, "mean_rr_ms": 0.0}
    if len(rr_ms) < 3:
        return out
    diffs = np.diff(rr_ms)
    out["mean_rr_ms"] = float(np.mean(rr_ms))
    out["sdnn_ms"] = float(np.std(rr_ms, ddof=1))
    out["rmssd_ms"] = float(np.sqrt(np.mean(diffs ** 2)))
    out["pnn50_pct"] = float(np.mean(np.abs(diffs) > 50) * 100.0)
    return out


# ---------------------------------------------------------------------------
# 2. Wave Intervals
# ---------------------------------------------------------------------------
def compute_intervals(ecg_signal, sampling_rate):
    """All wave intervals in ms. Missing columns are silently skipped (returned 0.0)."""
    def col(name):
        return _peak_indices(ecg_signal[name]) if name in ecg_signal.columns else np.array([], dtype=int)

    p_on = col("ECG_P_Onsets")
    p_off = col("ECG_P_Offsets")
    r_on = col("ECG_R_Onsets")
    r_off = col("ECG_R_Offsets")
    t_on = col("ECG_T_Onsets")
    t_off = col("ECG_T_Offsets")
    r_peaks = col("ECG_R_Peaks")

    pr_ms = _avg_interval_ms(p_on, r_on, sampling_rate, 80, 300)
    p_dur_ms = _avg_interval_ms(p_on, p_off, sampling_rate, 40, 200)
    qt_ms = _avg_interval_ms(r_on, t_off, sampling_rate, 200, 600)
    t_dur_ms = _avg_interval_ms(t_on, t_off, sampling_rate, 80, 400)
    st_dur_ms = _avg_interval_ms(r_off, t_on, sampling_rate, 20, 300)

    rr_ms = compute_rr_intervals_ms(r_peaks, sampling_rate)
    if qt_ms > 0 and len(rr_ms):
        rr_sec = float(np.mean(rr_ms)) / 1000.0
        qtc_bazett = qt_ms / np.sqrt(rr_sec) if rr_sec > 0 else 0.0
        qtc_fridericia = qt_ms / (rr_sec ** (1.0 / 3.0)) if rr_sec > 0 else 0.0
    else:
        qtc_bazett = 0.0
        qtc_fridericia = 0.0

    return {
        "pr_ms": pr_ms,
        "p_dur_ms": p_dur_ms,
        "qt_ms": qt_ms,
        "qtc_bazett_ms": float(qtc_bazett),
        "qtc_fridericia_ms": float(qtc_fridericia),
        "t_dur_ms": t_dur_ms,
        "st_dur_ms": st_dur_ms,
    }


def compute_qrs_duration(ecg_signal, sampling_rate):
    r_on = _peak_indices(ecg_signal["ECG_R_Onsets"]) if "ECG_R_Onsets" in ecg_signal.columns else np.array([])
    r_off = _peak_indices(ecg_signal["ECG_R_Offsets"]) if "ECG_R_Offsets" in ecg_signal.columns else np.array([])
    return _avg_interval_ms(r_on, r_off, sampling_rate, 30, 250)


# ---------------------------------------------------------------------------
# 3. Per-lead amplitudes (R, Q, S, T) measured around R-peaks of Lead II
# ---------------------------------------------------------------------------
def compute_amplitudes_per_lead(raw_signal, r_peaks, lead_names, sampling_rate=100, qs_window_ms=80):
    """For every lead, average R/Q/S/T amplitudes across all detected beats.

    R: signal at R-peak.
    Q: minimum in [R-window, R].
    S: minimum in [R, R+window].
    T: signed extremum in [R+100ms, R+400ms] (positive or negative T).
    """
    if len(r_peaks) == 0:
        return {n: {"R": 0.0, "Q": 0.0, "S": 0.0, "T": 0.0} for n in lead_names}

    half = int(qs_window_ms / 1000.0 * sampling_rate)
    n_samples = raw_signal.shape[0]
    out = {}
    for i, name in enumerate(lead_names):
        sig = raw_signal[:, i]
        r_a, q_a, s_a, t_a = [], [], [], []
        for rp in r_peaks:
            if rp >= n_samples:
                continue
            r_a.append(sig[rp])
            q_start = max(0, rp - half)
            if q_start < rp:
                q_a.append(np.min(sig[q_start:rp]))
            s_end = min(n_samples, rp + half)
            if rp < s_end:
                s_a.append(np.min(sig[rp:s_end]))
            t_start = rp + int(0.10 * sampling_rate)
            t_end = min(n_samples, rp + int(0.40 * sampling_rate))
            if t_start < t_end:
                seg = sig[t_start:t_end]
                idx = int(np.argmax(np.abs(seg)))
                t_a.append(seg[idx])
        out[name] = {
            "R": float(np.mean(r_a)) if r_a else 0.0,
            "Q": float(np.mean(q_a)) if q_a else 0.0,
            "S": float(np.mean(s_a)) if s_a else 0.0,
            "T": float(np.mean(t_a)) if t_a else 0.0,
        }
    return out


def compute_p_amplitudes_per_lead(raw_signal, p_peaks, lead_names):
    """Average P-wave amplitude (mV) per lead at detected P-peak indices."""
    n_samples = raw_signal.shape[0]
    out = {}
    if len(p_peaks) == 0:
        return {n: 0.0 for n in lead_names}
    valid = p_peaks[p_peaks < n_samples]
    for i, name in enumerate(lead_names):
        sig = raw_signal[:, i]
        out[name] = float(np.mean(sig[valid])) if len(valid) else 0.0
    return out


# ---------------------------------------------------------------------------
# 4. Mean QRS / T axis (frontal plane)
# ---------------------------------------------------------------------------
def compute_qrs_axis(amplitudes):
    """Net QRS in I and aVF → axis angle (deg) + classification."""
    if not amplitudes or "I" not in amplitudes or "aVF" not in amplitudes:
        return {"axis_deg": 0.0, "axis_class": "Indeterminate"}

    def net(lead):
        a = amplitudes[lead]
        return a["R"] - abs(a["Q"]) - abs(a["S"])

    I = net("I")
    aVF = net("aVF")
    if I == 0 and aVF == 0:
        return {"axis_deg": 0.0, "axis_class": "Indeterminate"}
    angle = float(np.degrees(np.arctan2(aVF, I)))
    if -30 <= angle <= 90:
        cls = "Normal"
    elif -90 <= angle < -30:
        cls = "Left axis deviation (LAD)"
    elif 90 < angle <= 180:
        cls = "Right axis deviation (RAD)"
    else:
        cls = "Extreme axis deviation"
    return {"axis_deg": angle, "axis_class": cls}


# ---------------------------------------------------------------------------
# 5. ST elevation / depression per lead at J+80ms
# ---------------------------------------------------------------------------
def compute_st_per_lead(raw_signal, r_offsets, lead_names, sampling_rate=100,
                        elev_threshold_mv=0.10, depr_threshold_mv=-0.10):
    n_samples = raw_signal.shape[0]
    out = {}
    if len(r_offsets) == 0:
        return {n: {"st_mv": 0.0, "elevated": False, "depressed": False} for n in lead_names}

    j_offset = int(0.08 * sampling_rate)
    for i, name in enumerate(lead_names):
        sig = raw_signal[:, i]
        baseline = float(np.median(sig))
        deflections = []
        for ro in r_offsets:
            j80 = ro + j_offset
            if j80 < n_samples:
                deflections.append(sig[j80] - baseline)
        st_mv = float(np.mean(deflections)) if deflections else 0.0
        out[name] = {
            "st_mv": st_mv,
            "elevated": bool(st_mv > elev_threshold_mv),
            "depressed": bool(st_mv < depr_threshold_mv),
        }
    return out


def compute_t_inversion_per_lead(amplitudes, threshold_mv=-0.10):
    """T-wave inversion per lead. Negative T in aVR / V1 is normal."""
    expected_negative = {"aVR", "V1"}
    out = {}
    for lead, a in amplitudes.items():
        inverted = a["T"] < threshold_mv
        out[lead] = {
            "t_inverted": bool(inverted),
            "t_amplitude_mv": float(a["T"]),
            "concerning": bool(inverted and lead not in expected_negative),
        }
    return out


def localize_mi(st_per_lead):
    """Group ST elevations into anatomical territories. STEMI suspected when ≥2 contiguous leads."""
    territories = {
        "Anterior":      ["V1", "V2", "V3", "V4"],
        "Inferior":      ["II", "III", "aVF"],
        "Lateral":       ["I", "aVL", "V5", "V6"],
        "Septal":        ["V1", "V2"],
        "Anterolateral": ["I", "aVL", "V3", "V4", "V5", "V6"],
    }
    out = {}
    for region, leads in territories.items():
        elev = [l for l in leads if l in st_per_lead and st_per_lead[l]["elevated"]]
        depr = [l for l in leads if l in st_per_lead and st_per_lead[l]["depressed"]]
        out[region] = {
            "elevated_leads": elev,
            "depressed_leads": depr,
            "stemi_suspected": bool(len(elev) >= 2),
        }
    return out


# ---------------------------------------------------------------------------
# 6. Hypertrophy / Enlargement criteria
# ---------------------------------------------------------------------------
def compute_lvh_criteria(amplitudes):
    """Sokolow-Lyon and Cornell. Inputs/outputs in mV (1 mm ECG = 0.1 mV)."""
    def amp(lead, kind):
        if lead in amplitudes:
            return abs(amplitudes[lead][kind])
        return 0.0

    sokolow = amp("V1", "S") + max(amp("V5", "R"), amp("V6", "R"))
    cornell = amp("aVL", "R") + amp("V3", "S")
    return {
        "sokolow_lyon_mv": float(sokolow),
        "sokolow_lyon_lvh": bool(sokolow >= 3.5),       # ≥ 35 mm
        "cornell_mv": float(cornell),
        "cornell_lvh_male": bool(cornell >= 2.8),       # ≥ 28 mm
        "cornell_lvh_female": bool(cornell >= 2.0),     # ≥ 20 mm
    }


def compute_rvh_criteria(amplitudes):
    R_v1 = amplitudes.get("V1", {}).get("R", 0.0)
    S_v1 = abs(amplitudes.get("V1", {}).get("S", 0.0))
    rs_ratio = float(R_v1 / S_v1) if S_v1 > 1e-6 else 0.0
    return {
        "r_v1_mv": float(R_v1),
        "s_v1_mv": float(S_v1),
        "rs_ratio_v1": rs_ratio,
        "rvh_suspected": bool(R_v1 > 0.7 or rs_ratio > 1.0),
    }


def compute_atrial_enlargement(p_amplitudes, intervals):
    p_amp_ii = float(p_amplitudes.get("II", 0.0))
    p_amp_v1 = float(p_amplitudes.get("V1", 0.0))
    return {
        "p_dur_ms": intervals.get("p_dur_ms", 0.0),
        "p_amp_ii_mv": p_amp_ii,
        "p_amp_v1_mv": p_amp_v1,
        "lae_suspected": bool(intervals.get("p_dur_ms", 0.0) > 120.0),
        "rae_suspected": bool(p_amp_ii > 0.25),  # > 2.5 mm in II
    }


# ---------------------------------------------------------------------------
# 7. Conduction abnormalities
# ---------------------------------------------------------------------------
def detect_conduction(intervals, qrs_duration_ms, amplitudes):
    pr = intervals.get("pr_ms", 0.0)
    out = {
        "pr_ms": pr,
        "qrs_duration_ms": float(qrs_duration_ms),
        "first_degree_avb": bool(pr > 200.0),
        "wide_qrs": bool(qrs_duration_ms > 120.0),
        "lbbb_suspected": False,
        "rbbb_suspected": False,
        "wpw_suspected": bool(0 < pr < 120.0 and qrs_duration_ms > 110.0),
    }
    if out["wide_qrs"] and "V1" in amplitudes and "V6" in amplitudes:
        v1_R = amplitudes["V1"]["R"]
        v1_S = abs(amplitudes["V1"]["S"])
        v6_R = amplitudes["V6"]["R"]
        v6_S = abs(amplitudes["V6"]["S"])
        # LBBB: deep S in V1 (QS / rS), tall R in V6
        out["lbbb_suspected"] = bool(v1_S > v1_R and v6_R > v6_S)
        # RBBB: rsR' in V1 (R taller), wide S in V6
        out["rbbb_suspected"] = bool(v1_R > 0.5 and v6_S > v6_R)
    return out


# ---------------------------------------------------------------------------
# 8. Signal quality
# ---------------------------------------------------------------------------
def compute_signal_quality(ecg_signal):
    if "ECG_Quality" in ecg_signal.columns:
        q = ecg_signal["ECG_Quality"].dropna().to_numpy()
        return {"mean_quality": float(np.mean(q)) if len(q) else 0.0}
    return {"mean_quality": 0.0}


# ---------------------------------------------------------------------------
# Master extractor
# ---------------------------------------------------------------------------
def compute_all_features(ecg_signal, raw_signal, sig_names, sampling_rate=100):
    """Return a structured dict with all feature groups."""
    lead_names = _canonicalize_lead_names(sig_names)

    r_peaks = _peak_indices(ecg_signal["ECG_R_Peaks"])
    r_offsets = _peak_indices(ecg_signal["ECG_R_Offsets"]) if "ECG_R_Offsets" in ecg_signal.columns else np.array([], dtype=int)
    p_peaks = _peak_indices(ecg_signal["ECG_P_Peaks"]) if "ECG_P_Peaks" in ecg_signal.columns else np.array([], dtype=int)

    rr_ms = compute_rr_intervals_ms(r_peaks, sampling_rate)
    rhythm = compute_heart_rate(rr_ms)
    hrv = compute_hrv(rr_ms)
    intervals = compute_intervals(ecg_signal, sampling_rate)
    qrs_dur_ms = compute_qrs_duration(ecg_signal, sampling_rate)

    amplitudes = compute_amplitudes_per_lead(raw_signal, r_peaks, lead_names, sampling_rate=sampling_rate)
    p_amplitudes = compute_p_amplitudes_per_lead(raw_signal, p_peaks, lead_names)
    axis = compute_qrs_axis(amplitudes)
    st_per_lead = compute_st_per_lead(raw_signal, r_offsets, lead_names, sampling_rate=sampling_rate)
    t_inv = compute_t_inversion_per_lead(amplitudes)
    mi_loc = localize_mi(st_per_lead)
    lvh = compute_lvh_criteria(amplitudes)
    rvh = compute_rvh_criteria(amplitudes)
    ae = compute_atrial_enlargement(p_amplitudes, intervals)
    conduction = detect_conduction(intervals, qrs_dur_ms, amplitudes)
    quality = compute_signal_quality(ecg_signal)

    return {
        "lead_names": lead_names,
        "rhythm": rhythm,
        "hrv": hrv,
        "intervals": {**intervals, "qrs_duration_ms": float(qrs_dur_ms)},
        "amplitudes": amplitudes,
        "p_amplitudes": p_amplitudes,
        "axis": axis,
        "st_per_lead": st_per_lead,
        "t_inversion": t_inv,
        "mi_localization": mi_loc,
        "lvh": lvh,
        "rvh": rvh,
        "atrial_enlargement": ae,
        "conduction": conduction,
        "quality": quality,
    }


def to_legacy_features(full):
    """Return the original 4-key dict expected by older callers (LLM prompt etc.)."""
    v5_R = full["amplitudes"].get("V5", {}).get("R", 0.0)
    # Use largest |ST elevation| across leads as before
    st_vals = [v["st_mv"] for v in full["st_per_lead"].values()]
    st_elev = max(st_vals) if st_vals else 0.0
    st_depr = min(st_vals) if st_vals else 0.0
    return {
        "qrs_duration": full["intervals"].get("qrs_duration_ms", 0.0),
        "st_elevation": float(st_elev),
        "r_wave_v5": float(v5_R),
        "st_depression": float(st_depr),
    }
