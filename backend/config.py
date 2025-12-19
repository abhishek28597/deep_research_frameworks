"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "ENTER_YOUR_GROQ_API_KEY_HERE")

# Council members - list of Groq model identifiers
COUNCIL_MODELS = [
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
    "moonshotai/kimi-k2-instruct-0905"
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "openai/gpt-oss-120b"

# DxO (Decision by Experts) agents
LEAD_RESEARCH_MODEL = "openai/gpt-oss-20b"  # Breadth-first research
CRITIC_MODEL = "moonshotai/kimi-k2-instruct-0905"  # Critiques research
DOMAIN_EXPERT_MODEL = "llama-3.1-8b-instant"  # Domain expertise
AGGREGATOR_MODEL = "openai/gpt-oss-120b"  # Synthesizes final response

# Data directory for conversation storage
# Use absolute path for Docker compatibility
DATA_DIR = os.getenv("DATA_DIR", "data/conversations")
# Ensure it's an absolute path if not already
if not os.path.isabs(DATA_DIR):
    DATA_DIR = os.path.join(os.getcwd(), DATA_DIR)
