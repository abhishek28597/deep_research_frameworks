import { useEffect } from 'react';
import { CHAIRMAN_MODEL } from '../../utils/constants';

export default function ChairmanModel({ instruction = '', onChange }) {
  // Debug: log when instruction prop changes
  useEffect(() => {
    console.log('ChairmanModel received instruction:', instruction);
  }, [instruction]);
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Chairman Model Synthesizes the final answer.
      </h2>
      <div className="relative mb-4">
        <select
          disabled
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-not-allowed"
        >
          <option value={CHAIRMAN_MODEL.id}>
            {CHAIRMAN_MODEL.name} {CHAIRMAN_MODEL.recommended && '(Recommended)'}
          </option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* User Instruction Field */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <label className="block text-xs text-slate-400 mb-1">
          User Instruction (Optional)
        </label>
        <textarea
          value={instruction}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder="Add specific instructions for the chairman model..."
          className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[60px]"
        />
      </div>
    </div>
  );
}

