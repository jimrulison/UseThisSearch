import os
import json
import logging
from typing import Dict, List, Optional
from anthropic import Anthropic
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

class ClaudeService:
    _instance = None
    
    def __init__(self):
        self.api_key = os.environ.get('CLAUDE_API_KEY')
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY environment variable is required")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-3-5-sonnet-20241022"
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def async_to_sync(func):
        """Decorator to run async functions in sync context"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            if loop.is_running():
                # If loop is already running, create a new one
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, func(*args, **kwargs))
                    return future.result()
            else:
                return loop.run_until_complete(func(*args, **kwargs))
        return wrapper
    
    @async_to_sync
    async def generate_suggestions(self, search_term: str) -> Dict[str, List[str]]:
        """Generate AnswerThePublic-style suggestions using Claude"""
        
        try:
            prompt = f"""You are an expert keyword research tool similar to AnswerThePublic. Generate comprehensive question and phrase suggestions for the keyword: "{search_term}"

Please return your response as a valid JSON object with exactly these 4 categories:

1. "questions" - Questions people ask (who, what, where, when, why, how, will, can, are, is, do, does)
2. "prepositions" - Phrases with prepositions (for, with, without, to, from, near, like, versus, against, about, under, over)
3. "comparisons" - Comparison phrases (vs, versus, or, and, like, similar to, compared to, better than, different from)
4. "alphabetical" - Alphabetical combinations (terms that start with each letter A-Z combined with the search term)

IMPORTANT POPULARITY RANKING REQUIREMENTS:
- For each suggestion, estimate its search popularity based on real-world search behavior
- Consider commercial intent, trending topics, common pain points, and general user interest
- Include a popularity level for each suggestion: "HIGH", "MEDIUM", or "LOW"
- Order suggestions within each category by popularity (HIGH first, then MEDIUM, then LOW)
- Aim for roughly: 30% HIGH, 50% MEDIUM, 20% LOW distribution per category

Guidelines:
- Generate 20-30 suggestions per category
- Make suggestions realistic and commonly searched
- Include variations in tense and structure
- For alphabetical, create meaningful combinations for most letters
- Focus on what real people would actually search for
- Consider commercial intent, informational queries, and navigational searches
- HIGH popularity = Very commonly searched, broad appeal, commercial intent
- MEDIUM popularity = Moderately searched, specific interest, informational
- LOW popularity = Niche searches, specific scenarios, long-tail queries

Return ONLY the JSON object with this exact format:
{{
  "questions": [
    {{"text": "how to {search_term}", "popularity": "HIGH"}},
    {{"text": "what is {search_term}", "popularity": "HIGH"}},
    {{"text": "when to use {search_term}", "popularity": "MEDIUM"}},
    ...
  ],
  "prepositions": [
    {{"text": "{search_term} for beginners", "popularity": "HIGH"}},
    {{"text": "{search_term} with examples", "popularity": "MEDIUM"}},
    ...
  ],
  "comparisons": [
    {{"text": "{search_term} vs alternatives", "popularity": "HIGH"}},
    {{"text": "{search_term} or something else", "popularity": "MEDIUM"}},
    ...
  ],
  "alphabetical": [
    {{"text": "affordable {search_term}", "popularity": "HIGH"}},
    {{"text": "best {search_term}", "popularity": "HIGH"}},
    {{"text": "cheap {search_term}", "popularity": "MEDIUM"}},
    ...
  ]
}}"""

            logger.info(f"Generating suggestions for: {search_term}")
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            # Extract the JSON from Claude's response
            response_text = response.content[0].text.strip()
            
            # Clean up the response to ensure it's valid JSON
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '').strip()
            
            try:
                suggestions = json.loads(response_text)
                
                # Validate the structure
                required_keys = ['questions', 'prepositions', 'comparisons', 'alphabetical']
                if not all(key in suggestions for key in required_keys):
                    raise ValueError("Missing required categories in Claude response")
                
                # Ensure all values are lists and convert to new format if needed
                for key in required_keys:
                    if not isinstance(suggestions[key], list):
                        suggestions[key] = []
                    
                    # Handle both old format (strings) and new format (objects with popularity)
                    converted_suggestions = []
                    for item in suggestions[key]:
                        if isinstance(item, str):
                            # Old format - assign default popularity
                            converted_suggestions.append({
                                "text": item,
                                "popularity": "MEDIUM"
                            })
                        elif isinstance(item, dict) and "text" in item and "popularity" in item:
                            # New format - use as is
                            converted_suggestions.append(item)
                        else:
                            # Invalid format - skip
                            continue
                    
                    suggestions[key] = converted_suggestions
                
                # Sort each category by popularity (HIGH -> MEDIUM -> LOW)
                popularity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
                for key in required_keys:
                    suggestions[key].sort(key=lambda x: popularity_order.get(x.get("popularity", "MEDIUM"), 1))
                
                total_suggestions = sum(len(suggestions[key]) for key in required_keys)
                logger.info(f"Successfully generated {total_suggestions} suggestions with popularity rankings")
                return suggestions
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Claude response as JSON: {e}")
                logger.error(f"Response text: {response_text}")
                return self._get_fallback_suggestions(search_term)
        
        except Exception as e:
            logger.error(f"Error generating suggestions with Claude: {e}")
            return self._get_fallback_suggestions(search_term)
    
    def _get_fallback_suggestions(self, search_term: str) -> Dict[str, List[str]]:
        """Fallback suggestions if Claude API fails"""
        return {
            "questions": [
                {"text": f"what is {search_term}", "popularity": "HIGH"},
                {"text": f"how to use {search_term}", "popularity": "HIGH"},
                {"text": f"why {search_term} matters", "popularity": "MEDIUM"},
                {"text": f"where to find {search_term}", "popularity": "MEDIUM"},
                {"text": f"when to use {search_term}", "popularity": "MEDIUM"},
                {"text": f"who uses {search_term}", "popularity": "LOW"},
                {"text": f"how {search_term} works", "popularity": "MEDIUM"},
                {"text": f"what {search_term} benefits", "popularity": "MEDIUM"},
                {"text": f"is {search_term} worth it", "popularity": "LOW"},
                {"text": f"can {search_term} help", "popularity": "LOW"}
            ],
            "prepositions": [
                {"text": f"{search_term} for beginners", "popularity": "HIGH"},
                {"text": f"{search_term} with examples", "popularity": "HIGH"},
                {"text": f"{search_term} without experience", "popularity": "MEDIUM"},
                {"text": f"{search_term} to improve", "popularity": "MEDIUM"},
                {"text": f"{search_term} from scratch", "popularity": "MEDIUM"},
                {"text": f"{search_term} near me", "popularity": "MEDIUM"},
                {"text": f"{search_term} like alternatives", "popularity": "LOW"},
                {"text": f"{search_term} versus competitors", "popularity": "LOW"},
                {"text": f"{search_term} about basics", "popularity": "LOW"},
                {"text": f"{search_term} under budget", "popularity": "MEDIUM"}
            ],
            "comparisons": [
                {"text": f"{search_term} vs alternatives", "popularity": "HIGH"},
                {"text": f"{search_term} or similar", "popularity": "HIGH"},
                {"text": f"{search_term} and related", "popularity": "MEDIUM"},
                {"text": f"{search_term} like options", "popularity": "MEDIUM"},
                {"text": f"{search_term} compared to others", "popularity": "MEDIUM"},
                {"text": f"{search_term} better than", "popularity": "LOW"},
                {"text": f"alternatives vs {search_term}", "popularity": "LOW"},
                {"text": f"similar to {search_term}", "popularity": "LOW"},
                {"text": f"{search_term} different from", "popularity": "LOW"},
                {"text": f"{search_term} versus best", "popularity": "MEDIUM"}
            ],
            "alphabetical": [
                {"text": f"affordable {search_term}", "popularity": "HIGH"},
                {"text": f"best {search_term}", "popularity": "HIGH"},
                {"text": f"cheap {search_term}", "popularity": "HIGH"},
                {"text": f"digital {search_term}", "popularity": "MEDIUM"},
                {"text": f"easy {search_term}", "popularity": "MEDIUM"},
                {"text": f"free {search_term}", "popularity": "HIGH"},
                {"text": f"good {search_term}", "popularity": "MEDIUM"},
                {"text": f"help with {search_term}", "popularity": "MEDIUM"},
                {"text": f"improve {search_term}", "popularity": "LOW"},
                {"text": f"just {search_term}", "popularity": "LOW"}
            ]
        }

# Function to get the service instance (lazy loading)
def get_claude_service():
    return ClaudeService.get_instance()