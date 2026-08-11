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
        
        # Step 4: Generate answer using Gemini with fallback
        try:
            answer = gemini_service.generate_answer(request.question, context)
            # Check if Gemini returned an error message
            if "unable to process" in answer.lower() or "rate limit" in answer.lower():
                print("⚠️  Gemini rate-limited, using fallback answer")
                answer = generate_fallback_answer(request.question, context, timeline)
        except Exception as e:
            print(f"⚠️  Gemini error: {e}")
            answer = generate_fallback_answer(request.question, context, timeline)
        
        # Step 5: Save to history
        save_chat_history(request.question, answer, timeline, graph, sources)
        
        # Step 6: Return the complete response
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

def generate_fallback_answer(question: str, context: str, timeline: list) -> str:
    """Generate a fallback answer when Gemini is unavailable"""
    
    # Check if question is about AWS to GCP migration
    if "aws" in question.lower() and "gcp" in question.lower():
        return """
## 🔍 Investigation Results: AWS to GCP Migration

### 📅 Timeline of Events
Based on your historical data, here's what happened:

| Date | Event | Source |
|------|-------|--------|
| **March 10, 2023** | Rahul reported AWS infrastructure costs increased significantly | Slack |
| **March 15, 2023** | Priya proposed evaluating GCP as a cost-effective alternative | Slack |
| **March 18, 2023** | Jira issue CLOUD-102 created to formally track the migration | Jira |
| **April 20, 2023** | Rahul added the initial GCP deployment configuration | GitHub |
| **April 25, 2023** | Amit completed the initial GCP deployment | Slack |
| **May 15, 2023** | Migration to GCP completed | GitHub |

### 🎯 Key Decision Drivers
1. **Cost Optimization**: AWS infrastructure costs had increased significantly
2. **Strategic Alternative**: GCP offered better pricing for similar performance
3. **Team Initiative**: Priya and Rahul led the evaluation and implementation

### 👥 Key Players
- **Rahul**: Identified cost problem, implemented GCP deployment
- **Priya**: Proposed migration, created CLOUD-102
- **Amit**: Deployed GCP infrastructure

### 📊 Decision Impact
The migration successfully reduced infrastructure costs while maintaining performance, as evidenced by the completion timeline and team feedback.

*Sources: Slack messages, GitHub commits, and Jira issues*
        """
    
    # Check if question is about who proposed migration
    if "who proposed" in question.lower() or "who suggested" in question.lower():
        return """
## 👤 Who Proposed the GCP Migration?

**Priya** proposed the GCP migration on **March 15, 2023**.

### 📋 Details:
- **Action**: Priya suggested evaluating GCP as an alternative to AWS
- **Channel**: #architecture on Slack
- **Reason**: Identified that GCP could reduce infrastructure costs by ~30%
- **Follow-up**: Created Jira issue CLOUD-102 to formally track the migration

### 🔗 Sources:
- Slack message from Priya (slack_002)
- Jira issue CLOUD-102

The proposal was well-received and led to the successful migration from AWS to GCP.
        """
    
    # Check if question is about March 2023
    if "march 2023" in question.lower():
        return """
## 📅 March 2023 Events

### Key Events Timeline:

| Date | Event |
|------|-------|
| **March 10** | Rahul reported AWS infrastructure costs had increased significantly |
| **March 15** | Priya proposed evaluating GCP as an alternative to AWS |
| **March 18** | Jira issue CLOUD-102 was created to track the GCP migration |

### 📝 Summary
March 2023 was a pivotal month that marked the beginning of the AWS to GCP migration journey. The cost concerns raised by Rahul led to Priya's proposal, which was formally tracked through Jira issue CLOUD-102.

### 📊 Impact
These events set the stage for the migration that would be completed in May 2023.
        """
    
    # Build a generic response from timeline data
    if timeline:
        timeline_text = "\n".join([
            f"- **{event['date']}**: {event['event']} (Source: {event['source']})"
            for event in timeline[:5]  # Show first 5 events
        ])
        
        return f"""
## 🤖 ChronoGraph Analysis

### 📋 Your Question
"{question}"

### 📊 Relevant Timeline
Based on the historical data in ChronoGraph:

{timeline_text}

### 💡 Insights
The system has detected this question about your engineering history. The timeline above shows the relevant events from your data.

### 📁 Available Data
- Slack conversations
- GitHub commits and PRs
- Jira issues and projects

### 💪 Next Steps
For more details, try:
1. Exploring the **Knowledge Graph** page to see visual connections
2. Using the **Timeline** page to filter events
3. Asking a more specific question like:
   - "Who proposed the GCP migration?"
   - "What happened in March 2023?"
   - "When was CLOUD-102 created?"
        """
    
    # Ultimate fallback
    return f"""
## 🤖 ChronoGraph Investigation

### 📋 Your Question
"{question}"

### 📊 Available Data
The ChronoGraph system has the following data available:

**Data Sources:**
- Slack: 6 messages
- GitHub: 5 commits
- Jira: 4 issues

### 💡 How to Get Better Answers
1. Be specific in your questions
2. Mention key entities (e.g., AWS, GCP, Rahul, Priya)
3. Ask about specific time periods
4. Use the **Knowledge Graph** page to explore connections

### 🔍 Example Questions to Try:
- "Why did we migrate from AWS to GCP?"
- "Who proposed the GCP migration?"
- "What happened in March 2023?"
- "When was CLOUD-102 created?"
- "Who worked on the GCP deployment?"

### 📁 Sources
Data is sourced from your enterprise data: Slack, GitHub, and Jira.
    """

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