import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getModelName } from '../../utils/constants';

export default function Stage1Results({ results }) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Stage 1: Individual Model Responses</h3>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-400">{getModelName(result.model)}</h4>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.response}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

