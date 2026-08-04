# Prompt for entity extraction
EXTRACTION_PROMPT = """
You are an expert at extracting entities and relationships from text.
Given a piece of text, identify the key entities (people, technologies, projects, decisions) 
and the relationships between them. Include timestamps if present.

Return the result as a JSON object with the following structure:
{
    "entities": [
        {"name": "entity_name", "type": "Person|Technology|Project|Decision|Event"},
        ...
    ],
    "relationships": [
        {
            "source": "entity_name",
            "target": "entity_name",
            "relation": "ACTION_VERB",
            "timestamp": "YYYY-MM-DD" # if available
        }
    ]
}

Text: {text}
"""

# Prompt for question answering
QUESTION_ANSWER_PROMPT = """
You are ChronoGraph, an enterprise history investigation assistant.
You help teams understand why decisions were made and how events unfolded over time.

Context from historical data:
{context}

Question: {question}

Provide a detailed answer with:
1. A clear chronological explanation
2. References to sources where applicable
3. The timeline of key events

Answer:
"""

# Prompt for entity extraction from questions
QUESTION_ENTITY_EXTRACTION = """
Extract the main entities and intent from this user question.
Return as JSON:
{{
    "entities": ["entity1", "entity2"],
    "intent": "what|why|how|when|who",
    "topic": "brief_topic_description"
}}

Question: {question}
"""