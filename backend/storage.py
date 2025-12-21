"""JSON-based storage for conversations."""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import DATA_DIR


def ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def get_conversation_path(conversation_id: str) -> str:
    """Get the file path for a conversation."""
    return os.path.join(DATA_DIR, f"{conversation_id}.json")


def create_conversation(conversation_id: str, mode: str = "Council") -> Dict[str, Any]:
    """
    Create a new conversation.

    Args:
        conversation_id: Unique identifier for the conversation
        mode: The mode/type of conversation (e.g., "Council", "Super Chat", etc.)

    Returns:
        New conversation dict
    """
    ensure_data_dir()

    conversation = {
        "id": conversation_id,
        "created_at": datetime.utcnow().isoformat(),
        "title": "New Conversation",
        "mode": mode,
        "messages": []
    }

    # Save to file
    path = get_conversation_path(conversation_id)
    with open(path, 'w') as f:
        json.dump(conversation, f, indent=2)

    return conversation


def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a conversation from storage.

    Args:
        conversation_id: Unique identifier for the conversation

    Returns:
        Conversation dict or None if not found
    """
    path = get_conversation_path(conversation_id)

    if not os.path.exists(path):
        return None

    with open(path, 'r') as f:
        return json.load(f)


def save_conversation(conversation: Dict[str, Any]):
    """
    Save a conversation to storage.

    Args:
        conversation: Conversation dict to save
    """
    ensure_data_dir()

    path = get_conversation_path(conversation['id'])
    with open(path, 'w') as f:
        json.dump(conversation, f, indent=2)


def list_conversations(mode: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only).

    Args:
        mode: Optional mode filter to only return conversations of a specific mode

    Returns:
        List of conversation metadata dicts
    """
    ensure_data_dir()

    conversations = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            path = os.path.join(DATA_DIR, filename)
            with open(path, 'r') as f:
                data = json.load(f)
                # Filter by mode if specified
                if mode and data.get("mode") != mode:
                    continue
                # Return metadata only
                conversations.append({
                    "id": data["id"],
                    "created_at": data["created_at"],
                    "title": data.get("title", "New Conversation"),
                    "mode": data.get("mode", "Council"),  # Default to Council for backward compatibility
                    "message_count": len(data["messages"])
                })

    # Sort by creation time, newest first
    conversations.sort(key=lambda x: x["created_at"], reverse=True)

    return conversations


def delete_conversation(conversation_id: str) -> bool:
    """
    Delete a conversation.

    Args:
        conversation_id: Unique identifier for the conversation

    Returns:
        True if deleted, False if not found
    """
    path = get_conversation_path(conversation_id)
    
    if not os.path.exists(path):
        return False
    
    os.remove(path)
    return True


def add_user_message(conversation_id: str, content: str):
    """
    Add a user message to a conversation.

    Args:
        conversation_id: Conversation identifier
        content: User message content
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "user",
        "content": content
    })

    save_conversation(conversation)


def add_assistant_message(
    conversation_id: str,
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any],
    aggregate_rankings: Optional[List[Dict[str, Any]]] = None,
    label_to_model: Optional[Dict[str, str]] = None
):
    """
    Add an assistant message with all 3 stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
        aggregate_rankings: Optional aggregate rankings data
        label_to_model: Optional label to model mapping
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    message = {
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3
    }
    
    # Add optional metadata if provided
    if aggregate_rankings is not None:
        message["aggregate_rankings"] = aggregate_rankings
    if label_to_model is not None:
        message["label_to_model"] = label_to_model

    conversation["messages"].append(message)

    save_conversation(conversation)


def add_dxo_assistant_message(
    conversation_id: str,
    stage1: Dict[str, Any],
    stage2: Dict[str, Any],
    stage3: Dict[str, Any],
    stage4: Dict[str, Any]
):
    """
    Add an assistant message with all 4 DxO stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: Lead Research result
        stage2: Critic result
        stage3: Domain Expert result
        stage4: Aggregator result
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    message = {
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3,
        "stage4": stage4
    }

    conversation["messages"].append(message)

    save_conversation(conversation)


def add_superchat_assistant_message(
    conversation_id: str,
    execution_mode: str,
    council_stage1: List[Dict[str, Any]],
    council_stage2: List[Dict[str, Any]],
    council_stage3: Dict[str, Any],
    dxo_stage1: Dict[str, Any],
    dxo_stage2: Dict[str, Any],
    dxo_stage3: Dict[str, Any],
    dxo_stage4: Dict[str, Any],
    super_aggregator: Optional[Dict[str, Any]] = None,
    council_metadata: Optional[Dict[str, Any]] = None
):
    """
    Add an assistant message for Super Chat (sequential or parallel mode).

    Args:
        conversation_id: Conversation identifier
        execution_mode: "sequential" or "parallel"
        council_stage1: Council Stage 1 results
        council_stage2: Council Stage 2 results
        council_stage3: Council Stage 3 result
        dxo_stage1: DxO Stage 1 result
        dxo_stage2: DxO Stage 2 result
        dxo_stage3: DxO Stage 3 result
        dxo_stage4: DxO Stage 4 result
        super_aggregator: Super Aggregator result (only for parallel mode)
        council_metadata: Optional Council metadata (aggregate_rankings, label_to_model)
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    message = {
        "role": "assistant",
        "execution_mode": execution_mode,
        "council": {
            "stage1": council_stage1,
            "stage2": council_stage2,
            "stage3": council_stage3
        },
        "dxo": {
            "stage1": dxo_stage1,
            "stage2": dxo_stage2,
            "stage3": dxo_stage3,
            "stage4": dxo_stage4
        }
    }
    
    # Add Council metadata if provided
    if council_metadata:
        if "aggregate_rankings" in council_metadata:
            message["council"]["aggregate_rankings"] = council_metadata["aggregate_rankings"]
        if "label_to_model" in council_metadata:
            message["council"]["label_to_model"] = council_metadata["label_to_model"]
    
    # Add Super Aggregator result for parallel mode
    if super_aggregator is not None:
        message["super_aggregator"] = super_aggregator

    conversation["messages"].append(message)
    save_conversation(conversation)


def update_conversation_title(conversation_id: str, title: str):
    """
    Update the title of a conversation.

    Args:
        conversation_id: Conversation identifier
        title: New title for the conversation
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["title"] = title
    save_conversation(conversation)
