import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getModelName } from '../../utils/constants';
import CollapsibleSection from './CollapsibleSection';

export default function ChatDisplay({ messages, currentStage, isLoading }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6 pb-8">
      <h2 className="text-2xl font-semibold text-white mb-6">Conversation</h2>
      
      {messages.map((message, index) => {
        if (!message || !message.role) {
          return null;
        }

        return (
          <div key={index} className="space-y-4">
            {/* User Message */}
            {message.role === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-3xl bg-blue-600/20 border border-blue-600/50 rounded-lg p-4">
                  <div className="text-sm text-blue-400 mb-2 font-medium">You</div>
                  <div className="text-white whitespace-pre-wrap">{message.content || ''}</div>
                </div>
              </div>
            )}

            {/* Assistant Message */}
            {message.role === 'assistant' && (
              <div className="space-y-6">
                {/* Stage 1: Individual Model Responses */}
                {message.stage1 && Array.isArray(message.stage1) && message.stage1.length > 0 && (
                  <CollapsibleSection
                    title="Stage 1: Individual Model Responses"
                    badge="Complete"
                    badgeColor="green"
                    defaultExpanded={false}
                  >
                    <div className="space-y-4 mt-4">
                      {message.stage1.map((result, idx) => {
                        if (!result || !result.model) return null;
                        return (
                          <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-blue-400">{getModelName(result.model)}</h4>
                              <span className="text-xs text-slate-400">{result.model}</span>
                            </div>
                            <div className="prose prose-invert max-w-none text-slate-300">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.response || ''}</ReactMarkdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleSection>
                )}

              {/* Aggregate Rankings */}
              {message.aggregateRankings && message.aggregateRankings.length > 0 && (
                <CollapsibleSection
                  title="Aggregate Rankings"
                  defaultExpanded={false}
                >
                  <div className="overflow-x-auto mt-4">
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
                        {message.aggregateRankings.map((item, idx) => (
                          <tr key={item.model} className="hover:bg-slate-700/50">
                            <td className="px-4 py-3 text-sm text-white font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm text-blue-400">{getModelName(item.model)}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">{item.average_rank.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">{item.rankings_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>
              )}

              {/* Stage 2: Peer Rankings */}
              {message.stage2 && Array.isArray(message.stage2) && message.stage2.length > 0 && (
                <CollapsibleSection
                  title="Stage 2: Peer Rankings & Evaluations"
                  badge="Complete"
                  badgeColor="green"
                  defaultExpanded={false}
                >
                  <div className="space-y-4 mt-4">
                    {message.stage2.map((result, idx) => {
                      if (!result || !result.model) return null;
                      return (
                        <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-blue-400">{getModelName(result.model)}</h4>
                            {result.parsed_ranking && Array.isArray(result.parsed_ranking) && result.parsed_ranking.length > 0 && (
                              <div className="text-sm text-slate-400">
                                Ranked: {result.parsed_ranking.join(' → ')}
                              </div>
                            )}
                          </div>
                          <div className="prose prose-invert max-w-none text-slate-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.ranking || ''}</ReactMarkdown>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              )}

              {/* Stage 3: Final Answer */}
              {message.stage3 && message.stage3.model && (
                <CollapsibleSection
                  title="Final Answer"
                  defaultExpanded={true}
                  badge="Complete"
                  badgeColor="green"
                  headerActions={
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                      Chairman: {getModelName(message.stage3.model)}
                    </span>
                  }
                >
                  <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-600/50 rounded-lg p-4 mt-4">
                    <div className="prose prose-invert max-w-none text-slate-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.stage3.response || ''}</ReactMarkdown>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* Loading indicator for current stage */}
              {isLoading && !message.stage3 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${currentStage >= 1 ? 'bg-green-500' : currentStage === 1 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className={`text-sm ${currentStage >= 1 ? 'text-green-400' : currentStage === 1 ? 'text-blue-400' : 'text-slate-400'}`}>
                        Stage 1: Collecting Responses {currentStage >= 1 && '✓'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${currentStage >= 2 ? 'bg-green-500' : currentStage === 2 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className={`text-sm ${currentStage >= 2 ? 'text-green-400' : currentStage === 2 ? 'text-blue-400' : 'text-slate-400'}`}>
                        Stage 2: Collecting Rankings {currentStage >= 2 && '✓'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${currentStage >= 3 ? 'bg-green-500' : currentStage === 3 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className={`text-sm ${currentStage >= 3 ? 'text-green-400' : currentStage === 3 ? 'text-blue-400' : 'text-slate-400'}`}>
                        Stage 3: Synthesizing Final Answer {currentStage >= 3 && '✓'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        );
      })}
    </div>
  );
}

