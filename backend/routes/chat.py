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

def save_chat_history(question, answer, timeline, graph, sources):
    """Save chat to history in MySQL"""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return
        
        cursor = mysql.connection.cursor()
        cursor.execute("""
            INSERT INTO chat_history (question, answer, timeline, graph, sources)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            question,
            answer,
            json.dumps(timeline),
            json.dumps(graph),
            json.dumps(sources)
        ))
        mysql.connection.commit()
        cursor.close()
        mysql.close()
        print("✅ Chat saved to history")
    except Exception as e:
        print(f"⚠️ Failed to save chat history: {e}")

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"🔍 Question: {request.question}")
        
        # ============================================================
        # STEP 1: Understand the question using Gemini
        # ============================================================
        question_info = gemini_service.extract_question_entities(request.question)
        entities = question_info.get("entities", [])
        intent = question_info.get("intent", "what")
        print(f"🏷️  Extracted entities: {entities}")
        print(f"🎯 Intent: {intent}")
        
        # ============================================================
        # STEP 2: Find relevant entities in MySQL
        # ============================================================
        mysql = MySQLService()
        graph_data = None
        
        if mysql.connection and entities:
            try:
                # Get entity IDs from names
                entity_records = mysql.get_entities_by_names(entities)
                entity_ids = [e['id'] for e in entity_records]
                print(f"🔢 Entity IDs: {entity_ids}")
                
                # Query temporal graph with evidence
                graph_data = mysql.query_temporal_graph(entities)
                mysql.close()
                
                relationships_count = len(graph_data.get('relationships', []))
                events_count = len(graph_data.get('events', []))
                print(f"📊 Found {relationships_count} relationships and {events_count} events")
                
            except Exception as e:
                print(f"⚠️  MySQL query failed: {e}")
                mysql.close()
                graph_data = None
        
        # ============================================================
        # STEP 3: Build Temporal Context
        # ============================================================
        if graph_data and graph_data.get("relationships"):
            # Build temporal context from graph data with evidence
            context = build_temporal_context_with_evidence(graph_data, request.question)
            
            # Build timeline from graph data
            timeline = build_timeline_from_graph(graph_data)
            
            # Build graph for visualization
            graph = build_graph_for_visualization(graph_data)
            
            # Build sources with evidence
            sources = build_sources_with_evidence(graph_data)
        else:
            print("⚠️  Using mock data (MySQL not available or no data found)")
            context, timeline, graph, sources = get_mock_data()
        
        # ============================================================
        # STEP 4: Generate answer using Gemini with temporal context
        # ============================================================
        try:
            answer = gemini_service.generate_answer(request.question, context)
            # Check if Gemini returned an error message
            if "unable to process" in answer.lower() or "rate limit" in answer.lower():
                print("⚠️  Gemini rate-limited, using fallback answer")
                answer = generate_fallback_answer_with_evidence(request.question, timeline, sources)
            else:
                # Add citations to the answer
                answer = add_citations_to_answer(answer, sources)
        except Exception as e:
            print(f"⚠️  Gemini error: {e}")
            answer = generate_fallback_answer_with_evidence(request.question, timeline, sources)
        
        # ============================================================
        # STEP 5: Save to history and return
        # ============================================================
        save_chat_history(request.question, answer, timeline, graph, sources)
        
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

# ============================================================
# HELPERS: Build Temporal Context
# ============================================================

def build_temporal_context_with_evidence(graph_data, question):
    """Build a chronological context from graph data with evidence"""
    if not graph_data or not graph_data.get("relationships"):
        return "No historical data found for this query."
    
    # Sort relationships by timestamp
    relationships = sorted(
        graph_data["relationships"], 
        key=lambda x: x.get("timestamp", ""), 
        reverse=False
    )
    
    # Build context
    context = f"TEMPORAL ENTERPRISE HISTORY\n"
    context += f"Question: {question}\n\n"
    context += "Relevant events (chronological order):\n\n"
    
    # Group events by date
    events_by_date = {}
    for rel in relationships:
        date = rel.get("timestamp", "Unknown date")
        if date not in events_by_date:
            events_by_date[date] = []
        events_by_date[date].append(rel)
    
    # Add events to context
    for date in sorted(events_by_date.keys()):
        context += f"[{date}]\n"
        for rel in events_by_date[date]:
            source = rel.get("data_source", "Unknown")
            source_id = rel.get("source_id", "")
            source_name = rel.get("source", "Unknown")
            target_name = rel.get("target", "Unknown")
            relation = rel.get("relationship", "related to")
            
            context += f"  • {source} ({source_id}): {source_name} {relation} {target_name}\n"
            
            # Add event content if available
            if rel.get('event_id'):
                context += f"    Evidence available\n"
        
        context += "\n"
    
    # Add relationship summary
    context += "\nRELATIONSHIPS:\n"
    for rel in relationships[:10]:  # Limit to 10
        source_name = rel.get("source", "Unknown")
        target_name = rel.get("target", "Unknown")
        relation = rel.get("relationship", "related to")
        context += f"  • {source_name} --{relation}--> {target_name}\n"
    
    context += "\nINSTRUCTIONS:\n"
    context += "1. Answer only using the supplied evidence.\n"
    context += "2. Do not invent information.\n"
    context += "3. Mention dates and sources.\n"
    context += "4. If unsure, say 'I don't have enough information'.\n"
    
    return context

def build_timeline_from_graph(graph_data):
    """Build a timeline from graph data with chronological order"""
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
    
    # Sort by date (oldest first)
    timeline.sort(key=lambda x: x["date"])
    
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

def build_sources_with_evidence(graph_data):
    """Extract unique sources with evidence from graph data"""
    sources_dict = {}
    
    # Process relationships
    for rel in graph_data.get("relationships", []):
        source_key = f"{rel.get('data_source', '')}_{rel.get('source_id', '')}"
        if source_key and source_key not in sources_dict:
            sources_dict[source_key] = {
                "id": rel.get("source_id", ""),
                "source": rel.get("data_source", ""),
                "date": rel.get("timestamp", ""),
                "type": "event",
                "has_evidence": rel.get('event_id') is not None
            }
    
    return list(sources_dict.values())

def get_mock_data():
    """Return mock data when MySQL is not available"""
    context = """
TEMPORAL ENTERPRISE HISTORY
Question: Why did we migrate from AWS to GCP?

Relevant events (chronological order):

[2023-03-10]
  • Slack (slack_001): Rahul REPORTED_COST_ISSUE AWS

[2023-03-15]
  • Slack (slack_002): Priya PROPOSED_MIGRATION GCP

[2023-03-18]
  • Jira (CLOUD-102): Priya CREATED CLOUD-102

[2023-04-20]
  • GitHub (commit_002): Rahul IMPLEMENTED GCP

RELATIONSHIPS:
  • Rahul --REPORTED_COST_ISSUE--> AWS
  • Priya --PROPOSED_MIGRATION--> GCP
  • Priya --CREATED--> CLOUD-102
  • Rahul --IMPLEMENTED--> GCP

INSTRUCTIONS:
1. Answer only using the supplied evidence.
2. Do not invent information.
3. Mention dates and sources.
"""
    
    timeline = [
        {"date": "2023-03-10", "event": "Rahul reported AWS cost issue", "source": "Slack", "source_id": "slack_001"},
        {"date": "2023-03-15", "event": "Priya proposed GCP migration", "source": "Slack", "source_id": "slack_002"},
        {"date": "2023-03-18", "event": "CLOUD-102 created", "source": "Jira", "source_id": "CLOUD-102"},
        {"date": "2023-04-20", "event": "Rahul implemented GCP", "source": "GitHub", "source_id": "commit_002"},
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
            {"source": "Rahul", "target": "AWS", "label": "REPORTED_COST_ISSUE"},
            {"source": "Priya", "target": "GCP", "label": "PROPOSED_MIGRATION"},
            {"source": "Priya", "target": "CLOUD-102", "label": "CREATED"},
            {"source": "Rahul", "target": "GCP", "label": "IMPLEMENTED"},
        ]
    }
    
    sources = [
        {"id": "slack_001", "source": "Slack", "date": "2023-03-10", "has_evidence": True},
        {"id": "slack_002", "source": "Slack", "date": "2023-03-15", "has_evidence": True},
        {"id": "CLOUD-102", "source": "Jira", "date": "2023-03-18", "has_evidence": True},
        {"id": "commit_002", "source": "GitHub", "date": "2023-04-20", "has_evidence": True},
    ]
    
    return context, timeline, graph, sources

def generate_fallback_answer_with_evidence(question, timeline, sources):
    """Generate a fallback answer with evidence"""
    answer = f"""
## 🔍 Investigation Results

### 📋 Your Question
"{question}"

### 📊 Evidence Timeline

Based on the available evidence, here's what happened:

"""
    for event in timeline:
        answer += f"• **{event['date']}**: {event['event']} (Source: {event['source']})\n"
    
    answer += f"""
### 📚 Sources
"""
    for source in sources:
        answer += f"• {source['source']} - {source['date']} ({source['id']})\n"
    
    return answer

def add_citations_to_answer(answer, sources):
    """Add source citations to the answer"""
    if not sources:
        return answer
    
    citation_text = "\n\n---\n\n📚 **Sources:**\n"
    for i, source in enumerate(sources, 1):
        source_id = source.get("id", "")
        source_name = source.get("source", "Unknown")
        source_date = source.get("date", "")
        
        citation_text += f"[{i}] {source_name} - {source_date} ({source_id})\n"
    
    return answer + citation_text

# ============================================================
# TEST ENDPOINTS
# ============================================================

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
                r.source as data_source,
                r.event_id
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

@router.get("/events")
async def get_events():
    """Get all events from MySQL."""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        mysql.cursor.execute("SELECT * FROM events LIMIT 50")
        events = mysql.cursor.fetchall()
        mysql.close()
        
        return {"status": "success", "events": events}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/history")
async def get_chat_history(limit: int = 20):
    """Get chat history from MySQL"""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        cursor = mysql.connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, question, answer, timeline, graph, sources, created_at
            FROM chat_history
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
        
        history = cursor.fetchall()
        
        # Parse JSON fields
        for item in history:
            item['timeline'] = json.loads(item['timeline']) if item['timeline'] else []
            item['graph'] = json.loads(item['graph']) if item['graph'] else {}
            item['sources'] = json.loads(item['sources']) if item['sources'] else []
            item['created_at'] = str(item['created_at'])
        
        cursor.close()
        mysql.close()
        
        return {"status": "success", "history": history}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/search")
async def search_entities(q: str):
    """Search for entities in MySQL"""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        cursor = mysql.connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, type, source, source_id
            FROM entities
            WHERE name LIKE %s OR type LIKE %s
            LIMIT 20
        """, (f"%{q}%", f"%{q}%"))
        
        results = cursor.fetchall()
        cursor.close()
        mysql.close()
        
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}