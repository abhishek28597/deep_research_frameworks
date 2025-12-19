import { getModelName } from '../../utils/constants';

export default function AggregateRankings({ aggregateRankings }) {
  if (!aggregateRankings || aggregateRankings.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Aggregate Rankings</h3>
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Model</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Average Rank</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Rankings Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {aggregateRankings.map((item, index) => (
              <tr key={item.model} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm text-white font-medium">{index + 1}</td>
                <td className="px-4 py-3 text-sm text-blue-400">{getModelName(item.model)}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.average_rank.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{item.rankings_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

