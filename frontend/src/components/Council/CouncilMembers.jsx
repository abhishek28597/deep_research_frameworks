import { useEffect } from 'react';
import { COUNCIL_MODELS } from '../../utils/constants';

export default function CouncilMembers({ instructions = {}, onChange }) {
  // Debug: log when instructions prop changes
  useEffect(() => {
    console.log('CouncilMembers received instructions:', instructions);
  }, [instructions]);

  const handleInstructionChange = (modelId, value) => {
    if (onChange) {
      const updated = {
        ...instructions,
        [modelId]: value
      };
      onChange(updated);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Council Members</h2>
        <span className="text-sm text-slate-400">Select 2+ models for best results.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COUNCIL_MODELS.map((model) => (
          <div
            key={model.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3 mb-3">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{model.name}</div>
                <div className="text-sm text-slate-400">{model.description}</div>
              </div>
            </div>
            
            {/* User Instruction Field */}
            <div className="mt-3 pt-3 border-t border-slate-700">
              <label className="block text-xs text-slate-400 mb-1">
                User Instruction (Optional)
              </label>
              <textarea
                value={instructions[model.id] || ''}
                onChange={(e) => handleInstructionChange(model.id, e.target.value)}
                placeholder="Add specific instructions for this model..."
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[60px]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

