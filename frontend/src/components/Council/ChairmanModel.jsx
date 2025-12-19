import { CHAIRMAN_MODEL } from '../../utils/constants';

export default function ChairmanModel() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Chairman Model Synthesizes the final answer.
      </h2>
      <div className="relative">
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
    </div>
  );
}

