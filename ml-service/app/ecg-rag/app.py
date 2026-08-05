import streamlit as st
import os
import sys
import tempfile
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from initialize import initialize_pipeline
from rag_impl import extract_features, extract_full_features, retrieve_similar_cases
from llm_service import generate_diagnosis
from preprocessing import extract_text_from_pdf, read_raw_ecg, save_wfdb_upload

st.set_page_config(page_title="ECG Diagnosis", layout="wide")

st.title("RAG-based LLM for ECG Diagnosis")

# Initialize knowledge base (cached after first run)
with st.spinner("Loading knowledge base..."):
    collection = initialize_pipeline()

st.success("Knowledge base ready.")

st.subheader("Upload ECG Files")
col1, col2 = st.columns(2)
with col1:
    dat_file = st.file_uploader("Upload .dat file", type=["dat"])
with col2:
    hea_file = st.file_uploader("Upload .hea file", type=["hea"])

if not (dat_file and hea_file):
    st.warning("Please upload both .dat and .hea files to continue.")
    st.stop()

dat_bytes = dat_file.read()
hea_bytes = hea_file.read()

# Keep uploads out of the repo: temp dir is deleted when this block exits.
try:
    with tempfile.TemporaryDirectory(prefix="icare_ecg_") as tmpdir:
        ecg_path = save_wfdb_upload(dat_bytes, hea_bytes, dest_dir=tmpdir)
        ecg_signal, info, raw_signal, sig_names, fs = read_raw_ecg(ecg_path)
        features = extract_features(ecg_signal, raw_signal=raw_signal, sig_names=sig_names, sampling_rate=fs)
        full_features = extract_full_features(ecg_signal, raw_signal, sig_names, sampling_rate=fs)
        retrieved = retrieve_similar_cases(str(features), collection)
except Exception as e:
    st.error(f"Could not process ECG upload: {e}")
    st.stop()

st.success(
    f"ECG loaded: {dat_file.name}  — "
    f"{raw_signal.shape[1]} lead(s) @ {fs} Hz, {raw_signal.shape[0]} samples "
    f"({raw_signal.shape[0] / fs:.1f} sec). Leads: {', '.join(sig_names)}"
)
if raw_signal.shape[1] < 12:
    st.info(
        f"This record has only {raw_signal.shape[1]} lead(s). Per-lead features for absent "
        "leads (V1–V6, aVL, etc.) will be reported as 0 and 12-lead criteria "
        "(Sokolow-Lyon, Cornell, MI localization) may not be applicable."
    )

# ECG Signal Plot — all leads (cap window for very long recordings to keep matplotlib snappy)
sampling_rate = fs
total_seconds = raw_signal.shape[0] / sampling_rate
MAX_PLOT_SEC = 10.0
plot_seconds = float(min(total_seconds, MAX_PLOT_SEC))
plot_samples = int(plot_seconds * sampling_rate)
plot_truncated = total_seconds > MAX_PLOT_SEC

st.subheader(f"ECG Signal — {raw_signal.shape[1]} Lead(s)" + (f" (showing first {MAX_PLOT_SEC:.0f}s of {total_seconds:.1f}s)" if plot_truncated else ""))
n_leads = raw_signal.shape[1]
n_cols = 2 if n_leads > 1 else 1
n_rows = int(np.ceil(n_leads / n_cols))
fig, axes = plt.subplots(n_rows, n_cols, figsize=(14, max(2.0, 2.0 * n_rows)), sharex=True)
axes = np.atleast_2d(axes) if n_leads > 1 else np.array([[axes]])
time_axis_full = np.arange(plot_samples) / sampling_rate
for i in range(n_leads):
    ax = axes[i // n_cols, i % n_cols]
    ax.plot(time_axis_full, raw_signal[:plot_samples, i], color="#222", linewidth=0.7)
    ax.set_title(sig_names[i], fontsize=9)
    ax.set_ylabel("mV", fontsize=8)
    ax.grid(True, alpha=0.3)
for j in range(n_leads, n_rows * n_cols):
    axes[j // n_cols, j % n_cols].axis("off")
for c in range(n_cols):
    axes[-1, c].set_xlabel("Time (s)")
fig.tight_layout()
st.pyplot(fig)
plt.close()

# Cleaned processing-lead with R-peaks (same time window as above)
st.subheader("Processing Lead (cleaned) with R-peaks")
fig2, ax2 = plt.subplots(figsize=(12, 3))
ecg_clean = ecg_signal["ECG_Clean"].to_numpy()
ecg_plot = ecg_clean[:plot_samples]
time_axis = np.arange(len(ecg_plot)) / sampling_rate
ax2.plot(time_axis, ecg_plot, color="#d62728", linewidth=0.8)
ax2.set_xlabel("Time (seconds)")
ax2.set_ylabel("Amplitude (mV)")
ax2.set_title("Cleaned signal used for R-peak detection")
ax2.grid(True, alpha=0.3)

# Mark R-peaks (ECG_R_Peaks is a 0/1 marker column)
r_peaks = np.where(ecg_signal["ECG_R_Peaks"].fillna(0).to_numpy() == 1)[0]
r_peaks_full = r_peaks[r_peaks < len(ecg_clean)]
r_peaks_plot = r_peaks_full[r_peaks_full < plot_samples]
if len(r_peaks_plot):
    ax2.scatter(r_peaks_plot / sampling_rate, ecg_clean[r_peaks_plot], color="blue", s=20, zorder=5, label="R-peaks")
    ax2.legend(fontsize=8)
st.pyplot(fig2)
plt.close()
r_peaks = r_peaks_full  # downstream still uses full-recording R-peaks

# ===========================================================================
# Comprehensive feature display
# ===========================================================================
rhythm = full_features["rhythm"]
hrv = full_features["hrv"]
intervals = full_features["intervals"]
amplitudes = full_features["amplitudes"]
p_amps = full_features["p_amplitudes"]
axis = full_features["axis"]
st_per_lead = full_features["st_per_lead"]
t_inv = full_features["t_inversion"]
mi_loc = full_features["mi_localization"]
lvh = full_features["lvh"]
rvh = full_features["rvh"]
ae = full_features["atrial_enlargement"]
conduction = full_features["conduction"]
quality = full_features["quality"]
lead_names = full_features["lead_names"]

st.subheader("Signal Summary")
duration_sec = len(ecg_clean) / sampling_rate
col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("Heart Rate", f"{rhythm['mean_bpm']:.0f} bpm", help=f"Range: {rhythm['min_bpm']:.0f}-{rhythm['max_bpm']:.0f} bpm")
col2.metric("Rhythm", rhythm["classification"], help=f"Regular: {rhythm['rhythm_regular']} (RR CV={rhythm['rr_cv']:.2%})")
col3.metric("QRS Duration", f"{intervals['qrs_duration_ms']:.0f} ms", help="Normal: 80–120 ms")
col4.metric("QTc (Bazett)", f"{intervals['qtc_bazett_ms']:.0f} ms", help="Normal: < 440 ms")
col5.metric("Signal Quality", f"{quality['mean_quality']:.2f}", help="0 = poor, 1 = excellent")

col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("Recording Duration", f"{duration_sec:.1f} sec")
col2.metric("R-peaks Detected", int(len(r_peaks)))
col3.metric("QRS Axis", f"{axis['axis_deg']:.0f}°", help=axis["axis_class"])
col4.metric("PR Interval", f"{intervals['pr_ms']:.0f} ms", help="Normal: 120-200 ms")
col5.metric("R-wave V5", f"{amplitudes.get('V5', {}).get('R', 0):.2f} mV")

# -------- Detailed feature tabs ----------
tab_rhythm, tab_intervals, tab_amps, tab_st, tab_dx, tab_raw = st.tabs([
    "Rhythm & HRV", "Wave Intervals", "Per-Lead Amplitudes",
    "ST / MI Analysis", "Diagnostic Criteria", "Raw Feature JSON",
])

with tab_rhythm:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Mean HR", f"{rhythm['mean_bpm']:.1f} bpm")
    c2.metric("SDNN", f"{hrv['sdnn_ms']:.1f} ms", help="Std of RR intervals (overall HRV)")
    c3.metric("RMSSD", f"{hrv['rmssd_ms']:.1f} ms", help="Short-term HRV (parasympathetic)")
    c4.metric("pNN50", f"{hrv['pnn50_pct']:.1f} %", help="% successive RR diffs > 50ms")
    c1, c2, c3 = st.columns(3)
    c1.metric("Mean RR", f"{hrv['mean_rr_ms']:.0f} ms")
    c2.metric("Min HR", f"{rhythm['min_bpm']:.1f} bpm")
    c3.metric("Max HR", f"{rhythm['max_bpm']:.1f} bpm")
    st.caption(f"Rhythm classification: **{rhythm['classification']}**, regular={rhythm['rhythm_regular']}")

with tab_intervals:
    interval_rows = [
        ("PR",  intervals["pr_ms"],            "120-200 ms"),
        ("QRS", intervals["qrs_duration_ms"],  "80-120 ms"),
        ("QT",  intervals["qt_ms"],            "< 440 ms (rate-dep)"),
        ("QTc Bazett",       intervals["qtc_bazett_ms"],     "< 440 ms"),
        ("QTc Fridericia",   intervals["qtc_fridericia_ms"], "< 440 ms"),
        ("P-wave duration",  intervals["p_dur_ms"],          "< 120 ms"),
        ("T-wave duration",  intervals["t_dur_ms"],          "variable"),
        ("ST segment duration", intervals["st_dur_ms"],      "variable"),
    ]
    df_iv = pd.DataFrame(interval_rows, columns=["Interval", "Value (ms)", "Reference"])
    st.dataframe(df_iv, use_container_width=True, hide_index=True)

with tab_amps:
    amp_rows = []
    for lead in lead_names:
        a = amplitudes.get(lead, {"R": 0, "Q": 0, "S": 0, "T": 0})
        amp_rows.append({
            "Lead": lead,
            "R (mV)": round(a["R"], 3),
            "Q (mV)": round(a["Q"], 3),
            "S (mV)": round(a["S"], 3),
            "T (mV)": round(a["T"], 3),
            "P (mV)": round(p_amps.get(lead, 0.0), 3),
            "T inverted": "✓" if t_inv.get(lead, {}).get("t_inverted") else "",
            "Concerning": "⚠" if t_inv.get(lead, {}).get("concerning") else "",
        })
    st.dataframe(pd.DataFrame(amp_rows), use_container_width=True, hide_index=True)
    st.caption("R/Q/S/T measured on each lead at the R-peak indices detected from Lead II.")

with tab_st:
    st_rows = []
    for lead in lead_names:
        d = st_per_lead.get(lead, {"st_mv": 0, "elevated": False, "depressed": False})
        flag = "↑ Elevated" if d["elevated"] else ("↓ Depressed" if d["depressed"] else "—")
        st_rows.append({"Lead": lead, "ST @ J+80ms (mV)": round(d["st_mv"], 3), "Status": flag})
    st.markdown("**ST deviation per lead** (threshold: ±0.10 mV)")
    st.dataframe(pd.DataFrame(st_rows), use_container_width=True, hide_index=True)

    st.markdown("**MI Territory Localization**")
    mi_rows = []
    for region, info_r in mi_loc.items():
        mi_rows.append({
            "Territory": region,
            "Elevated leads": ", ".join(info_r["elevated_leads"]) or "—",
            "Depressed leads": ", ".join(info_r["depressed_leads"]) or "—",
            "STEMI suspected": "⚠ YES" if info_r["stemi_suspected"] else "—",
        })
    st.dataframe(pd.DataFrame(mi_rows), use_container_width=True, hide_index=True)

with tab_dx:
    cA, cB = st.columns(2)
    with cA:
        st.markdown("### Hypertrophy / Enlargement")
        st.write({
            "Sokolow-Lyon (mV)": round(lvh["sokolow_lyon_mv"], 2),
            "Sokolow-Lyon LVH": lvh["sokolow_lyon_lvh"],
            "Cornell (mV)": round(lvh["cornell_mv"], 2),
            "Cornell LVH (Male)": lvh["cornell_lvh_male"],
            "Cornell LVH (Female)": lvh["cornell_lvh_female"],
            "R(V1) (mV)": round(rvh["r_v1_mv"], 2),
            "S(V1) (mV)": round(rvh["s_v1_mv"], 2),
            "R/S ratio V1": round(rvh["rs_ratio_v1"], 2),
            "RVH suspected": rvh["rvh_suspected"],
            "P-wave duration (ms)": round(ae["p_dur_ms"], 1),
            "P amp II (mV)": round(ae["p_amp_ii_mv"], 3),
            "LAE suspected": ae["lae_suspected"],
            "RAE suspected": ae["rae_suspected"],
        })
    with cB:
        st.markdown("### Conduction & Axis")
        st.write({
            "PR interval (ms)": round(conduction["pr_ms"], 1),
            "QRS duration (ms)": round(conduction["qrs_duration_ms"], 1),
            "1st-degree AV block": conduction["first_degree_avb"],
            "Wide QRS (>120 ms)": conduction["wide_qrs"],
            "LBBB suspected": conduction["lbbb_suspected"],
            "RBBB suspected": conduction["rbbb_suspected"],
            "WPW suspected": conduction["wpw_suspected"],
            "QRS axis (deg)": round(axis["axis_deg"], 1),
            "Axis classification": axis["axis_class"],
        })

with tab_raw:
    st.json(full_features, expanded=False)

# Diagnosis
st.subheader("Diagnosis")
user_query = st.text_area("Enter your query:", height=100, placeholder="e.g. Does this patient have a heart condition?")

uploaded_history = st.file_uploader("Upload medical history (optional)", type=["txt", "pdf"])
medical_history = None
if uploaded_history is not None:
    medical_history = extract_text_from_pdf(pdf_file=uploaded_history)

if st.button("Generate Diagnosis"):
    if not user_query:
        st.warning("Please enter a query.")
    else:
        # Build a richer feature payload for the LLM (legacy keys + summary)
        llm_payload = {
            **features,
            "hr_mean_bpm": rhythm["mean_bpm"],
            "rhythm": rhythm["classification"],
            "hrv_sdnn_ms": hrv["sdnn_ms"],
            "hrv_rmssd_ms": hrv["rmssd_ms"],
            "pr_ms": intervals["pr_ms"],
            "qt_ms": intervals["qt_ms"],
            "qtc_bazett_ms": intervals["qtc_bazett_ms"],
            "qrs_axis_deg": axis["axis_deg"],
            "axis_class": axis["axis_class"],
            "sokolow_lyon_mv": lvh["sokolow_lyon_mv"],
            "sokolow_lyon_lvh": lvh["sokolow_lyon_lvh"],
            "cornell_mv": lvh["cornell_mv"],
            "rvh_suspected": rvh["rvh_suspected"],
            "lae_suspected": ae["lae_suspected"],
            "rae_suspected": ae["rae_suspected"],
            "first_degree_avb": conduction["first_degree_avb"],
            "lbbb_suspected": conduction["lbbb_suspected"],
            "rbbb_suspected": conduction["rbbb_suspected"],
            "wpw_suspected": conduction["wpw_suspected"],
            "st_elevated_leads": [l for l, d in st_per_lead.items() if d["elevated"]],
            "st_depressed_leads": [l for l, d in st_per_lead.items() if d["depressed"]],
            "mi_territories_suspected": [r for r, v in mi_loc.items() if v["stemi_suspected"]],
            "signal_quality": quality["mean_quality"],
        }
        with st.spinner("Generating diagnosis..."):
            diagnosis = generate_diagnosis(llm_payload, retrieved, user_query, medical_history)
        st.write("### Response:")
        st.write(diagnosis)
