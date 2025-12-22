"""Super Chat Parallel Mode - Council and DxO run in parallel, then aggregated."""

from typing import List, Dict, Any, Tuple, Optional
import asyncio
from .council import run_full_council
from .DxO import run_full_dxo
from .groq_client import query_model
from .config import SUPER_AGGREGATOR_MODEL


async def run_parallel_superchat(
    user_query: str,
    council_user_instructions: Optional[Dict[str, str]] = None,
    council_chairman_instruction: Optional[str] = None,
    dxo_user_instructions: Optional[Dict[str, str]] = None
) -> Tuple[List, List, Dict, Dict, Dict, Dict, Dict, Dict]:
    """
    Run parallel Super Chat: Council || DxO → Super Aggregator.
    
    Args:
        user_query: The user's research question
        council_user_instructions: Optional dict mapping council model ID to instruction
        council_chairman_instruction: Optional instruction for chairman model
        dxo_user_instructions: Optional dict with keys: lead_research, critic, domain_expert, aggregator
        
    Returns:
        Tuple of (council_stage1, council_stage2, council_stage3,
                 dxo_stage1, dxo_stage2, dxo_stage3, dxo_stage4,
                 super_aggregator_result)
    """
    # Run Council and DxO in parallel
    council_task = run_full_council(
        user_query,
        user_instructions=council_user_instructions,
        chairman_instruction=council_chairman_instruction
    )
    dxo_task = run_full_dxo(user_query, user_instructions=dxo_user_instructions)
    
    # Wait for both to complete
    council_result, dxo_result = await asyncio.gather(council_task, dxo_task)
    
    council_stage1, council_stage2, council_stage3, council_metadata = council_result
    dxo_stage1, dxo_stage2, dxo_stage3, dxo_stage4 = dxo_result
    
    # If either failed, return with error
    if not council_stage1 or council_stage3.get('response', '').startswith('Error:'):
        return council_stage1, council_stage2, council_stage3, dxo_stage1, dxo_stage2, dxo_stage3, dxo_stage4, {
            "model": "error",
            "response": "Council process failed. Please try again."
        }
    
    if dxo_stage1.get('response', '').startswith("Error:"):
        return council_stage1, council_stage2, council_stage3, dxo_stage1, dxo_stage2, dxo_stage3, dxo_stage4, {
            "model": "error",
            "response": "DxO process failed. Please try again."
        }
    
    # Run Super Aggregator to combine both results
    super_aggregator_result = await run_super_aggregator(
        user_query,
        council_stage3,
        dxo_stage4
    )
    
    return council_stage1, council_stage2, council_stage3, dxo_stage1, dxo_stage2, dxo_stage3, dxo_stage4, super_aggregator_result


async def run_super_aggregator(
    user_query: str,
    council_result: Dict[str, Any],
    dxo_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Super Aggregator combines Council and DxO results into final answer.
    
    Args:
        user_query: The original user query
        council_result: Council's final synthesized answer (stage3)
        dxo_result: DxO's final synthesized answer (stage4)
        
    Returns:
        Dict with 'model' and 'response' keys containing aggregated result
    """
    aggregation_prompt = f"""You are a Super Aggregator responsible for synthesizing answers from two different AI frameworks into the most accurate and comprehensive final answer.

Original Question: {user_query}

COUNCIL FRAMEWORK ANSWER:
The Council framework uses multiple AI models that provide individual responses, rank each other's responses, and then synthesize a final answer through a Chairman model.

Council's Final Answer:
{council_result.get('response', '')}

DxO FRAMEWORK ANSWER:
The DxO (Decision by Experts) framework uses a sequential process: Lead Research → Critic Analysis → Domain Expert → Aggregator.

DxO's Final Answer:
{dxo_result.get('response', '')}

Your task as Super Aggregator is to:
1. Analyze both answers for accuracy, completeness, and quality
2. Identify areas where both frameworks agree (high confidence)
3. Identify areas where they disagree (need careful evaluation)
4. Identify complementary insights that each framework provides
5. Synthesize the most accurate findings by:
   - Prioritizing information that both frameworks agree on
   - Carefully evaluating disagreements and choosing the more accurate perspective
   - Combining unique insights from each framework
   - Eliminating any wrong facts or inaccuracies
   - Ensuring comprehensive coverage of the topic
6. Create a unified, well-structured final answer that represents the best synthesis of both frameworks
7. Clearly indicate when information comes from agreement between frameworks (high confidence) vs. when it's a synthesis of different perspectives

Provide your synthesized final answer that combines the best of both frameworks:"""

    messages = [{"role": "user", "content": aggregation_prompt}]

    response = await query_model(SUPER_AGGREGATOR_MODEL, messages, max_completion_tokens=4000)

    if response is None:
        return {
            "model": SUPER_AGGREGATOR_MODEL,
            "response": "Error: Super Aggregator failed to synthesize final response."
        }

    return {
        "model": SUPER_AGGREGATOR_MODEL,
        "response": response.get('content', '')
    }

