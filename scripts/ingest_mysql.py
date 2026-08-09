import json
import sys
import time
from pathlib import Path
from datetime import datetime

# Add parent directory to path so we can import backend modules
sys.path.append(str(Path(__file__).parent.parent))

from backend.services.mysql_service import MySQLService
from backend.services.gemini_service import GeminiService

def load_mock_data():
    """Load mock data from JSON files"""
    print("📂 Loading mock data...")
    data_dir = Path(__file__).parent.parent / "data"
    
    # Load Slack messages
    with open(data_dir / "slack/slack_messages.json", "r") as f:
        slack_data = json.load(f)
    print(f"  ✅ Loaded {len(slack_data)} Slack messages")
    
    # Load GitHub commits
    with open(data_dir / "github/commits.json", "r") as f:
        github_data = json.load(f)
    print(f"  ✅ Loaded {len(github_data)} GitHub commits")
    
    # Load Jira issues
    with open(data_dir / "jira/issues.json", "r") as f:
        jira_data = json.load(f)
    print(f"  ✅ Loaded {len(jira_data)} Jira issues")
    
    return slack_data, github_data, jira_data

def extract_and_store():
    """Extract entities and store in MySQL"""
    print("🚀 Starting data ingestion...")
    print("=" * 50)
    
    # Step 1: Connect to MySQL
    print("📡 Step 1: Connecting to MySQL...")
    mysql = MySQLService()
    if not mysql.connection:
        print("❌ Cannot connect to MySQL. Please check your credentials.")
        return
    print("✅ MySQL connected successfully!")
    
    # Step 2: Clear existing data
    print("\n🗑️  Step 2: Clearing existing data...")
    mysql.clear_database()
    print("✅ Database cleared!")
    
    # Step 3: Initialize Gemini
    print("\n🤖 Step 3: Initializing Gemini...")
    try:
        gemini = GeminiService()
        print("✅ Gemini initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize Gemini: {e}")
        mysql.close()
        return
    
    # Step 4: Load data
    print("\n📂 Step 4: Loading mock data...")
    slack_data, github_data, jira_data = load_mock_data()
    print("=" * 50)
    
    # Step 5: Process Slack messages
    print("\n📝 Step 5: Processing Slack messages...")
    slack_entities = 0
    slack_relationships = 0
    
    for idx, msg in enumerate(slack_data):
        try:
            print(f"  Processing {idx+1}/{len(slack_data)}: {msg['id']}...")
            result = gemini.extract_entities_and_relationships(msg["message"])
            
            # Create entities
            entity_ids = {}
            for entity in result.get("entities", []):
                entity_id = mysql.create_entity(
                    name=entity["name"],
                    entity_type=entity["type"],
                    source="Slack",
                    source_id=msg["id"],
                    properties={
                        "channel": msg["channel"], 
                        "user": msg["user"],
                        "timestamp": msg["timestamp"]
                    }
                )
                if entity_id:
                    entity_ids[entity["name"]] = entity_id
                    slack_entities += 1
            
            # Create relationships
            for rel in result.get("relationships", []):
                source_id = entity_ids.get(rel["source"])
                target_id = entity_ids.get(rel["target"])
                if source_id and target_id:
                    mysql.create_relationship(
                        source_id=source_id,
                        target_id=target_id,
                        relation_type=rel["relation"],
                        timestamp=rel.get("timestamp", msg["timestamp"]),
                        source="Slack",
                        source_id_ref=msg["id"]
                    )
                    slack_relationships += 1
            
            print(f"  ✅ {msg['id']}: Found {len(result.get('entities', []))} entities, {len(result.get('relationships', []))} relationships")
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Error processing {msg['id']}: {e}")
    
    print(f"  📊 Slack summary: {slack_entities} entities, {slack_relationships} relationships")
    
    # Step 6: Process GitHub commits
    print("\n📝 Step 6: Processing GitHub commits...")
    github_entities = 0
    github_relationships = 0
    
    for idx, commit in enumerate(github_data):
        try:
            print(f"  Processing {idx+1}/{len(github_data)}: {commit['id']}...")
            result = gemini.extract_entities_and_relationships(commit["message"])
            
            entity_ids = {}
            for entity in result.get("entities", []):
                entity_id = mysql.create_entity(
                    name=entity["name"],
                    entity_type=entity["type"],
                    source="GitHub",
                    source_id=commit["id"],
                    properties={
                        "author": commit["author"],
                        "timestamp": commit["timestamp"]
                    }
                )
                if entity_id:
                    entity_ids[entity["name"]] = entity_id
                    github_entities += 1
            
            for rel in result.get("relationships", []):
                source_id = entity_ids.get(rel["source"])
                target_id = entity_ids.get(rel["target"])
                if source_id and target_id:
                    mysql.create_relationship(
                        source_id=source_id,
                        target_id=target_id,
                        relation_type=rel["relation"],
                        timestamp=rel.get("timestamp", commit["timestamp"]),
                        source="GitHub",
                        source_id_ref=commit["id"]
                    )
                    github_relationships += 1
            
            print(f"  ✅ {commit['id']}: Found {len(result.get('entities', []))} entities, {len(result.get('relationships', []))} relationships")
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Error processing {commit['id']}: {e}")
    
    print(f"  📊 GitHub summary: {github_entities} entities, {github_relationships} relationships")
    
    # Step 7: Process Jira issues
    print("\n📝 Step 7: Processing Jira issues...")
    jira_entities = 0
    jira_relationships = 0
    
    for idx, issue in enumerate(jira_data):
        try:
            print(f"  Processing {idx+1}/{len(jira_data)}: {issue['id']}...")
            text = f"{issue['title']} {issue['description']}"
            result = gemini.extract_entities_and_relationships(text)
            
            entity_ids = {}
            for entity in result.get("entities", []):
                entity_id = mysql.create_entity(
                    name=entity["name"],
                    entity_type=entity["type"],
                    source="Jira",
                    source_id=issue["id"],
                    properties={
                        "assignee": issue["assignee"], 
                        "status": issue["status"],
                        "priority": issue.get("priority", "Medium")
                    }
                )
                if entity_id:
                    entity_ids[entity["name"]] = entity_id
                    jira_entities += 1
            
            for rel in result.get("relationships", []):
                source_id = entity_ids.get(rel["source"])
                target_id = entity_ids.get(rel["target"])
                if source_id and target_id:
                    mysql.create_relationship(
                        source_id=source_id,
                        target_id=target_id,
                        relation_type=rel["relation"],
                        timestamp=rel.get("timestamp", issue["created"]),
                        source="Jira",
                        source_id_ref=issue["id"]
                    )
                    jira_relationships += 1
            
            print(f"  ✅ {issue['id']}: Found {len(result.get('entities', []))} entities, {len(result.get('relationships', []))} relationships")
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Error processing {issue['id']}: {e}")
    
    print(f"  📊 Jira summary: {jira_entities} entities, {jira_relationships} relationships")
    
    # Step 8: Show summary
    print("\n" + "=" * 50)
    print("📊 INGESTION COMPLETE!")
    print("=" * 50)
    
    stats = mysql.get_stats()
    print(f"📊 Total entities created: {stats.get('entities', 0)}")
    print(f"📊 Total relationships created: {stats.get('relationships', 0)}")
    print("=" * 50)
    
    mysql.close()
    
    print("\n✅ Data ingestion completed successfully!")
    print("You can now query the database from your backend.")

if __name__ == "__main__":
    extract_and_store()