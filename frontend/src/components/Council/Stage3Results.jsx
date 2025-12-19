import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getModelName } from '../../utils/constants';

export default function Stage3Results({ result }) {
  if (!result || !result.response) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Final Answer</h3>
      <div className="bg-gradient-to-br from-blue-900/20 to-slate-800 border-2 border-blue-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-blue-400">{getModelName(result.model)}</h4>
          <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
            Chairman
          </span>
        </div>
        <div className="prose prose-invert max-w-none text-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

