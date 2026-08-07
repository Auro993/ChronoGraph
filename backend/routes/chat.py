from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.gemini_service import GeminiService
import json

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
        # Step 1: Extract entities from question
        question_info = gemini_service.extract_question_entities(request.question)
        
        # Step 2: For now, use a simple context (will be replaced with Neo4j data)
        # In the next phase, this will come from Neo4j
        mock_context = """
Historical Events:
- March 10, 2023: Rahul reported AWS infrastructure costs increased
- March 15, 2023: Priya proposed evaluating GCP as an alternative
- March 18, 2023: Jira issue CLOUD-102 created for GCP migration
- April 20, 2023: Rahul added initial GCP deployment configuration
- April 25, 2023: Amit completed initial GCP deployment
- May 15, 2023: Migration to GCP completed
"""
        
        # Step 3: Generate answer using Gemini
        answer = gemini_service.generate_answer(
            request.question,
            mock_context
        )
        
        # Step 4: Create a simple timeline from the mock data
        timeline = [
            {"date": "2023-03-10", "event": "AWS cost problem reported", "source": "Slack"},
            {"date": "2023-03-15", "event": "GCP migration proposed", "source": "Slack"},
            {"date": "2023-03-18", "event": "CLOUD-102 created", "source": "Jira"},
            {"date": "2023-04-20", "event": "Initial GCP deployment", "source": "GitHub"},
            {"date": "2023-04-25", "event": "GCP deployment completed", "source": "Slack"},
            {"date": "2023-05-15", "event": "Migration completed", "source": "GitHub"},
        ]
        
        # Step 5: Create a simple graph
        graph = {
            "nodes": [
                {"id": "Rahul", "type": "Person"},
                {"id": "Priya", "type": "Person"},
                {"id": "AWS", "type": "Technology"},
                {"id": "GCP", "type": "Technology"},
                {"id": "CLOUD-102", "type": "Project"},
            ],
            "edges": [
                {"source": "Rahul", "target": "AWS", "label": "reported_cost_issue"},
                {"source": "Priya", "target": "GCP", "label": "proposed_migration"},
                {"source": "CLOUD-102", "target": "GCP", "label": "evaluates"},
                {"source": "GCP", "target": "AWS", "label": "replaces"},
            ]
        }
        
        # Step 6: Sources
        sources = [
            {"id": "slack_001", "source": "Slack", "date": "2023-03-10", "channel": "engineering"},
            {"id": "slack_002", "source": "Slack", "date": "2023-03-15", "channel": "architecture"},
            {"id": "CLOUD-102", "source": "Jira", "date": "2023-03-18", "type": "Issue"},
            {"id": "commit_002", "source": "GitHub", "date": "2023-04-20", "repo": "main"},
        ]
        
        return ChatResponse(
            answer=answer,
            timeline=timeline,
            graph=graph,
            sources=sources
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