import { useState } from 'react';
import { QUICK_PROMPTS } from '../../utils/constants';

export default function ResearchPrompt({ onSubmit, isLoading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  const handleQuickPrompt = (prompt) => {
    setQuery(prompt);
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">Research Prompt</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your research question or topic... e.g., 'What are the pros and cons of different database architectures for a high-traffic e-commerce platform?'"
          className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isLoading}
        />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 mr-2">Quick prompts:</span>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="mr-2 px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

