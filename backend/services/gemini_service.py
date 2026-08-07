import google.generativeai as genai
import json
import os

class GeminiService:
    def __init__(self):
        # Hardcode the API key directly
        api_key = "AIzaSyDk7R0R3TBkq3a0iTuzarXzjYct2ZPOqzk"
        
        # Configure Gemini with the key
        genai.configure(api_key=api_key)
        # Use an available model from the list
        self.model = genai.GenerativeModel("models/gemini-2.0-flash")
        self.temperature = 0.7
        
        print(f"✅ Gemini service initialized with model: models/gemini-2.0-flash")

    def extract_entities_and_relationships(self, text: str) -> dict:
        try:
            prompt = f"""
You are an expert at extracting entities and relationships from text.
Given a piece of text, identify the key entities (people, technologies, projects, decisions) 
and the relationships between them. Include timestamps if present.

Return the result as a JSON object with the following structure:
{{
    "entities": [
        {{"name": "entity_name", "type": "Person|Technology|Project|Decision|Event"}}
    ],
    "relationships": [
        {{
            "source": "entity_name",
            "target": "entity_name",
            "relation": "ACTION_VERB",
            "timestamp": "YYYY-MM-DD"
        }}
    ]
}}

Text: {text}
"""
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": self.temperature}
            )
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Error in extraction: {e}")
            return {"entities": [], "relationships": []}

    def generate_answer(self, question: str, context: str) -> str:
        try:
            prompt = f"""
You are ChronoGraph, an enterprise history investigation assistant.
You help teams understand why decisions were made and how events unfolded over time.

Context from historical data:
{context}

Question: {question}

Provide a detailed answer with:
1. A clear chronological explanation
2. References to sources where applicable

Answer:
"""
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": self.temperature}
            )
            return response.text
        except Exception as e:
            print(f"Error generating answer: {e}")
            return "I'm unable to process this question right now."

    def extract_question_entities(self, question: str) -> dict:
        try:
            prompt = f"""
Extract the main entities and intent from this user question.
Return as JSON:
{{
    "entities": ["entity1", "entity2"],
    "intent": "what|why|how|when|who",
    "topic": "brief_topic_description"
}}

Question: {question}
"""
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": self.temperature}
            )
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Error extracting question entities: {e}")
            return {"entities": [], "intent": "what", "topic": ""}

    def generate_summary(self, events: list) -> str:
        try:
            prompt = f"""
Summarize these historical events in chronological order.
Focus on the key decisions and actions.

Events:
{json.dumps(events, indent=2)}

Provide a concise summary (2-3 sentences per major event):
"""
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": 0.3}
            )
            return response.text
        except Exception as e:
            print(f"Error generating summary: {e}")
            return "Unable to generate summary."
