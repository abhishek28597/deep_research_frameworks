import { COUNCIL_MODELS } from '../../utils/constants';

export default function CouncilMembers() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Council Members</h2>
        <span className="text-sm text-slate-400">Select 2+ models for best results.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COUNCIL_MODELS.map((model) => (
          <div
            key={model.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-start space-x-3"
          >
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
        ))}
      </div>
    </div>
  );
}

