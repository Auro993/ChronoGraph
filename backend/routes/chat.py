from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.gemini_service import GeminiService
from backend.services.mysql_service import MySQLService
import json
from datetime import datetime

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
        print(f"🔍 Question: {request.question}")
        
        # Step 1: Extract entities from question using Gemini
        question_info = gemini_service.extract_question_entities(request.question)
        entities = question_info.get("entities", [])
        print(f"🏷️  Extracted entities: {entities}")
        
        # Step 2: Try to get data from MySQL
        mysql = MySQLService()
        graph_data = None
        
        if mysql.connection and entities:
            try:
                # Query MySQL for relevant data
                graph_data = mysql.query_temporal_graph(entities)
                mysql.close()
                print(f"📊 Found {len(graph_data.get('relationships', []))} relationships in MySQL")
            except Exception as e:
                print(f"⚠️  MySQL query failed: {e}")
                mysql.close()
                graph_data = None
        
        # Step 3: If MySQL has data, use it; otherwise use mock data
        if graph_data and graph_data.get("relationships"):
            # Build context from MySQL data
            context = build_context_from_graph(graph_data)
            
            # Build timeline from MySQL data
            timeline = build_timeline_from_graph(graph_data)
            
            # Build graph for visualization
            graph = build_graph_for_visualization(graph_data)
            
            # Build sources from MySQL data
            sources = build_sources_from_graph(graph_data)
        else:
            print("⚠️  Using mock data (MySQL not available or no data found)")
            # Use mock data as fallback
            context = """
Historical Events:
- March 10, 2023: Rahul reported AWS infrastructure costs increased
- March 15, 2023: Priya proposed evaluating GCP as an alternative
- March 18, 2023: Jira issue CLOUD-102 created for GCP migration
- April 20, 2023: Rahul added initial GCP deployment configuration
- April 25, 2023: Amit completed initial GCP deployment
- May 15, 2023: Migration to GCP completed
"""
            timeline = [
                {"date": "2023-03-10", "event": "AWS cost problem reported", "source": "Slack"},
                {"date": "2023-03-15", "event": "GCP migration proposed", "source": "Slack"},
                {"date": "2023-03-18", "event": "CLOUD-102 created", "source": "Jira"},
                {"date": "2023-04-20", "event": "Initial GCP deployment", "source": "GitHub"},
                {"date": "2023-04-25", "event": "GCP deployment completed", "source": "Slack"},
                {"date": "2023-05-15", "event": "Migration completed", "source": "GitHub"},
            ]
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
            sources = [
                {"id": "slack_001", "source": "Slack", "date": "2023-03-10", "channel": "engineering"},
                {"id": "slack_002", "source": "Slack", "date": "2023-03-15", "channel": "architecture"},
                {"id": "CLOUD-102", "source": "Jira", "date": "2023-03-18", "type": "Issue"},
                {"id": "commit_002", "source": "GitHub", "date": "2023-04-20", "repo": "main"},
            ]
        
        # Step 4: Generate answer using Gemini with the context
        answer = gemini_service.generate_answer(request.question, context)
        
        # Step 5: Return the complete response
        return ChatResponse(
            answer=answer,
            timeline=timeline,
            graph=graph,
            sources=sources
        )
    
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def build_context_from_graph(graph_data):
    """Build a text context from graph data"""
    if not graph_data or not graph_data.get("relationships"):
        return "No historical data found for this query."
    
    context = "Historical events and relationships:\n\n"
    for rel in graph_data["relationships"]:
        context += f"- {rel['source']} {rel['relationship']} {rel['target']} "
        if rel.get('timestamp'):
            context += f"(Date: {rel['timestamp']}) "
        context += f"[Source: {rel.get('data_source', 'Unknown')}]\n"
    
    return context

def build_timeline_from_graph(graph_data):
    """Build a timeline from graph data"""
    timeline = []
    
    # Process relationships into timeline events
    for rel in graph_data.get("relationships", []):
        event = {
            "date": rel.get("timestamp", ""),
            "event": f"{rel['source']} {rel['relationship']} {rel['target']}",
            "source": rel.get("data_source", ""),
            "source_id": rel.get("source_id", "")
        }
        timeline.append(event)
    
    # Sort by date (most recent first)
    timeline.sort(key=lambda x: x["date"], reverse=True)
    
    return timeline

def build_graph_for_visualization(graph_data):
    """Build graph structure for React Flow visualization"""
    nodes = []
    edges = []
    seen_nodes = set()
    
    # Extract nodes from relationships
    for rel in graph_data.get("relationships", []):
        # Add source node
        if rel['source'] not in seen_nodes:
            nodes.append({
                "id": rel['source'],
                "type": rel.get('source_type', 'Entity'),
                "label": rel['source']
            })
            seen_nodes.add(rel['source'])
        
        # Add target node
        if rel['target'] not in seen_nodes:
            nodes.append({
                "id": rel['target'],
                "type": rel.get('target_type', 'Entity'),
                "label": rel['target']
            })
            seen_nodes.add(rel['target'])
        
        # Add edge
        edges.append({
            "source": rel['source'],
            "target": rel['target'],
            "label": rel['relationship']
        })
    
    return {
        "nodes": nodes,
        "edges": edges
    }

def build_sources_from_graph(graph_data):
    """Extract unique sources from graph data"""
    sources_dict = {}
    
    for rel in graph_data.get("relationships", []):
        source_key = f"{rel.get('data_source', '')}_{rel.get('source_id', '')}"
        if source_key and source_key not in sources_dict:
            sources_dict[source_key] = {
                "id": rel.get("source_id", ""),
                "source": rel.get("data_source", ""),
                "date": rel.get("timestamp", ""),
                "type": "event"
            }
    
    return list(sources_dict.values())

@router.get("/test")
async def test_gemini():
    """Test endpoint to verify Gemini connection."""
    try:
        test_prompt = "What is ChronoGraph? Answer in one sentence."
        response = gemini_service.model.generate_content(test_prompt)
        return {"status": "connected", "response": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/mysql-test")
async def test_mysql():
    """Test endpoint to verify MySQL connection."""
    try:
        mysql = MySQLService()
        if mysql.connection:
            stats = mysql.get_stats()
            mysql.close()
            return {
                "status": "connected",
                "stats": stats,
                "message": "MySQL connection successful!"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to connect to MySQL"
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/entities")
async def get_entities():
    """Get all entities from MySQL."""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        mysql.cursor.execute("SELECT id, name, type, source, source_id FROM entities LIMIT 50")
        entities = mysql.cursor.fetchall()
        mysql.close()
        
        return {"status": "success", "entities": entities}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/relationships")
async def get_relationships():
    """Get all relationships from MySQL."""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        mysql.cursor.execute("""
            SELECT 
                e1.name as source,
                e2.name as target,
                r.relation_type,
                r.timestamp,
                r.source as data_source
            FROM relationships r
            JOIN entities e1 ON r.source_entity_id = e1.id
            JOIN entities e2 ON r.target_entity_id = e2.id
            LIMIT 50
        """)
        relationships = mysql.cursor.fetchall()
        mysql.close()
        
        return {"status": "success", "relationships": relationships}
    except Exception as e:
        return {"status": "error", "message": str(e)}