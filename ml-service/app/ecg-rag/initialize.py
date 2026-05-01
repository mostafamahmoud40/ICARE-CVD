from rag_impl import create_embeddings, extract_features, retrieve_similar_cases, store_embeddings, load_collection
from preprocessing import extract_text_from_pdf
import streamlit as st

@st.cache_resource
def initialize_pipeline():
    # Load from disk if already built
    collection = load_collection()

    if collection is None:
        # First run: build and persist the knowledge base
        pdf_paths = ["./database/paper03.pdf", "./database/paper04.pdf"]
        text_chunks = extract_text_from_pdf(pdf_paths, chunk_size=500)
        embeddings = create_embeddings(text_chunks)
        collection = store_embeddings(text_chunks, embeddings)

    return collection

