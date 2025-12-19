"""Groq API client for making LLM requests."""

import asyncio
from typing import List, Dict, Any, Optional
from groq import Groq
from .config import GROQ_API_KEY


# Initialize Groq client
_client = None


def get_client() -> Groq:
    """Get or create the Groq client instance."""
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    max_completion_tokens: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via Groq API.

    Args:
        model: Groq model identifier (e.g., "llama-3.1-8b-instant")
        messages: List of message dicts with 'role' and 'content'
        max_completion_tokens: Optional max completion tokens limit

    Returns:
        Response dict with 'content' key, or None if failed
    """
    def _query():
        try:
            client = get_client()
            params = {
                "model": model,
                "messages": messages,
            }
            if max_completion_tokens:
                params["max_completion_tokens"] = max_completion_tokens
            
            chat_completion = client.chat.completions.create(**params)
            return {"content": chat_completion.choices[0].message.content}
        except Exception as e:
            print(f"Error querying model {model}: {e}")
            return None
    
    # Run synchronous call in thread pool
    return await asyncio.to_thread(_query)


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    max_completion_tokens: Optional[int] = None
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of Groq model identifiers
        messages: List of message dicts to send to each model
        max_completion_tokens: Optional max completion tokens limit

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    # Create tasks for all models
    tasks = [query_model(model, messages, max_completion_tokens) for model in models]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks, return_exceptions=True)

    # Map models to their responses
    result = {}
    for model, response in zip(models, responses):
        if isinstance(response, Exception):
            print(f"Exception for {model}: {str(response)}")
            result[model] = None
        else:
            result[model] = response

    return result

