import { useState } from 'react';
import CollapsibleSection from '../Council/CollapsibleSection';

export default function UserInstructions({ instructions, onChange }) {
  const [localInstructions, setLocalInstructions] = useState(instructions || {
    lead_research: '',
    critic: '',
    domain_expert: '',
    aggregator: ''
  });

  const handleChange = (agent, value) => {
    const updated = {
      ...localInstructions,
      [agent]: value
    };
    setLocalInstructions(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  return (
    <CollapsibleSection
      title="User Instructions (Optional)"
      badge="Optional"
      badgeColor="gray"
      defaultExpanded={false}
    >
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Lead Research Agent
          </label>
          <textarea
            value={localInstructions.lead_research}
            onChange={(e) => handleChange('lead_research', e.target.value)}
            placeholder="Add specific instructions for the Lead Research agent..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Critic Agent
          </label>
          <textarea
            value={localInstructions.critic}
            onChange={(e) => handleChange('critic', e.target.value)}
            placeholder="Add specific instructions for the Critic agent..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Domain Expert Agent
          </label>
          <textarea
            value={localInstructions.domain_expert}
            onChange={(e) => handleChange('domain_expert', e.target.value)}
            placeholder="Add specific instructions for the Domain Expert agent..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Aggregator Agent
          </label>
          <textarea
            value={localInstructions.aggregator}
            onChange={(e) => handleChange('aggregator', e.target.value)}
            placeholder="Add specific instructions for the Aggregator agent..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}

