import { useState } from 'react';
import { DXO_AGENTS, getModelName } from '../../utils/constants';

export default function DxOAgents({ instructions = {}, onChange }) {
  const handleInstructionChange = (agentId, value) => {
    if (onChange) {
      const updated = {
        ...instructions,
        [agentId]: value
      };
      onChange(updated);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">DxO Agents</h2>
        <span className="text-sm text-slate-400">4-stage decision-making framework</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DXO_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-medium text-white">{agent.name}</div>
                <div className="text-sm text-slate-400 mt-1">{agent.description}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Assigned Model:</div>
              <div className="text-sm text-blue-400 mb-3">{getModelName(agent.model)}</div>
              
              {/* User Instruction Field */}
              <div className="mt-3">
                <label className="block text-xs text-slate-400 mb-1">
                  User Instruction (Optional)
                </label>
                <textarea
                  value={instructions[agent.id] || ''}
                  onChange={(e) => handleInstructionChange(agent.id, e.target.value)}
                  placeholder="Add specific instructions for this agent..."
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[60px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

