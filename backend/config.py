class Config:
    GEMINI_API_KEY = "AIzaSyDk7R0R3TBkq3a0iTuzarXzjYct2ZPOqzk"
    GEMINI_MODEL = "models/gemini-1.5-flash"  # Using an available model
    TEMPERATURE = 0.7
    NEO4J_URI = "bolt://localhost:7687"
    NEO4J_USERNAME = "neo4j"
    NEO4J_PASSWORD = "your_password_here"
    MYSQL_HOST = "localhost"
    MYSQL_PORT = 3306
    MYSQL_USER = "root"
    MYSQL_PASSWORD = "Aurosmita"
    MYSQL_DATABASE = "chronograph"
    DEBUG = True

config = Config()