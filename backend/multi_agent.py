"""Multi-agent system using Microsoft AutoGen with Groq API integration."""

import os
import sys
from typing import List, Dict, Any, Optional, Literal

# Import AutoGen components at the top
try:
    from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
except ImportError as e:
    print("ERROR: AutoGen package not installed!")
    print("Please install it using: pip install pyautogen")
    print(f"Or: pip install 'autogen-agentchat~=0.2'")
    print(f"Import error: {e}")
    sys.exit(1)

# Handle both standalone execution and module import
try:
    # Try relative import first (when used as a module)
    from .config import GROQ_API_KEY, COUNCIL_MODELS, CHAIRMAN_MODEL
except ImportError:
    # If that fails, try absolute import (when run as standalone script)
    # Add parent directory to path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(backend_dir)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    from backend.config import GROQ_API_KEY, COUNCIL_MODELS, CHAIRMAN_MODEL


def create_llm_config(model: str) -> Dict[str, Any]:
    """
    Create LLM configuration for AutoGen using Groq API.
    
    According to Groq documentation: https://console.groq.com/docs/autogen
    Use api_type: "groq" for proper Groq integration.
    """
    return {
        "config_list": [{
            "model": model,
            "api_key": GROQ_API_KEY,
            "api_type": "groq",
        }],
        "temperature": 0.7,
    }


def create_research_agent():
    """Create the Lead Research Agent."""
    return AssistantAgent(
        name="LeadResearchAgent",
        system_message="""You are a Lead Research Agent specializing in conducting comprehensive, breadth-first research.

Your role:
1. Given any user query, conduct initial broad research to gather foundational information
2. Explore multiple angles and perspectives on the topic
3. Identify key concepts, facts, and areas that need deeper investigation
4. Provide a structured research summary that covers the breadth of the topic
5. Highlight areas that may need domain expertise or critical evaluation

Your research should be thorough, well-organized, and set the foundation for further analysis by other agents.""",
        llm_config=create_llm_config(COUNCIL_MODELS[0]),  # openai/gpt-oss-20b
        human_input_mode="NEVER",
    )


def create_critic_agent():
    """Create the Critic Agent."""
    llm_config = create_llm_config(COUNCIL_MODELS[1])  # llama-3.1-8b-instant
    llm_config["temperature"] = 0.5  # Lower temperature for more focused critique
    
    return AssistantAgent(
        name="CriticAgent",
        system_message="""You are a Critic Agent specializing in evaluating and critiquing outputs against the original user query.

Your role:
1. Carefully review the original user query to understand what was asked
2. Evaluate any research or outputs provided against the query requirements
3. Identify gaps, inaccuracies, or areas where the output doesn't address the query
4. Provide constructive criticism and suggest improvements
5. Ensure the output is relevant, accurate, and complete
6. Point out any logical inconsistencies or missing information

Your critiques should be thorough, fair, and help improve the final answer quality.""",
        llm_config=llm_config,
        human_input_mode="NEVER",
    )


def create_domain_expert_agent():
    """Create the Domain Expert Agent."""
    return AssistantAgent(
        name="DomainExpertAgent",
        system_message="""You are a Domain Expert Agent with deep expertise across multiple domains.

Your role:
1. Analyze the user query to identify the relevant domain(s)
2. Provide domain-specific insights, best practices, and expert knowledge
3. Offer nuanced perspectives that general research might miss
4. Identify domain-specific considerations, constraints, or implications
5. Suggest domain-appropriate approaches or solutions
6. Highlight important domain-specific details that should be considered

Your expertise should add depth and domain-specific value to the research and analysis.""",
        llm_config=create_llm_config(COUNCIL_MODELS[2]),  # moonshotai/kimi-k2-instruct-0905
        human_input_mode="NEVER",
    )


def create_aggregator_agent():
    """Create the Aggregator Agent (Chairman)."""
    return AssistantAgent(
        name="AggregatorAgent",
        system_message="""You are the Aggregator Agent (Chairman) responsible for synthesizing all information into a final, comprehensive answer.

Your role:
1. Review all inputs: research findings, critiques, and domain expertise
2. Synthesize the information into a coherent, well-structured final answer
3. Address the original user query comprehensively
4. Incorporate valid critiques and improvements
5. Integrate domain expertise appropriately
6. Ensure the final answer is clear, accurate, complete, and actionable
7. Resolve any conflicts or contradictions between different inputs
8. Present the answer in a clear, professional format

Your final answer should represent the collective wisdom of all agents and fully address the user's query.""",
        llm_config=create_llm_config(CHAIRMAN_MODEL),  # openai/gpt-oss-120b
        human_input_mode="NEVER",
    )


def create_user_proxy():
    """Create the User Proxy Agent."""
    return UserProxyAgent(
        name="UserProxy",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=10,
        is_termination_msg=lambda x: x.get("content", "").strip().endswith("TERMINATE") or 
                                    "TERMINATE" in x.get("content", "").upper(),
        code_execution_config=False,  # Disable code execution for this use case
    )


def run_sequential_flow(user_query: str) -> Dict[str, Any]:
    """
    Run the multi-agent system in sequential mode.
    
    Args:
        user_query: The user's question
        
    Returns:
        Dictionary with final answer and intermediate results
    """
    print("=" * 80)
    print("Running Sequential Flow")
    print("=" * 80)
    
    # Create agents
    research_agent = create_research_agent()
    critic_agent = create_critic_agent()
    expert_agent = create_domain_expert_agent()
    aggregator_agent = create_aggregator_agent()
    user_proxy = create_user_proxy()
    
    results = {
        "flow_mode": "sequential",
        "user_query": user_query,
        "research_output": None,
        "critic_output": None,
        "expert_output": None,
        "final_answer": None,
    }
    
    # Step 1: Research Agent
    print("\n[Step 1] Lead Research Agent conducting research...")
    research_prompt = f"""Conduct comprehensive breadth-first research on the following query:

{user_query}

Provide a structured research summary covering multiple angles and perspectives."""
    
    research_chat = user_proxy.initiate_chat(
        research_agent,
        message=research_prompt,
        max_turns=1,
        clear_history=False
    )
    
    # Extract response from chat history (last assistant message)
    research_output = ""
    if research_chat.chat_history:
        for msg in reversed(research_chat.chat_history):
            if msg.get("role") == "assistant" and msg.get("name") == "LeadResearchAgent":
                research_output = msg.get("content", "")
                break
    
    results["research_output"] = research_output
    print(f"Research completed. Length: {len(research_output)} characters")
    
    # Step 2: Critic Agent
    print("\n[Step 2] Critic Agent evaluating research...")
    critic_prompt = f"""Original User Query:
{user_query}

Research Output to Evaluate:
{research_output}

Evaluate this research output against the original query. Identify gaps, inaccuracies, or areas for improvement."""
    
    critic_chat = user_proxy.initiate_chat(
        critic_agent,
        message=critic_prompt,
        max_turns=1,
        clear_history=False
    )
    
    # Extract response from chat history (last assistant message)
    critic_output = ""
    if critic_chat.chat_history:
        for msg in reversed(critic_chat.chat_history):
            if msg.get("role") == "assistant" and msg.get("name") == "CriticAgent":
                critic_output = msg.get("content", "")
                break
    
    results["critic_output"] = critic_output
    print(f"Critique completed. Length: {len(critic_output)} characters")
    
    # Step 3: Domain Expert Agent
    print("\n[Step 3] Domain Expert Agent providing expertise...")
    expert_prompt = f"""Original User Query:
{user_query}

Research Findings:
{research_output}

Provide domain-specific expertise and insights relevant to this query."""
    
    expert_chat = user_proxy.initiate_chat(
        expert_agent,
        message=expert_prompt,
        max_turns=1,
        clear_history=False
    )
    
    # Extract response from chat history (last assistant message)
    expert_output = ""
    if expert_chat.chat_history:
        for msg in reversed(expert_chat.chat_history):
            if msg.get("role") == "assistant" and msg.get("name") == "DomainExpertAgent":
                expert_output = msg.get("content", "")
                break
    
    results["expert_output"] = expert_output
    print(f"Domain expertise provided. Length: {len(expert_output)} characters")
    
    # Step 4: Aggregator Agent
    print("\n[Step 4] Aggregator Agent synthesizing final answer...")
    aggregator_prompt = f"""Original User Query:
{user_query}

Research Findings:
{research_output}

Critic Evaluation:
{critic_output}

Domain Expert Insights:
{expert_output}

Synthesize all this information into a comprehensive, final answer that addresses the original query. Incorporate the critiques and domain expertise appropriately."""
    
    aggregator_chat = user_proxy.initiate_chat(
        aggregator_agent,
        message=aggregator_prompt,
        max_turns=1,
        clear_history=False
    )
    
    # Extract response from chat history (last assistant message)
    final_answer = ""
    if aggregator_chat.chat_history:
        for msg in reversed(aggregator_chat.chat_history):
            if msg.get("role") == "assistant" and msg.get("name") == "AggregatorAgent":
                final_answer = msg.get("content", "")
                break
    
    results["final_answer"] = final_answer
    print(f"Final answer synthesized. Length: {len(final_answer)} characters")
    
    return results


def run_group_chat_flow(user_query: str) -> Dict[str, Any]:
    """
    Run the multi-agent system in group chat mode.
    
    Args:
        user_query: The user's question
        
    Returns:
        Dictionary with final answer and conversation history
    """
    print("=" * 80)
    print("Running Group Chat Flow")
    print("=" * 80)
    
    # Create agents
    research_agent = create_research_agent()
    critic_agent = create_critic_agent()
    expert_agent = create_domain_expert_agent()
    aggregator_agent = create_aggregator_agent()
    user_proxy = create_user_proxy()
    
    # Create group chat
    group_chat = GroupChat(
        agents=[user_proxy, research_agent, critic_agent, expert_agent, aggregator_agent],
        messages=[],
        max_round=12,  # Allow multiple rounds of discussion
        speaker_selection_method="round_robin",  # Or "auto" for automatic selection
    )
    
    # Create group chat manager
    manager = GroupChatManager(
        groupchat=group_chat,
        llm_config=create_llm_config(CHAIRMAN_MODEL),
    )
    
    # Initiate the group chat
    print("\nInitiating group chat...")
    print(f"User Query: {user_query}\n")
    
    initial_prompt = f"""The user has asked the following question:

{user_query}

As a team, work together to:
1. Conduct comprehensive research (Lead Research Agent)
2. Critically evaluate the research against the query (Critic Agent)
3. Provide domain expertise (Domain Expert Agent)
4. Synthesize everything into a final answer (Aggregator Agent)

Please collaborate and discuss until you reach a consensus on the final answer. When ready, the Aggregator Agent should provide the final comprehensive answer and say "TERMINATE"."""
    
    chat_result = user_proxy.initiate_chat(
        manager,
        message=initial_prompt,
        max_turns=12,
    )
    
    # Extract conversation history
    conversation_history = []
    for msg in group_chat.messages:
        conversation_history.append({
            "role": msg.get("role", "assistant"),
            "name": msg.get("name", "unknown"),
            "content": msg.get("content", ""),
        })
    
    # Extract final answer (last message from aggregator or manager)
    final_answer = ""
    for msg in reversed(group_chat.messages):
        if msg.get("name") in ["AggregatorAgent", "UserProxy"]:
            final_answer = msg.get("content", "")
            break
    
    results = {
        "flow_mode": "group_chat",
        "user_query": user_query,
        "conversation_history": conversation_history,
        "final_answer": final_answer,
        "total_rounds": len(group_chat.messages),
    }
    
    print(f"\nGroup chat completed. Total rounds: {len(group_chat.messages)}")
    
    return results


def run_multi_agent(
    user_query: str,
    flow_mode: Literal["sequential", "group_chat"] = "sequential"
) -> Dict[str, Any]:
    """
    Main function to run the multi-agent system.
    
    Args:
        user_query: The user's question
        flow_mode: Either "sequential" or "group_chat"
        
    Returns:
        Dictionary with results including final answer and intermediate outputs
    """
    try:
        if flow_mode == "sequential":
            return run_sequential_flow(user_query)
        elif flow_mode == "group_chat":
            return run_group_chat_flow(user_query)
        else:
            raise ValueError(f"Invalid flow_mode: {flow_mode}. Must be 'sequential' or 'group_chat'")
    except Exception as e:
        print(f"Error in run_multi_agent: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "flow_mode": flow_mode,
            "user_query": user_query,
        }


def toy_simulation():
    """Run a toy simulation with a sample query."""
    print("\n" + "=" * 80)
    print("TOY SIMULATION - Multi-Agent System")
    print("=" * 80)
    
    # Sample query
    sample_query = "What are the key considerations when designing a scalable microservices architecture?"
    
    print(f"\nSample Query: {sample_query}\n")
    
    # Test sequential flow
    print("\n" + "-" * 80)
    print("TESTING SEQUENTIAL FLOW")
    print("-" * 80)
    sequential_results = run_multi_agent(sample_query, flow_mode="sequential")
    
    print("\n" + "=" * 80)
    print("SEQUENTIAL FLOW RESULTS")
    print("=" * 80)
    print(f"\nFinal Answer:\n{sequential_results.get('final_answer', 'N/A')}")
    print("\n" + "-" * 80)
    
    # Test group chat flow
    print("\n" + "-" * 80)
    print("TESTING GROUP CHAT FLOW")
    print("-" * 80)
    group_chat_results = run_multi_agent(sample_query, flow_mode="group_chat")
    
    print("\n" + "=" * 80)
    print("GROUP CHAT FLOW RESULTS")
    print("=" * 80)
    print(f"\nFinal Answer:\n{group_chat_results.get('final_answer', 'N/A')}")
    print(f"\nTotal Conversation Rounds: {group_chat_results.get('total_rounds', 0)}")
    print("\n" + "-" * 80)
    
    return {
        "sequential": sequential_results,
        "group_chat": group_chat_results,
    }


if __name__ == "__main__":
    # Run toy simulation
    toy_simulation()

