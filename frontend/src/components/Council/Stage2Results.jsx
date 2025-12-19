import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getModelName } from '../../utils/constants';

export default function Stage2Results({ results, labelToModel }) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Stage 2: Peer Rankings</h3>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-400">{getModelName(result.model)}</h4>
              {result.parsed_ranking && result.parsed_ranking.length > 0 && (
                <div className="text-sm text-slate-400">
                  Ranked: {result.parsed_ranking.join(' → ')}
                </div>
              )}
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.ranking}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

