"""FastAPI backend for LLM Council."""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import json
import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Handle both direct execution and module import
if __name__ == "__main__":
    # Add parent directory to path for direct execution
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from backend import storage
    from backend.council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings
else:
    from . import storage
    from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings

app = FastAPI(title="LLM Council API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    mode: str = "Council"


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    mode: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API"}


@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations(mode: Optional[str] = Query(None, description="Filter by mode")):
    """List all conversations (metadata only). Optionally filter by mode."""
    return storage.list_conversations(mode=mode)


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    conversation_id = str(uuid.uuid4())
    conversation = storage.create_conversation(conversation_id, mode=request.mode)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content)

    # If this is the first message, generate a title
    if is_first_message:
        title = await generate_conversation_title(request.content)
        storage.update_conversation_title(conversation_id, title)

    # Run the 3-stage council process
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content
    )

    # Add assistant message with all stages
    storage.add_assistant_message(
        conversation_id,
        stage1_results,
        stage2_results,
        stage3_result,
        aggregate_rankings=metadata.get("aggregate_rankings"),
        label_to_model=metadata.get("label_to_model")
    )

    # Return the complete response with metadata
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    async def event_generator():
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content))

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Save complete assistant message
            storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result,
                aggregate_rankings=aggregate_rankings,
                label_to_model=label_to_model
            )

            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    deleted = storage.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted", "id": conversation_id}


@app.get("/api/conversations/{conversation_id}/export")
async def export_conversation(conversation_id: str):
    """Export a conversation as a text file."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Format conversation as text
    lines = []
    lines.append("=" * 80)
    lines.append(f"Conversation: {conversation.get('title', 'Untitled')}")
    lines.append(f"Mode: {conversation.get('mode', 'Council')}")
    lines.append(f"Created: {conversation.get('created_at', 'Unknown')}")
    lines.append("=" * 80)
    lines.append("")
    
    for msg in conversation.get("messages", []):
        if msg.get("role") == "user":
            lines.append(f"\n[USER]")
            lines.append(msg.get("content", ""))
            lines.append("")
        elif msg.get("role") == "assistant":
            lines.append(f"\n[ASSISTANT]")
            
            # Stage 1: Individual Responses
            if msg.get("stage1"):
                lines.append("\n--- Stage 1: Individual Responses ---")
                for idx, response in enumerate(msg.get("stage1", []), 1):
                    model = response.get("model", "Unknown")
                    lines.append(f"\n{idx}. {model}:")
                    lines.append(response.get("response", ""))
                lines.append("")
            
            # Aggregate Rankings
            if msg.get("aggregate_rankings"):
                lines.append("\n--- Aggregate Rankings ---")
                for idx, ranking in enumerate(msg.get("aggregate_rankings", []), 1):
                    model = ranking.get("model", "Unknown")
                    avg_rank = ranking.get("average_rank", 0)
                    count = ranking.get("rankings_count", 0)
                    lines.append(f"{idx}. {model}: Average Rank {avg_rank:.2f} (from {count} rankings)")
                lines.append("")
            
            # Stage 2: Peer Rankings
            if msg.get("stage2"):
                lines.append("\n--- Stage 2: Peer Rankings ---")
                for ranking in msg.get("stage2", []):
                    model = ranking.get("model", "Unknown")
                    lines.append(f"\n{model}:")
                    lines.append(ranking.get("ranking", ""))
                lines.append("")
            
            # Stage 3: Final Answer
            if msg.get("stage3"):
                lines.append("\n--- Stage 3: Final Synthesized Answer ---")
                stage3 = msg.get("stage3", {})
                model = stage3.get("model", "Unknown")
                lines.append(f"Model: {model}")
                lines.append("")
                lines.append(stage3.get("response", ""))
                lines.append("")
            
            lines.append("-" * 80)
    
    text_content = "\n".join(lines)
    
    # Return as downloadable text file
    return Response(
        content=text_content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="conversation_{conversation_id}.txt"'
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
