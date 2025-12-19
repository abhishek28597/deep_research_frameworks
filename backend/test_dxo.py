"""Test script for DxO.py - Run with a sample query and see outputs."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.DxO import run_full_dxo
import json


async def test_dxo():
    """Test the DxO framework with a sample query."""
    
    # Sample query - you can change this
    sample_query = "What are the best practices for implementing microservices architecture?"
    
    print("=" * 80)
    print("DxO (Decision by Experts) Test")
    print("=" * 80)
    print(f"\nSample Query: {sample_query}\n")
    print("-" * 80)
    
    try:
        # Run the full DxO process
        stage1_result, stage2_result, stage3_result, stage4_result = await run_full_dxo(sample_query)
        
        # Print Stage 1: Lead Research
        print("\n" + "=" * 80)
        print("STAGE 1: LEAD RESEARCH AGENT")
        print("=" * 80)
        print(f"Model: {stage1_result.get('model', 'Unknown')}")
        print(f"\nResponse:\n{stage1_result.get('response', 'No response')}")
        print("\n" + "-" * 80)
        
        # Print Stage 2: Critic
        print("\n" + "=" * 80)
        print("STAGE 2: CRITIC AGENT")
        print("=" * 80)
        print(f"Model: {stage2_result.get('model', 'Unknown')}")
        print(f"\nResponse:\n{stage2_result.get('response', 'No response')}")
        print("\n" + "-" * 80)
        
        # Print Stage 3: Domain Expert
        print("\n" + "=" * 80)
        print("STAGE 3: DOMAIN EXPERT AGENT")
        print("=" * 80)
        print(f"Model: {stage3_result.get('model', 'Unknown')}")
        print(f"\nResponse:\n{stage3_result.get('response', 'No response')}")
        print("\n" + "-" * 80)
        
        # Print Stage 4: Aggregator
        print("\n" + "=" * 80)
        print("STAGE 4: AGGREGATOR AGENT (FINAL SYNTHESIS)")
        print("=" * 80)
        print(f"Model: {stage4_result.get('model', 'Unknown')}")
        print(f"\nResponse:\n{stage4_result.get('response', 'No response')}")
        print("\n" + "-" * 80)
        
        # Summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"✓ Stage 1 (Research): {'Success' if stage1_result.get('response', '').startswith('Error:') == False else 'Failed'}")
        print(f"✓ Stage 2 (Critic): {'Success' if stage2_result.get('response', '').startswith('Error:') == False else 'Failed'}")
        print(f"✓ Stage 3 (Domain Expert): {'Success' if stage3_result.get('response', '').startswith('Error:') == False else 'Failed'}")
        print(f"✓ Stage 4 (Aggregator): {'Success' if stage4_result.get('response', '').startswith('Error:') == False else 'Failed'}")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Error running DxO test: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Run the async test
    asyncio.run(test_dxo())

