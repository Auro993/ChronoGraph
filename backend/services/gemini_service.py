import google.generativeai as genai 
import json
import os
import time

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

    def call_with_retry(self, prompt, max_retries=5):
        """Call Gemini with exponential backoff for rate limits"""
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={"temperature": self.temperature}
                )
                return response
            except Exception as e:
                error_str = str(e)
                if "429" in error_str and attempt < max_retries - 1:
                    # Exponential backoff: 5, 10, 20, 40, 80 seconds
                    wait_time = (2 ** attempt) * 5
                    print(f"⏳ Rate limited. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                    time.sleep(wait_time)
                else:
                    raise e
        return None

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
            response = self.call_with_retry(prompt)
            if response:
                result = json.loads(response.text)
                return result
            return {"entities": [], "relationships": []}
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
            response = self.call_with_retry(prompt, max_retries=3)
            if response:
                return response.text
            return "I'm unable to process this question right now due to rate limits."
        except Exception as e:
            print(f"Error generating answer: {e}")
            return "I'm unable to process this question right now."

    def generate_answer_with_evidence(self, question: str, context: str) -> str:
        """
        Generate an answer using temporal context with evidence.
        This is the new method for Temporal GraphRAG.
        """
        try:
            prompt = f"""
You are ChronoGraph, an enterprise history investigation assistant.
You help teams understand why decisions were made and how events unfolded over time.

{context}

Based on the evidence provided above, answer the question.
Be specific about dates, sources, and relationships.
If the evidence doesn't fully answer the question, acknowledge what you know and what you don't.

Question: {question}

Answer:
"""
            response = self.call_with_retry(prompt, max_retries=3)
            if response:
                return response.text
            return "I'm unable to process this question right now due to rate limits."
        except Exception as e:
            print(f"Error generating answer with evidence: {e}")
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
            response = self.call_with_retry(prompt, max_retries=3)
            if response:
                result = json.loads(response.text)
                return result
            return {"entities": [], "intent": "what", "topic": ""}
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
            response = self.call_with_retry(prompt, max_retries=3)
            if response:
                return response.text
            return "Unable to generate summary due to rate limits."
        except Exception as e:
            print(f"Error generating summary: {e}")
            return "Unable to generate summary."

    def extract_temporal_entities(self, question: str) -> dict:
        """
        Extract entities with temporal context from question.
        This helps with understanding time-based queries.
        """
        try:
            prompt = f"""
Analyze this question and extract:
1. The main entities (people, technologies, projects)
2. The intent (what, why, how, when, who)
3. Any time references (dates, periods, sequences)
4. The topic

Question: {question}

Return as JSON:
{{
    "entities": ["entity1", "entity2"],
    "intent": "what|why|how|when|who",
    "time_references": {{
        "type": "specific_date|range|sequence|none",
        "value": "value if applicable"
    }},
    "topic": "brief_topic_description"
}}
"""
            response = self.call_with_retry(prompt, max_retries=3)
            if response:
                result = json.loads(response.text)
                return result
            return {"entities": [], "intent": "what", "time_references": {"type": "none", "value": None}, "topic": ""}
        except Exception as e:
            print(f"Error extracting temporal entities: {e}")
            return {"entities": [], "intent": "what", "time_references": {"type": "none", "value": None}, "topic": ""}