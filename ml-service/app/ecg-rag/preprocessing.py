import os
import numpy as np
import neurokit2 as nk  # For ECG preprocessing
import chromadb  # For embedding storage
from sentence_transformers import SentenceTransformer
import requests  # For interacting with Groq LLM
import PyPDF2  # For extracting text from PDFs
import json
import re
import wfdb


_FMT_BYTES_PER_SAMPLE = {
    "16": 2,
    "24": 3,
    "32": 4,
    "80": 1,
}


def _parse_wfdb_header(hea_bytes: bytes) -> dict:
    """Parse a WFDB .hea file into record metadata used for upload validation."""
    text = hea_bytes.decode("utf-8", errors="replace")
    lines = [l for l in text.splitlines() if l.strip() and not l.strip().startswith("#")]
    if not lines:
        raise ValueError("Header file is empty or invalid.")

    head = lines[0].split()
    record_name = head[0]
    n_sig = int(head[1]) if len(head) > 1 else 0
    fs = float(head[2]) if len(head) > 2 else 0.0
    n_samples = int(head[3]) if len(head) > 3 else 0

    data_files: list[str] = []
    fmts: list[str] = []
    for line in lines[1:]:
        parts = line.split()
        if not parts:
            continue
        if parts[0] not in data_files:
            data_files.append(parts[0])
        if len(parts) > 1:
            fmts.append(parts[1].split("+", 1)[0])

    fmt = fmts[0] if fmts else "16"
    bytes_per_frame = sum(_FMT_BYTES_PER_SAMPLE.get(f, 2) for f in fmts) or (n_sig * 2)
    expected_dat_bytes = n_samples * bytes_per_frame if n_samples > 0 else 0

    return {
        "record_name": record_name,
        "n_sig": n_sig,
        "fs": fs,
        "n_samples": n_samples,
        "data_files": data_files,
        "fmt": fmt,
        "expected_dat_bytes": expected_dat_bytes,
    }


def validate_wfdb_upload(hea_bytes: bytes, dat_bytes: bytes) -> list[str]:
    """Return human-readable warnings when an uploaded WFDB pair looks inconsistent."""
    warnings: list[str] = []
    try:
        meta = _parse_wfdb_header(hea_bytes)
    except ValueError as exc:
        return [str(exc)]

    actual = len(dat_bytes)
    expected = meta["expected_dat_bytes"]
    if expected > 0:
        ratio = actual / expected
        if actual < expected * 0.9:
            warnings.append(
                f".dat file is too small ({actual:,} B) for the header "
                f"(expects ~{expected:,} B for {meta['n_samples']} samples × "
                f"{meta['n_sig']} leads, format {meta['fmt']}). "
                "The .hea and .dat files may be from different recordings."
            )
        elif ratio > 1.5:
            warnings.append(
                f".dat file is much larger than the header declares "
                f"({actual:,} B uploaded vs ~{expected:,} B expected). "
                "Only the first block is read; extra bytes are ignored. "
                "For PTB-XL, use the matching pair from records100/ "
                "(lr ≈ 24 KB) or records500/ (hr ≈ 120 KB)."
            )

    if meta["fs"] >= 400 and meta["n_samples"] >= 4000:
        warnings.append(
            f"Header indicates a high-rate recording ({int(meta['fs'])} Hz, "
            f"{meta['n_samples']} samples). Ensure you did not pair a 100 Hz .hea "
            "with a 500 Hz .dat file (or vice versa)."
        )
    elif meta["fs"] <= 120 and meta["n_samples"] <= 1200 and actual > 200_000:
        warnings.append(
            "A 100 Hz WFDB record is usually tens of kilobytes, not megabytes. "
            "Re-export or re-download the matching .dat for this .hea."
        )

    return warnings


def assess_signal_quality(raw_signal: np.ndarray, mean_ecg_quality: float) -> list[str]:
    """Flag obviously corrupted physiology after WFDB decode."""
    warnings: list[str] = []
    finite = raw_signal[np.isfinite(raw_signal)]
    if finite.size == 0:
        return ["No finite samples were decoded from the WFDB record."]

    peak_mv = float(np.nanmax(np.abs(finite)))
    if peak_mv > 8.0:
        warnings.append(
            f"Decoded amplitudes reach ±{peak_mv:.1f} mV, far outside a typical ECG "
            "(≈ ±2 mV). The waveform is likely corrupted or the wrong .dat was paired "
            "with this .hea — automated heart rate and diagnosis are unreliable."
        )
    elif peak_mv > 5.0:
        warnings.append(
            f"Large signal excursions (±{peak_mv:.1f} mV) suggest noise or a mismatched "
            "WFDB pair. Review the traces before trusting automated metrics."
        )

    if mean_ecg_quality < 0.35:
        warnings.append(
            f"NeuroKit2 signal quality is low ({mean_ecg_quality:.2f}). "
            "R-peak detection and derived metrics may be wrong."
        )

    return warnings


def _find_processing_lead(sig_names):
    """Pick the best lead for R-peak detection. Prefers Lead II / MLII; falls back to lead 0."""
    upper = [s.upper().strip() for s in sig_names]
    for cand in ("II", "MLII", "LEAD II", "ECG II", "ECG_II"):
        if cand in upper:
            return upper.index(cand)
    return 0


def save_wfdb_upload(dat_bytes, hea_bytes, dest_dir="./database"):
    """Save an uploaded WFDB pair (.dat + .hea) using the names referenced *inside* the header.

    WFDB requires that the record name in the .hea matches the .hea filename and that
    the data files referenced inside the header exist on disk. We parse the header,
    figure out the canonical record name and the data filename(s) it points to, and
    write the bytes accordingly. Returns the path stem (no extension) for ``wfdb.rdrecord``.
    """
    os.makedirs(dest_dir, exist_ok=True)
    meta = _parse_wfdb_header(hea_bytes)
    record_name = meta["record_name"]
    data_files = meta["data_files"]
    if not data_files:
        raise ValueError("Header references no data file.")

    # Persist .hea using the canonical record name
    hea_path = os.path.join(dest_dir, f"{record_name}.hea")
    with open(hea_path, "wb") as f:
        f.write(hea_bytes)

    # Persist .dat under each name the header references (usually one)
    for data_file in data_files:
        dat_path = os.path.join(dest_dir, data_file)
        with open(dat_path, "wb") as f:
            f.write(dat_bytes)

    return os.path.join(dest_dir, record_name)


def read_raw_ecg(path: str):
    """Read a WFDB record (path = record stem, no extension) and process it for downstream analysis.

    Returns ``(signals, info, raw_signal, sig_names, fs)`` where:
      - ``signals`` is the neurokit2 DataFrame from ``ecg_process`` on the processing lead
      - ``info`` is the matching dict
      - ``raw_signal`` is the full multi-lead matrix (samples x leads)
      - ``sig_names`` are the original lead names from the WFDB header
      - ``fs`` is the sampling rate stored in the header
    """
    record = wfdb.rdrecord(path)
    fs = int(record.fs) if record.fs else 100
    sig_names = list(record.sig_name)

    raw_signal = np.asarray(record.p_signal, dtype=float)
    if not np.isfinite(raw_signal).all():
        raw_signal = np.nan_to_num(raw_signal, nan=0.0, posinf=0.0, neginf=0.0)

    lead_idx = _find_processing_lead(sig_names)
    ecg_channel = raw_signal[:, lead_idx]

    ecg_cleaned = nk.ecg_clean(ecg_channel, sampling_rate=fs)
    try:
        signals, info = nk.ecg_process(ecg_cleaned, sampling_rate=fs)
    except (ValueError, FloatingPointError):
        # Corrupted / non-physiological uploads can make NeuroKit2 fail on quality scoring.
        import pandas as pd

        signals = pd.DataFrame({"ECG_Raw": ecg_channel, "ECG_Clean": ecg_cleaned})
        info = {"sampling_rate": fs}
        try:
            _, rpeaks = nk.ecg_peaks(ecg_cleaned, sampling_rate=fs)
            signals["ECG_R_Peaks"] = rpeaks.get("ECG_R_Peaks", 0)
        except Exception:
            signals["ECG_R_Peaks"] = 0
        signals["ECG_Quality"] = 0.0

    return signals, info, raw_signal, sig_names, fs


#Load and Preprocess ECG Data
def preprocess_ecg(raw_signal, sampling_rate=100):
    ecg_cleaned = nk.ecg_clean(raw_signal, sampling_rate=sampling_rate)
    return ecg_cleaned


#Extract and  Preprocess Text from PDFs
def extract_text_from_pdf(pdf_paths=None,pdf_file=None, chunk_size=500):
    text = ""

    if pdf_file:
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += re.sub(r'\s+', ' ', page_text.strip()) + " "

    else:

        for pdf_path in pdf_paths:
            with open(pdf_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += re.sub(r'\s+', ' ', page_text.strip()) + " "
        
    # Chunking text into manageable parts
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    return chunks

