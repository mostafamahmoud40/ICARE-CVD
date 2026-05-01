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
    text = hea_bytes.decode("utf-8", errors="replace")
    # Skip blank lines and comments starting with '#'
    lines = [l for l in text.splitlines() if l.strip() and not l.strip().startswith("#")]
    if not lines:
        raise ValueError("Header file is empty or invalid.")

    # Line 1: <record_name> <n_signals> <fs> <n_samples>
    record_name = lines[0].split()[0]

    # Subsequent signal lines start with the data filename (e.g. "100.dat")
    data_files = []
    for line in lines[1:]:
        token = line.split()[0]
        if token not in data_files:
            data_files.append(token)
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

    raw_signal = record.p_signal
    lead_idx = _find_processing_lead(sig_names)
    ecg_channel = raw_signal[:, lead_idx]

    ecg_cleaned = nk.ecg_clean(ecg_channel, sampling_rate=fs)
    signals, info = nk.ecg_process(ecg_cleaned, sampling_rate=fs)

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

