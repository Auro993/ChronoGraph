from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    timeline: list = []
    graph: dict = {}
    sources: list = []

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Step 1: Understand the question
        question_info = gemini_service.extract_question_entities(request.question)
        
        # Step 2: For now, we'll return a simple response
        # In later steps, we'll integrate with Neo4j
        answer = gemini_service.generate_answer(
            request.question, 
            "Historical context will be added here after integrating with Neo4j."
        )
        
        # Step 3: Return response with placeholder data
        return ChatResponse(
            answer=answer,
            timeline=[],  # Will be populated with Neo4j data
            graph={"nodes": [], "edges": []},  # Will be populated with Neo4j data
            sources=[]  # Will be populated with Neo4j data
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test")
async def test_gemini():
    """Test endpoint to verify Gemini connection."""
    try:
        test_prompt = "What is ChronoGraph? Answer in one sentence."
        response = gemini_service.model.generate_content(test_prompt)
        return {"status": "connected", "response": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}