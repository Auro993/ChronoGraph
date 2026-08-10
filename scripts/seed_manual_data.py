import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from backend.services.mysql_service import MySQLService

# Pre-defined entities and relationships
data = {
    "entities": [
        {"name": "Rahul", "type": "Person", "source": "Slack", "source_id": "slack_001"},
        {"name": "Priya", "type": "Person", "source": "Slack", "source_id": "slack_002"},
        {"name": "Amit", "type": "Person", "source": "Slack", "source_id": "slack_005"},
        {"name": "AWS", "type": "Technology", "source": "Slack", "source_id": "slack_001"},
        {"name": "GCP", "type": "Technology", "source": "Slack", "source_id": "slack_002"},
        {"name": "CLOUD-102", "type": "Project", "source": "Jira", "source_id": "CLOUD-102"},
        {"name": "GCP Migration", "type": "Decision", "source": "Jira", "source_id": "CLOUD-102"},
    ],
    "relationships": [
        {"source": "Rahul", "target": "AWS", "relation": "REPORTED_COST_ISSUE", "timestamp": "2023-03-10"},
        {"source": "Priya", "target": "GCP", "relation": "PROPOSED_MIGRATION", "timestamp": "2023-03-15"},
        {"source": "Priya", "target": "CLOUD-102", "relation": "CREATED", "timestamp": "2023-03-18"},
        {"source": "CLOUD-102", "target": "GCP Migration", "relation": "TRACKS", "timestamp": "2023-03-18"},
        {"source": "Rahul", "target": "GCP", "relation": "IMPLEMENTED", "timestamp": "2023-04-20"},
        {"source": "Amit", "target": "GCP", "relation": "DEPLOYED", "timestamp": "2023-04-25"},
        {"source": "GCP", "target": "AWS", "relation": "REPLACES", "timestamp": "2023-05-15"},
    ]
}

def seed_data():
    print("🌱 Seeding manual data...")
    mysql = MySQLService()
    
    if not mysql.connection:
        print("❌ MySQL not connected")
        return
    
    # Clear existing data
    mysql.clear_database()
    
    # Create entities
    entity_ids = {}
    for entity in data["entities"]:
        entity_id = mysql.create_entity(
            name=entity["name"],
            entity_type=entity["type"],
            source=entity["source"],
            source_id=entity["source_id"]
        )
        if entity_id:
            entity_ids[entity["name"]] = entity_id
            print(f"  ✅ Created entity: {entity['name']}")
    
    # Create relationships
    for rel in data["relationships"]:
        source_id = entity_ids.get(rel["source"])
        target_id = entity_ids.get(rel["target"])
        if source_id and target_id:
            mysql.create_relationship(
                source_id=source_id,
                target_id=target_id,
                relation_type=rel["relation"],
                timestamp=rel["timestamp"],
                source="Manual",
                source_id_ref="seed_data"
            )
            print(f"  ✅ Created relationship: {rel['source']} -> {rel['target']} ({rel['relation']})")
    
    stats = mysql.get_stats()
    print(f"\n📊 Total entities: {stats.get('entities', 0)}")
    print(f"📊 Total relationships: {stats.get('relationships', 0)}")
    
    mysql.close()
    print("✅ Seeding complete!")

if __name__ == "__main__":
    seed_data()