import os, sys, tempfile, json, re
import numpy as np
import torch
import wfdb
from scipy.signal import resample, find_peaks
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from pathlib import Path

_here = Path(__file__).resolve().parent
for _root in (_here, _here.parent):
    if (_root / "ml_env.py").is_file():
        _s = str(_root)
        if _s not in sys.path:
            sys.path.insert(0, _s)
        break
from ml_env import load_ml_service_dotenv

load_ml_service_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ECGTransForm"))
from models import ecgTransForm

# ── Config ──────────────────────────────────────────────────────────────────
CHECKPOINT = os.path.join(os.path.dirname(__file__), "ecgtransform_mit_best.pt")
CLASSES = ["N", "S", "V", "F", "Q"]
CLASS_LABELS = {
    "N": "Normal",
    "S": "Supraventricular",
    "V": "Ventricular",
    "F": "Fusion",
    "Q": "Unknown",
}
CLASS_COLORS = {
    "N": "#22c55e",
    "S": "#f59e0b",
    "V": "#ef4444",
    "F": "#8b5cf6",
    "Q": "#6b7280",
}
# N = normal/not suspicious; anything else = suspicious
SUSPICIOUS = {"S", "V", "F", "Q"}

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

# ── Load model once at startup ───────────────────────────────────────────────
ckpt = torch.load(CHECKPOINT, map_location="cpu")

class Cfg:
    pass

cfg = Cfg()
cfg.__dict__.update(ckpt["configs"])
model = ecgTransForm(configs=cfg, hparams=ckpt["hparams"])
model.load_state_dict(ckpt["model"])
model.eval()
print("✓ Model loaded")


# ── Inference helper ─────────────────────────────────────────────────────────
def run_inference(hea_path: str):
    """hea_path = full path without extension."""
    record = wfdb.rdrecord(hea_path)
    signal = record.p_signal
    fs_orig = record.fs
    sig_name = record.sig_name

    # choose Lead II if available, otherwise index 1, otherwise 0
    lead_idx = 1 if signal.shape[1] > 1 else 0
    if "II" in sig_name:
        lead_idx = sig_name.index("II")

    lead = signal[:, lead_idx].astype(np.float32)
    lead_360 = resample(lead, int(len(lead) * 360 / fs_orig)).astype(np.float32)

    norm = (lead_360 - lead_360.min()) / (lead_360.max() - lead_360.min() + 1e-8)
    peaks, _ = find_peaks(norm, height=0.5, distance=int(0.5 * 360))

    half, beat_len = 93, 187
    beats_norm = []   # normalized [0,1] — used for model input
    beats_raw  = []   # original mV values — used for display
    peak_indices = []
    for p in peaks:
        start, end = p - half, p + (beat_len - half)
        if start >= 0 and end <= len(lead_360):
            raw  = lead_360[start:end].copy()
            norm_beat = (raw - raw.min()) / (raw.max() - raw.min() + 1e-8)
            beats_raw.append(raw)
            beats_norm.append(norm_beat)
            peak_indices.append(int(p))

    if not beats_norm:
        return {"error": "No valid beats found. Check signal quality or lead selection."}

    beats_tensor = torch.tensor(np.array(beats_norm)).unsqueeze(1).float()

    with torch.no_grad():
        logits = model(beats_tensor)
        probs = torch.softmax(logits, dim=1).numpy()
        preds = probs.argmax(axis=1)

    beat_results = []
    for i in range(len(beats_norm)):
        cls = CLASSES[preds[i]]
        raw = beats_raw[i]
        # round to 4 decimals to keep JSON small
        waveform = [round(float(v), 4) for v in raw]
        beat_results.append({
            "beat": i,
            "class": cls,
            "label": CLASS_LABELS[cls],
            "color": CLASS_COLORS[cls],
            "suspicious": cls in SUSPICIOUS,
            "confidence": round(float(probs[i][preds[i]]) * 100, 2),
            "probs": {c: round(float(probs[i][j]) * 100, 2) for j, c in enumerate(CLASSES)},
            "waveform": waveform,
            "waveform_min": round(float(raw.min()), 4),
            "waveform_max": round(float(raw.max()), 4),
        })

    counts = Counter([CLASSES[p] for p in preds])
    summary = [
        {
            "class": c,
            "label": CLASS_LABELS[c],
            "color": CLASS_COLORS[c],
            "count": counts.get(c, 0),
            "pct": round(counts.get(c, 0) / len(beats_norm) * 100, 1),
        }
        for c in CLASSES
        if counts.get(c, 0) > 0
    ]

    n_suspicious = sum(1 for b in beat_results if b["suspicious"])
    n_normal     = len(beat_results) - n_suspicious

    return {
        "meta": {
            "record": record.record_name,
            "fs": fs_orig,
            "leads": sig_name,
            "used_lead": sig_name[lead_idx],
            "total_samples": int(len(lead)),
            "duration_sec": round(len(lead) / fs_orig, 1),
            "r_peaks_found": len(peaks),
            "valid_beats": len(beat_results),
            "suspicious_beats": n_suspicious,
            "normal_beats": n_normal,
        },
        "beats": beat_results,
        "summary": summary,
    }


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ecg",
        "model_loaded": True,
    })


@app.route("/infer", methods=["POST"])
def infer():
    if "hea" not in request.files or "dat" not in request.files:
        return jsonify({"error": "Please upload both .hea and .dat files"}), 400

    hea_file = request.files["hea"]
    dat_file = request.files["dat"]

    if not hea_file.filename.endswith(".hea") or not dat_file.filename.endswith(".dat"):
        return jsonify({"error": "Files must be .hea and .dat"}), 400

    # Read .hea bytes and extract the record base name from inside the header
    hea_bytes = hea_file.read()
    first_line = hea_bytes.decode("ascii", errors="ignore").splitlines()[0]
    record_base = first_line.split()[0]  # e.g. "05469_lr"

    with tempfile.TemporaryDirectory() as tmpdir:
        # Save both files using the exact name the header declares
        hea_path = os.path.join(tmpdir, record_base + ".hea")
        dat_path = os.path.join(tmpdir, record_base + ".dat")
        with open(hea_path, "wb") as f:
            f.write(hea_bytes)
        dat_file.save(dat_path)

        record_path = os.path.join(tmpdir, record_base)
        try:
            result = run_inference(record_path)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify(result)


# ── Groq client ──────────────────────────────────────────────────────────────
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_MODEL = "qwen/qwen3-32b"

ECG_REPORT_SCHEMA = """
{
  "overall_assessment": "e.g. Normal Sinus Rhythm | Arrhythmia Detected",
  "risk_level": "Low | Moderate | High",
  "findings": ["finding 1", "finding 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "clinical_notes": "Detailed clinical interpretation paragraph"
}
"""


def _clean_llm(text: str) -> str:
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    m = re.search(r"\{.*\}", text, re.DOTALL)
    return m.group(0) if m else text


@app.route("/report", methods=["POST"])
def report():
    data = request.json
    if not data or "ecg_result" not in data:
        return jsonify({"error": "Missing ecg_result"}), 400

    ecg = data["ecg_result"]
    meta = ecg.get("meta", {})
    summary = ecg.get("summary", [])
    beats = ecg.get("beats", [])

    suspicious_beats = [b for b in beats if b.get("suspicious")]
    suspicious_summary = [
        {"class": b["class"], "label": b["label"], "confidence": b["confidence"]}
        for b in suspicious_beats[:20]
    ]

    prompt = f"""You are a senior cardiologist assistant. Analyze the following ECG classification results and return a structured clinical report as a JSON object exactly matching this schema. Return ONLY the JSON with no extra text.

Schema:
{ECG_REPORT_SCHEMA}

ECG Results:
- Record: {meta.get('record')}
- Duration: {meta.get('duration_sec')} seconds
- Sampling Rate: {meta.get('fs')} Hz
- Lead Used: {meta.get('used_lead')}
- Total Valid Beats: {meta.get('valid_beats')}
- Normal Beats: {meta.get('normal_beats')}
- Suspicious Beats: {meta.get('suspicious_beats')}
- Class Breakdown: {json.dumps(summary)}
- Sample of Suspicious Beat Details: {json.dumps(suspicious_summary)}
"""

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_completion_tokens=2048,
            response_format={"type": "json_object"},
        )
        content = _clean_llm(completion.choices[0].message.content)
        return jsonify({"success": True, "report": json.loads(content)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    if not data or "history" not in data or "ecg_context" not in data:
        return jsonify({"error": "Missing history or ecg_context"}), 400

    ecg = data["ecg_context"]
    meta = ecg.get("meta", {})
    summary = ecg.get("summary", [])

    system_prompt = f"""You are a smart cardiologist assistant helping a doctor interpret ECG results.

Patient ECG Data:
- Record: {meta.get('record')}
- Duration: {meta.get('duration_sec')}s at {meta.get('fs')} Hz, Lead {meta.get('used_lead')}
- Total Beats: {meta.get('valid_beats')} | Normal: {meta.get('normal_beats')} | Suspicious: {meta.get('suspicious_beats')}
- Beat Classification Summary: {json.dumps(summary)}

LANGUAGE RULES:
- If the doctor writes in Arabic, reply in Arabic.
- Otherwise, reply in English.
- Be concise, professional, and medically accurate.
- Do not start with labels like "Answer:" or "Summary:".
"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in data["history"]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_completion_tokens=1024,
        )
        reply = _clean_llm(completion.choices[0].message.content)
        return jsonify({"success": True, "reply": reply})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=False, port=5050, host="0.0.0.0")
