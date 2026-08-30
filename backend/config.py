import os
from pathlib import Path

class Config:
    # Gemini
    GEMINI_API_KEY = "AIzaSyDk7R0R3TBkq3a0iTuzarXzjYct2ZPOqzk"
    GEMINI_MODEL = "models/gemini-3.6-flash"
    TEMPERATURE = 0.7
    
    # MySQL
    MYSQL_HOST = "localhost"
    MYSQL_PORT = 3306
    MYSQL_USER = "root"
    MYSQL_PASSWORD = "Aurosmita"
    MYSQL_DATABASE = "chronograph"
    
    # Temporal GraphRAG Settings
    MAX_EVIDENCE_ITEMS = 10
    MAX_RELATIONSHIP_HOPS = 3
    
    # App
    DEBUG = True

config = Config()