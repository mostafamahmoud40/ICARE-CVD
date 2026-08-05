import numpy as np
import neurokit2 as nk  # For ECG preprocessing
import chromadb  # For embedding storage
import torch
from sentence_transformers import SentenceTransformer
import re
from features import compute_all_features, to_legacy_features


def _torch_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


# Single shared embedding model (lazy-loaded once)
_EMBED_MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'
_EMBED_MODEL = None


def _get_embed_model():
    global _EMBED_MODEL
    if _EMBED_MODEL is None:
        device = _torch_device()
        _EMBED_MODEL = SentenceTransformer(_EMBED_MODEL_NAME, device=device)
        print(f"[ecg-rag] SentenceTransformer loaded on {device}")
    return _EMBED_MODEL


# Create Embeddings for Medical Knowledge Base
def create_embeddings(texts):
    model = _get_embed_model()
    return model.encode(texts, convert_to_numpy=True)


CHROMA_PATH = "./database/chroma_db"
COLLECTION_NAME = "medical_knowledge"

# Store Embeddings in ChromaDB (persisted to disk)
def store_embeddings(texts, embeddings):
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    client.delete_collection(COLLECTION_NAME) if COLLECTION_NAME in [c.name for c in client.list_collections()] else None
    collection = client.create_collection(name=COLLECTION_NAME)
    for i, text in enumerate(texts):
        collection.add(ids=[str(i)], documents=[text], embeddings=[embeddings[i].tolist()])
    return collection

# Load existing ChromaDB collection from disk
def load_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collections = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in collections:
        return client.get_collection(name=COLLECTION_NAME)
    return None


#Feature Extraction from ECG
def extract_features(ecg_signal, raw_signal=None, sig_names=None, sampling_rate=100):
    """Backward-compatible flat dict (qrs_duration / st_elevation / r_wave_v5 / st_depression).

    For the comprehensive feature dict (HRV, axis, per-lead amps, MI localization,
    LVH/RVH, conduction, etc.) use ``extract_full_features``.
    """
    if raw_signal is None or sig_names is None:
        # Fall back: synthesize a single-lead "raw" matrix from ECG_Clean
        ecg_clean_arr = ecg_signal["ECG_Clean"].to_numpy().reshape(-1, 1)
        raw_signal = ecg_clean_arr
        sig_names = ["II"]

    full = compute_all_features(ecg_signal, raw_signal, sig_names, sampling_rate=sampling_rate)
    return to_legacy_features(full)


def extract_full_features(ecg_signal, raw_signal, sig_names, sampling_rate=100):
    """Return the full, structured feature dict (see features.compute_all_features)."""
    return compute_all_features(ecg_signal, raw_signal, sig_names, sampling_rate=sampling_rate)



# Retrieve Similar Cases using RAG
def retrieve_similar_cases(query, collection):
    model = _get_embed_model()
    query_embedding = model.encode([query], convert_to_numpy=True)
    results = collection.query(query_embeddings=query_embedding.tolist(), n_results=1)
        # Ensure there's always a status report
    if not results or 'documents' not in results or not results['documents']:
        return {
            "status": "No similar cases found",
            "query": query,
            "results": []
        }

    return results