import os
import json
import logging
from typing import Dict, List, Optional
from anthropic import Anthropic
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

class ClaudeService:
    def __init__(self):
        self.api_key = os.environ.get('CLAUDE_API_KEY')
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY environment variable is required")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-3-5-sonnet-20241022"
    
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

Guidelines:
- Generate 15-30 suggestions per category
- Make suggestions realistic and commonly searched
- Include variations in tense and structure
- For alphabetical, create meaningful combinations for most letters
- Focus on what real people would actually search for
- Consider commercial intent, informational queries, and navigational searches

Return ONLY the JSON object, no other text. Format:
{{
  "questions": ["how to {search_term}", "what is {search_term}", ...],
  "prepositions": ["{search_term} for beginners", "{search_term} with examples", ...],
  "comparisons": ["{search_term} vs alternatives", "{search_term} or something else", ...],
  "alphabetical": ["affordable {search_term}", "best {search_term}", ...]
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
                
                # Ensure all values are lists
                for key in required_keys:
                    if not isinstance(suggestions[key], list):
                        suggestions[key] = []
                
                logger.info(f"Successfully generated {sum(len(v) for v in suggestions.values())} suggestions")
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
                f"what is {search_term}",
                f"how to use {search_term}",
                f"why {search_term} matters",
                f"where to find {search_term}",
                f"when to use {search_term}",
                f"who uses {search_term}",
                f"how {search_term} works",
                f"what {search_term} benefits",
                f"is {search_term} worth it",
                f"can {search_term} help"
            ],
            "prepositions": [
                f"{search_term} for beginners",
                f"{search_term} with examples",
                f"{search_term} without experience",
                f"{search_term} to improve",
                f"{search_term} from scratch",
                f"{search_term} near me",
                f"{search_term} like alternatives",
                f"{search_term} versus competitors",
                f"{search_term} about basics",
                f"{search_term} under budget"
            ],
            "comparisons": [
                f"{search_term} vs alternatives",
                f"{search_term} or similar",
                f"{search_term} and related",
                f"{search_term} like options",
                f"{search_term} compared to others",
                f"{search_term} better than",
                f"alternatives vs {search_term}",
                f"similar to {search_term}",
                f"{search_term} different from",
                f"{search_term} versus best"
            ],
            "alphabetical": [
                f"affordable {search_term}",
                f"best {search_term}",
                f"cheap {search_term}",
                f"digital {search_term}",
                f"easy {search_term}",
                f"free {search_term}",
                f"good {search_term}",
                f"help with {search_term}",
                f"improve {search_term}",
                f"just {search_term}"
            ]
        }

# Global instance
claude_service = ClaudeService()