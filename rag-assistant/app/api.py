from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Campus Club RAG API",
    description="API for the Campus Club AI Assistant",
    version="1.0.0"
)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    success: bool
    answer: str


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Campus Club RAG API is running"
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:
        return {
            "success": False,
            "answer": "Please enter a question about campus events."
        }

    # Import only when the endpoint is called.
    # This prevents the FastAPI server from trying to
    # load FAISS/vectorstore during startup.
    try:
        from app.rag_pipeline import generate_answer

        answer = generate_answer(question)

        return {
            "success": True,
            "answer": answer
        }

    except FileNotFoundError:
        return {
            "success": False,
            "answer": (
                "The event knowledge base is not available yet. "
                "Please try again after the OCR event data has been indexed."
            )
        }

    except Exception as error:
        print(f"RAG error: {type(error).__name__}: {error}")

        return {
            "success": False,
            "answer": f"RAG error: {type(error).__name__}: {error}"
        }