import google.generativeai as genai
import json
from backend.config import config
from backend.utils.prompts import EXTRACTION_PROMPT, QUESTION_ANSWER_PROMPT, QUESTION_ENTITY_EXTRACTION

class GeminiService:
    def __init__(self):
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(config.GEMINI_MODEL)
        self.temperature = config.TEMPERATURE

    def extract_entities_and_relationships(self, text: str) -> dict:
        """Extract entities and relationships from text using Gemini."""
        try:
            prompt = EXTRACTION_PROMPT.format(text=text)
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": self.temperature}
            )
            
            # Parse the JSON response
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"Raw response: {response.text}")
            return {"entities": [], "relationships": []}
        except Exception as e:
            print(f"Error in extraction: {e}")
            return {"entities": [], "relationships": []}

    def generate_answer(self, question: str, context: str) -> str:
        """Generate an answer based on context and question."""
        try:
            prompt = QUESTION_ANSWER_PROMPT.format(context=context, question=question)
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": self.temperature}
            )
            return response.text
        except Exception as e:
            print(f"Error generating answer: {e}")
            return "I'm unable to process this question right now."

    def extract_question_entities(self, question: str) -> dict:
        """Extract entities and intent from the user's question."""
        try:
            prompt = QUESTION_ENTITY_EXTRACTION.format(question=question)
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
        """Generate a summary of events for the timeline."""
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