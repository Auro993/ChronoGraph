class Config:
    GEMINI_API_KEY = "AIzaSyDk7R0R3TBkq3a0iTuzarXzjYct2ZPOqzk"
    GEMINI_MODEL = "models/gemini-2.0-flash"  # Using an available model
    TEMPERATURE = 0.7
    NEO4J_URI = "bolt://localhost:7687"
    NEO4J_USERNAME = "neo4j"
    NEO4J_PASSWORD = "your_password_here"

config = Config()