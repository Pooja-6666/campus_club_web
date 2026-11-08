import pickle
from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer

from app.ingestion.ocr_to_rag import prepare_rag_documents


# --------------------------------------------------
# PATHS AND CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# This will eventually be replaced/updated with
# your friend's approved OCR output file.
OCR_DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "ocr_events.json"
)

VECTORSTORE_DIR = PROJECT_ROOT / "vectorstore"

INDEX_FILE = VECTORSTORE_DIR / "faiss.index"
METADATA_FILE = VECTORSTORE_DIR / "events_metadata.pkl"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# --------------------------------------------------
# LOAD OCR EVENT DATA
# --------------------------------------------------

def load_events_and_documents():

    print("\nLoading OCR event data...")

    events, documents = prepare_rag_documents(OCR_DATA_FILE)

    if not events:
        raise ValueError(
            "No valid OCR event records found."
        )

    print("Valid events:", len(events))

    return events, documents


# --------------------------------------------------
# BUILD FAISS VECTOR INDEX
# --------------------------------------------------

def build_vectorstore():

    print("\n========== BUILDING RAG VECTORSTORE ==========")

    events, documents = load_events_and_documents()

    print("\nLoading embedding model...")

    model = SentenceTransformer(MODEL_NAME)

    print("\nGenerating embeddings...")

    embeddings = model.encode(
        documents,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=True
    )

    dimension = embeddings.shape[1]

    print("Embedding dimension:", dimension)

    # Cosine similarity through normalized vectors
    index = faiss.IndexFlatIP(dimension)

    index.add(
        embeddings.astype("float32")
    )

    VECTORSTORE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("\nSaving FAISS index...")

    faiss.write_index(
        index,
        str(INDEX_FILE)
    )

    # Store both the original normalized
    # event data and the text documents.
    with open(METADATA_FILE, "wb") as file:
        pickle.dump(
            {
                "documents": documents,
                "events": events
            },
            file
        )

    print("\n========== VECTORSTORE COMPLETED ==========")
    print("Events indexed:", index.ntotal)
    print("Embedding dimensions:", dimension)
    print("FAISS index:", INDEX_FILE)
    print("Metadata:", METADATA_FILE)


# --------------------------------------------------
# EXECUTION
# --------------------------------------------------

if __name__ == "__main__":
    build_vectorstore()