
import pickle
from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

VECTORSTORE_DIR = PROJECT_ROOT / "vectorstore"

INDEX_FILE = VECTORSTORE_DIR / "faiss.index"
METADATA_FILE = VECTORSTORE_DIR / "events_metadata.pkl"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

TOP_K = 3


# --------------------------------------------------
# LOAD VECTORSTORE
# --------------------------------------------------

print("Loading FAISS index...")

index = faiss.read_index(str(INDEX_FILE))

with open(METADATA_FILE, "rb") as file:
    metadata = pickle.load(file)

documents = metadata["documents"]
events = metadata["events"]

model = SentenceTransformer(MODEL_NAME)

print("Vectorstore loaded successfully!")
print("Available events:", len(events))


# --------------------------------------------------
# SEARCH EVENTS
# --------------------------------------------------

def search_events(query, top_k=TOP_K):

    if not query.strip():
        return []

    query_embedding = model.encode(
        [query],
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    query_embedding = query_embedding.astype("float32")

    scores, indices = index.search(
        query_embedding,
        min(top_k, index.ntotal)
    )

    results = []

    for score, idx in zip(scores[0], indices[0]):

        if idx < 0:
            continue

        results.append({
            "score": float(score),
            "event": events[idx],
            "document": documents[idx]
        })

    return results


# --------------------------------------------------
# TEST
# --------------------------------------------------

if __name__ == "__main__":

    print("\n========== EVENT SEARCH ==========")

    while True:

        query = input("\nAsk about an event (or type exit): ")

        if query.lower().strip() == "exit":
            break

        results = search_events(query)

        if not results:
            print("No matching events found.")
            continue

        for result in results:

            event = result["event"]

            print("\nEvent:", event.get("event_name"))
            print("Organizer:", event.get("organizer"))
            print("Similarity score:", round(result["score"], 3))
            print("Poster:", event.get("source_file"))
