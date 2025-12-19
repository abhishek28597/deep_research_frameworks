"""DxO (Decision by Experts) - A 4-stage decision-making framework."""

from typing import List, Dict, Any, Tuple
from .groq_client import query_model
from .config import (
    LEAD_RESEARCH_MODEL,
    CRITIC_MODEL,
    DOMAIN_EXPERT_MODEL,
    AGGREGATOR_MODEL
)


async def stage1_lead_research(user_query: str, user_instruction: str = None) -> Dict[str, Any]:
    """
    Stage 1: Lead Research agent performs breadth-first research.

    Args:
        user_query: The user's question
        user_instruction: Optional user-provided instruction for this agent

    Returns:
        Dict with 'model' and 'response' keys
    """
    research_prompt = f"""You are a Lead Research Agent specializing in breadth-first research. 
Your task is to conduct comprehensive, wide-ranging research on the following question.

Question: {user_query}

Your research approach should:
1. Explore multiple angles and perspectives on the topic
2. Identify key concepts, related topics, and important considerations
3. Gather broad information without diving too deep into any single aspect
4. Consider various viewpoints and potential implications
5. Structure your findings clearly and comprehensively

Provide a thorough, well-organized research report that covers the breadth of the topic:"""
    
    if user_instruction:
        research_prompt += f"\n\nAdditional User Instruction:\n{user_instruction}"

    messages = [{"role": "user", "content": research_prompt}]

    response = await query_model(LEAD_RESEARCH_MODEL, messages, max_completion_tokens=3000)

    if response is None:
        return {
            "model": LEAD_RESEARCH_MODEL,
            "response": "Error: Lead Research agent failed to respond."
        }

    return {
        "model": LEAD_RESEARCH_MODEL,
        "response": response.get('content', '')
    }


async def stage2_critic_analysis(
    user_query: str,
    research_result: Dict[str, Any],
    user_instruction: str = None
) -> Dict[str, Any]:
    """
    Stage 2: Critic agent analyzes and critiques the research.

    Args:
        user_query: The original user query
        research_result: Research results from Stage 1
        user_instruction: Optional user-provided instruction for this agent

    Returns:
        Dict with 'model' and 'response' keys containing critique
    """
    critique_prompt = f"""You are a Critic Agent with expertise in critical analysis and evaluation.
Your task is to critically evaluate the research conducted on the following question.

Original Question: {user_query}

Research Findings:
{research_result.get('response', '')}

Your critical analysis should:
1. Identify strengths and weaknesses in the research
2. Point out any gaps, missing perspectives, or overlooked aspects
3. Evaluate the quality, depth, and comprehensiveness of the research
4. Highlight any potential biases, assumptions, or limitations
5. Suggest areas that need further investigation or clarification
6. Assess the reliability and validity of the findings

Provide a thorough critical analysis:"""
    
    if user_instruction:
        critique_prompt += f"\n\nAdditional User Instruction:\n{user_instruction}"

    messages = [{"role": "user", "content": critique_prompt}]

    response = await query_model(CRITIC_MODEL, messages, max_completion_tokens=2000)

    if response is None:
        return {
            "model": CRITIC_MODEL,
            "response": "Error: Critic agent failed to respond."
        }

    return {
        "model": CRITIC_MODEL,
        "response": response.get('content', '')
    }


async def stage3_domain_expertise(
    user_query: str,
    research_result: Dict[str, Any],
    critique_result: Dict[str, Any],
    user_instruction: str = None
) -> Dict[str, Any]:
    """
    Stage 3: Domain Expert provides specialized domain expertise.

    Args:
        user_query: The original user query
        research_result: Research results from Stage 1
        critique_result: Critique from Stage 2
        user_instruction: Optional user-provided instruction for this agent

    Returns:
        Dict with 'model' and 'response' keys containing domain expertise
    """
    expert_prompt = f"""You are a Domain Expert Agent with deep specialized knowledge in relevant domains.
Your task is to provide expert insights and domain-specific expertise on the following question.

Original Question: {user_query}

Research Findings:
{research_result.get('response', '')}

Critical Analysis:
{critique_result.get('response', '')}

Your domain expertise should:
1. Provide specialized knowledge and insights relevant to the question
2. Apply domain-specific frameworks, methodologies, or best practices
3. Address the gaps and concerns raised in the critical analysis
4. Offer expert recommendations based on your domain knowledge
5. Consider practical implications and real-world applications
6. Integrate your expertise with the research findings and critique

Provide your expert analysis and recommendations:"""
    
    if user_instruction:
        expert_prompt += f"\n\nAdditional User Instruction:\n{user_instruction}"

    messages = [{"role": "user", "content": expert_prompt}]

    response = await query_model(DOMAIN_EXPERT_MODEL, messages, max_completion_tokens=2000)

    if response is None:
        return {
            "model": DOMAIN_EXPERT_MODEL,
            "response": "Error: Domain Expert agent failed to respond."
        }

    return {
        "model": DOMAIN_EXPERT_MODEL,
        "response": response.get('content', '')
    }


async def stage4_aggregate_synthesis(
    user_query: str,
    research_result: Dict[str, Any],
    critique_result: Dict[str, Any],
    expert_result: Dict[str, Any],
    user_instruction: str = None
) -> Dict[str, Any]:
    """
    Stage 4: Aggregator synthesizes all inputs into final response.

    Args:
        user_query: The original user query
        research_result: Research results from Stage 1
        critique_result: Critique from Stage 2
        expert_result: Domain expertise from Stage 3
        user_instruction: Optional user-provided instruction for this agent

    Returns:
        Dict with 'model' and 'response' keys containing final synthesis
    """
    synthesis_prompt = f"""You are an Aggregator Agent responsible for synthesizing multiple expert inputs into a coherent, comprehensive final answer.

Original Question: {user_query}

STAGE 1 - Lead Research Findings:
{research_result.get('response', '')}

STAGE 2 - Critical Analysis:
{critique_result.get('response', '')}

STAGE 3 - Domain Expert Insights:
{expert_result.get('response', '')}

Your task as Aggregator is to:
1. Synthesize all three inputs into a unified, comprehensive answer
2. Integrate the research findings, critical insights, and domain expertise
3. Address the original question with the full context from all stages
4. Resolve any contradictions or conflicts between the different perspectives
5. Create a clear, well-structured final response that leverages all inputs
6. Ensure the final answer is accurate, complete, and actionable

Provide your synthesized final answer:"""
    
    if user_instruction:
        synthesis_prompt += f"\n\nAdditional User Instruction:\n{user_instruction}"

    messages = [{"role": "user", "content": synthesis_prompt}]

    response = await query_model(AGGREGATOR_MODEL, messages, max_completion_tokens=4000)

    if response is None:
        return {
            "model": AGGREGATOR_MODEL,
            "response": "Error: Aggregator agent failed to synthesize final response."
        }

    return {
        "model": AGGREGATOR_MODEL,
        "response": response.get('content', '')
    }


async def generate_conversation_title(user_query: str) -> str:
    """
    Generate a short title for a conversation based on the first user message.

    Args:
        user_query: The first user message

    Returns:
        A short title (3-5 words)
    """
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    # Use llama-3.1-8b-instant for title generation (fast and cheap)
    response = await query_model("llama-3.1-8b-instant", messages, max_completion_tokens=50)

    if response is None:
        # Fallback to a generic title
        return "New Conversation"

    title = response.get('content', 'New Conversation').strip()

    # Clean up the title - remove quotes, limit length
    title = title.strip('"\'')

    # Truncate if too long
    if len(title) > 50:
        title = title[:47] + "..."

    return title


async def run_full_dxo(
    user_query: str,
    user_instructions: Dict[str, str] = None
) -> Tuple[Dict, Dict, Dict, Dict]:
    """
    Run the complete 4-stage DxO (Decision by Experts) process.

    Args:
        user_query: The user's question
        user_instructions: Optional dict with keys: 'lead_research', 'critic', 'domain_expert', 'aggregator'

    Returns:
        Tuple of (stage1_result, stage2_result, stage3_result, stage4_result)
    """
    if user_instructions is None:
        user_instructions = {}
    
    # Stage 1: Lead Research - breadth-first research
    stage1_result = await stage1_lead_research(
        user_query,
        user_instruction=user_instructions.get('lead_research')
    )

    # If research fails, return error
    if stage1_result.get('response', '').startswith("Error:"):
        return stage1_result, {}, {}, {
            "model": "error",
            "response": "Lead Research agent failed. Please try again."
        }

    # Stage 2: Critic - analyze and critique the research
    stage2_result = await stage2_critic_analysis(
        user_query,
        stage1_result,
        user_instruction=user_instructions.get('critic')
    )

    # Stage 3: Domain Expert - provide domain expertise
    stage3_result = await stage3_domain_expertise(
        user_query,
        stage1_result,
        stage2_result,
        user_instruction=user_instructions.get('domain_expert')
    )

    # Stage 4: Aggregator - synthesize final response
    stage4_result = await stage4_aggregate_synthesis(
        user_query,
        stage1_result,
        stage2_result,
        stage3_result,
        user_instruction=user_instructions.get('aggregator')
    )

    return stage1_result, stage2_result, stage3_result, stage4_result

