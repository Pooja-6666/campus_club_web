
import json
import pickle
from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer


# --------------------------------------------------
# PATHS AND CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_FILE = PROJECT_ROOT / "data" / "processed" / "events.json"

VECTORSTORE_DIR = PROJECT_ROOT / "vectorstore"

INDEX_FILE = VECTORSTORE_DIR / "faiss.index"
METADATA_FILE = VECTORSTORE_DIR / "events_metadata.pkl"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# --------------------------------------------------
# LOAD EVENT DATA
# --------------------------------------------------

def load_events():

    with open(DATA_FILE, "r", encoding="utf-8") as file:
        events = json.load(file)

    # Ignore failed extractions
    events = [
        event for event in events
        if event.get("extraction_method") != "failed"
        and event.get("event_name")
    ]

    if not events:
        raise ValueError("No valid event records found.")

    return events


# --------------------------------------------------
# CONVERT EVENTS INTO TEXT
# --------------------------------------------------

def create_event_documents(events):

    documents = []

    for event in events:

        document = f"""
        Event Name: {event.get('event_name') or 'Not available'}
        Organizer: {event.get('organizer') or 'Not available'}
        Festival: {event.get('festival') or 'Not available'}
        Category: {event.get('category') or 'Not available'}
        Date: {event.get('date') or 'Not available'}
        Time: {event.get('time') or 'Not available'}
        Venue: {event.get('venue') or 'Not available'}
        Registration: {event.get('registration_details') or 'Not available'}
        Contact: {event.get('contact_details') or 'Not available'}
        Source Poster: {event.get('source_file') or 'Not available'}
        """

        documents.append(document.strip())

    return documents


# --------------------------------------------------
# BUILD FAISS VECTOR INDEX
# --------------------------------------------------

def build_vectorstore():

    print("\nLoading event dataset...")

    events = load_events()

    print("Valid events:", len(events))

    documents = create_event_documents(events)

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

    index.add(embeddings.astype("float32"))

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    print("\nSaving FAISS index...")

    faiss.write_index(index, str(INDEX_FILE))

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
