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
    from backend.DxO import run_full_dxo, generate_conversation_title as generate_dxo_title, stage1_lead_research, stage2_critic_analysis, stage3_domain_expertise, stage4_aggregate_synthesis
else:
    from . import storage
    from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings
    from .DxO import run_full_dxo, generate_conversation_title as generate_dxo_title, stage1_lead_research, stage2_critic_analysis, stage3_domain_expertise, stage4_aggregate_synthesis

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
    user_instructions: Optional[Dict[str, str]] = None  # For DxO mode: keys: lead_research, critic, domain_expert, aggregator


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
    Send a message and run the appropriate process based on conversation mode.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    mode = conversation.get("mode", "Council")
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content)

    # Generate title based on mode
    if is_first_message:
        if mode == "DxO":
            title = await generate_dxo_title(request.content)
        else:
            title = await generate_conversation_title(request.content)
        storage.update_conversation_title(conversation_id, title)

    # Route to appropriate handler based on mode
    if mode == "DxO":
        # Run the 4-stage DxO process
        stage1_result, stage2_result, stage3_result, stage4_result = await run_full_dxo(
            request.content,
            user_instructions=request.user_instructions
        )

        # Add assistant message with all stages
        storage.add_dxo_assistant_message(
            conversation_id,
            stage1_result,
            stage2_result,
            stage3_result,
            stage4_result
        )

        # Return the complete response
        return {
            "stage1": stage1_result,
            "stage2": stage2_result,
            "stage3": stage3_result,
            "stage4": stage4_result
        }
    else:
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
    Send a message and stream the appropriate process based on conversation mode.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    mode = conversation.get("mode", "Council")
    is_first_message = len(conversation["messages"]) == 0

    async def event_generator():
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                if mode == "DxO":
                    title_task = asyncio.create_task(generate_dxo_title(request.content))
                else:
                    title_task = asyncio.create_task(generate_conversation_title(request.content))

            if mode == "DxO":
                # DxO 4-stage process
                # Stage 1: Lead Research
                yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
                stage1_result = await stage1_lead_research(
                    request.content,
                    user_instruction=request.user_instructions.get('lead_research') if request.user_instructions else None
                )
                yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_result})}\n\n"

                # Stage 2: Critic
                yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
                stage2_result = await stage2_critic_analysis(
                    request.content,
                    stage1_result,
                    user_instruction=request.user_instructions.get('critic') if request.user_instructions else None
                )
                yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_result})}\n\n"

                # Stage 3: Domain Expert
                yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
                stage3_result = await stage3_domain_expertise(
                    request.content,
                    stage1_result,
                    stage2_result,
                    user_instruction=request.user_instructions.get('domain_expert') if request.user_instructions else None
                )
                yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

                # Stage 4: Aggregator
                yield f"data: {json.dumps({'type': 'stage4_start'})}\n\n"
                stage4_result = await stage4_aggregate_synthesis(
                    request.content,
                    stage1_result,
                    stage2_result,
                    stage3_result,
                    user_instruction=request.user_instructions.get('aggregator') if request.user_instructions else None
                )
                yield f"data: {json.dumps({'type': 'stage4_complete', 'data': stage4_result})}\n\n"

                # Save complete assistant message
                storage.add_dxo_assistant_message(
                    conversation_id,
                    stage1_result,
                    stage2_result,
                    stage3_result,
                    stage4_result
                )
            else:
                # Council 3-stage process
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

                # Save complete assistant message
                storage.add_assistant_message(
                    conversation_id,
                    stage1_results,
                    stage2_results,
                    stage3_result,
                    aggregate_rankings=aggregate_rankings,
                    label_to_model=label_to_model
                )

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

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
            
            if mode == "DxO":
                # DxO format: 4 stages
                # Stage 1: Lead Research
                if msg.get("stage1"):
                    stage1 = msg.get("stage1", {})
                    model = stage1.get("model", "Unknown")
                    lines.append("\n--- Stage 1: Lead Research ---")
                    lines.append(f"Model: {model}")
                    lines.append("")
                    lines.append(stage1.get("response", ""))
                    lines.append("")
                
                # Stage 2: Critic
                if msg.get("stage2"):
                    stage2 = msg.get("stage2", {})
                    model = stage2.get("model", "Unknown")
                    lines.append("\n--- Stage 2: Critic Analysis ---")
                    lines.append(f"Model: {model}")
                    lines.append("")
                    lines.append(stage2.get("response", ""))
                    lines.append("")
                
                # Stage 3: Domain Expert
                if msg.get("stage3"):
                    stage3 = msg.get("stage3", {})
                    model = stage3.get("model", "Unknown")
                    lines.append("\n--- Stage 3: Domain Expert ---")
                    lines.append(f"Model: {model}")
                    lines.append("")
                    lines.append(stage3.get("response", ""))
                    lines.append("")
                
                # Stage 4: Aggregator (Final)
                if msg.get("stage4"):
                    stage4 = msg.get("stage4", {})
                    model = stage4.get("model", "Unknown")
                    lines.append("\n--- Stage 4: Final Synthesized Answer (Aggregator) ---")
                    lines.append(f"Model: {model}")
                    lines.append("")
                    lines.append(stage4.get("response", ""))
                    lines.append("")
            else:
                # Council format: 3 stages
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
