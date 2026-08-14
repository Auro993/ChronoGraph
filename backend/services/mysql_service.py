import mysql.connector
from mysql.connector import Error
from backend.config import config
import logging
import json

logger = logging.getLogger(__name__)

class MySQLService:
    def __init__(self):
        """Initialize connection to MySQL database"""
        self.connection = None
        self.cursor = None
        
        try:
            print(f"🔍 Attempting MySQL connection...")
            print(f"   Host: {config.MYSQL_HOST}")
            print(f"   Port: {config.MYSQL_PORT}")
            print(f"   User: {config.MYSQL_USER}")
            print(f"   Database: {config.MYSQL_DATABASE}")
            
            self.connection = mysql.connector.connect(
                host=config.MYSQL_HOST,
                port=config.MYSQL_PORT,
                user=config.MYSQL_USER,
                password=config.MYSQL_PASSWORD,
                database=config.MYSQL_DATABASE,
                connection_timeout=10,
                use_pure=True
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                print(f"✅ Connected to MySQL at {config.MYSQL_HOST}:{config.MYSQL_PORT}")
                self._create_tables()
            else:
                print("❌ Connection failed - not connected")
                self.connection = None
                
        except Error as e:
            print(f"❌ MySQL Error: {e}")
            self.connection = None
        except Exception as e:
            print(f"❌ General Error: {e}")
            self.connection = None
    
    def _create_tables(self):
        """Create necessary tables if they don't exist"""
        if not self.connection:
            return
            
        try:
            print("📋 Creating tables if they don't exist...")
            
            # Create entities table
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS entities (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    source VARCHAR(50),
                    source_id VARCHAR(100),
                    properties JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_name (name),
                    INDEX idx_type (type),
                    INDEX idx_source (source)
                )
            """)
            
            # Create relationships table with timestamp support
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS relationships (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    source_entity_id INT NOT NULL,
                    target_entity_id INT NOT NULL,
                    relation_type VARCHAR(100) NOT NULL,
                    timestamp DATETIME,
                    source VARCHAR(50),
                    source_id VARCHAR(100),
                    properties JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
                    FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
                    INDEX idx_relation (relation_type),
                    INDEX idx_timestamp (timestamp)
                )
            """)
            
            # Create chat history table
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    question TEXT NOT NULL,
                    answer TEXT,
                    timeline JSON,
                    graph JSON,
                    sources JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_created (created_at)
                )
            """)
            
            self.connection.commit()
            print("✅ Tables created/verified")
            
        except Error as e:
            print(f"❌ Error creating tables: {e}")
            self.connection = None
    
    def close(self):
        """Close database connection"""
        if self.connection:
            try:
                if self.cursor:
                    self.cursor.close()
                self.connection.close()
                print("🔒 Database connection closed")
            except:
                pass
    
    def create_entity(self, name, entity_type, source=None, source_id=None, properties=None):
        """Create or get an entity"""
        if not self.connection:
            print("❌ No database connection")
            return None
        
        try:
            # Check if entity exists
            self.cursor.execute(
                "SELECT id FROM entities WHERE name = %s AND type = %s",
                (name, entity_type)
            )
            result = self.cursor.fetchone()
            
            if result:
                return result['id']
            
            # Create new entity
            self.cursor.execute("""
                INSERT INTO entities (name, type, source, source_id, properties)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, entity_type, source, source_id, json.dumps(properties or {})))
            
            self.connection.commit()
            return self.cursor.lastrowid
            
        except Error as e:
            print(f"❌ Error creating entity '{name}': {e}")
            return None
    
    def create_relationship(self, source_id, target_id, relation_type, 
                           timestamp=None, source=None, source_id_ref=None, properties=None):
        """Create a relationship between entities with timestamp"""
        if not self.connection:
            print("❌ No database connection")
            return None
        
        try:
            self.cursor.execute("""
                INSERT INTO relationships 
                (source_entity_id, target_entity_id, relation_type, timestamp, source, source_id, properties)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (source_id, target_id, relation_type, timestamp, source, source_id_ref, json.dumps(properties or {})))
            
            self.connection.commit()
            return self.cursor.lastrowid
            
        except Error as e:
            print(f"❌ Error creating relationship: {e}")
            return None
    
    def query_temporal_graph(self, entities, time_range=None):
        """Query the temporal knowledge graph with chronological ordering"""
        if not self.connection:
            return {"nodes": [], "relationships": []}
        
        try:
            # Build the query
            placeholders = ','.join(['%s'] * len(entities))
            query = f"""
                SELECT 
                    e1.name as source_name,
                    e1.type as source_type,
                    e2.name as target_name,
                    e2.type as target_type,
                    r.relation_type,
                    r.timestamp,
                    r.source as data_source,
                    r.source_id
                FROM relationships r
                JOIN entities e1 ON r.source_entity_id = e1.id
                JOIN entities e2 ON r.target_entity_id = e2.id
                WHERE e1.name IN ({placeholders}) OR e2.name IN ({placeholders})
            """
            
            params = entities + entities
            
            if time_range:
                query += " AND r.timestamp BETWEEN %s AND %s"
                params.extend([time_range.get('start'), time_range.get('end')])
            
            # Order by timestamp (oldest first) for temporal sequence
            query += " ORDER BY r.timestamp ASC"
            
            self.cursor.execute(query, params)
            results = self.cursor.fetchall()
            
            # Build nodes and relationships
            nodes = {}
            relationships = []
            
            for row in results:
                # Add source node
                if row['source_name'] not in nodes:
                    nodes[row['source_name']] = {
                        'id': row['source_name'],
                        'type': row['source_type'],
                        'label': row['source_name']
                    }
                
                # Add target node
                if row['target_name'] not in nodes:
                    nodes[row['target_name']] = {
                        'id': row['target_name'],
                        'type': row['target_type'],
                        'label': row['target_name']
                    }
                
                # Add relationship with timestamp
                relationships.append({
                    'source': row['source_name'],
                    'source_type': row['source_type'],
                    'target': row['target_name'],
                    'target_type': row['target_type'],
                    'relationship': row['relation_type'],
                    'timestamp': str(row['timestamp']) if row['timestamp'] else None,
                    'data_source': row['data_source'],
                    'source_id': row['source_id']
                })
            
            return {
                'nodes': list(nodes.values()),
                'relationships': relationships
            }
            
        except Error as e:
            print(f"❌ Error querying graph: {e}")
            return {"nodes": [], "relationships": []}
    
    def clear_database(self):
        """Clear all data (for testing)"""
        if not self.connection:
            return
        
        try:
            self.cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            self.cursor.execute("DELETE FROM chat_history")
            self.cursor.execute("DELETE FROM relationships")
            self.cursor.execute("DELETE FROM entities")
            self.cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            self.connection.commit()
            print("🗑️  Database cleared")
        except Error as e:
            print(f"❌ Error clearing database: {e}")
    
    def get_stats(self):
        """Get database statistics"""
        if not self.connection:
            return {}
        
        try:
            self.cursor.execute("SELECT COUNT(*) as count FROM entities")
            entities_count = self.cursor.fetchone()['count']
            
            self.cursor.execute("SELECT COUNT(*) as count FROM relationships")
            relationships_count = self.cursor.fetchone()['count']
            
            self.cursor.execute("SELECT COUNT(*) as count FROM chat_history")
            history_count = self.cursor.fetchone()['count']
            
            return {
                'entities': entities_count,
                'relationships': relationships_count,
                'history': history_count
            }
        except Error as e:
            print(f"❌ Error getting stats: {e}")
            return {}