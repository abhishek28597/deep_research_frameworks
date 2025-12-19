import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getModelName } from '../../utils/constants';
import CollapsibleSection from '../Council/CollapsibleSection';

export default function DxOChatDisplay({ messages, currentStage, isLoading }) {
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
                {/* Stage 1: Lead Research */}
                {message.stage1 && message.stage1.model && (
                  <CollapsibleSection
                    title="Stage 1: Lead Research"
                    badge="Complete"
                    badgeColor="green"
                    defaultExpanded={false}
                  >
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-400">{getModelName(message.stage1.model)}</h4>
                        <span className="text-xs text-slate-400">{message.stage1.model}</span>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.stage1.response || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Stage 2: Critic */}
                {message.stage2 && message.stage2.model && (
                  <CollapsibleSection
                    title="Stage 2: Critic Analysis"
                    badge="Complete"
                    badgeColor="green"
                    defaultExpanded={false}
                  >
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-400">{getModelName(message.stage2.model)}</h4>
                        <span className="text-xs text-slate-400">{message.stage2.model}</span>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.stage2.response || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Stage 3: Domain Expert */}
                {message.stage3 && message.stage3.model && (
                  <CollapsibleSection
                    title="Stage 3: Domain Expert"
                    badge="Complete"
                    badgeColor="green"
                    defaultExpanded={false}
                  >
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-400">{getModelName(message.stage3.model)}</h4>
                        <span className="text-xs text-slate-400">{message.stage3.model}</span>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.stage3.response || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Stage 4: Aggregator (Final Answer) */}
                {message.stage4 && message.stage4.model && (
                  <CollapsibleSection
                    title="Stage 4: Final Synthesized Answer"
                    defaultExpanded={true}
                    badge="Complete"
                    badgeColor="green"
                    headerActions={
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                        Aggregator: {getModelName(message.stage4.model)}
                      </span>
                    }
                  >
                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-600/50 rounded-lg p-4 mt-4">
                      <div className="prose prose-invert max-w-none text-slate-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.stage4.response || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Loading indicator for current stage */}
                {isLoading && !message.stage4 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${currentStage >= 1 ? 'bg-green-500' : currentStage === 1 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className={`text-sm ${currentStage >= 1 ? 'text-green-400' : currentStage === 1 ? 'text-blue-400' : 'text-slate-400'}`}>
                          Stage 1: Lead Research {currentStage >= 1 && '✓'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${currentStage >= 2 ? 'bg-green-500' : currentStage === 2 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className={`text-sm ${currentStage >= 2 ? 'text-green-400' : currentStage === 2 ? 'text-blue-400' : 'text-slate-400'}`}>
                          Stage 2: Critic Analysis {currentStage >= 2 && '✓'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${currentStage >= 3 ? 'bg-green-500' : currentStage === 3 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className={`text-sm ${currentStage >= 3 ? 'text-green-400' : currentStage === 3 ? 'text-blue-400' : 'text-slate-400'}`}>
                          Stage 3: Domain Expert {currentStage >= 3 && '✓'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${currentStage >= 4 ? 'bg-green-500' : currentStage === 4 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className={`text-sm ${currentStage >= 4 ? 'text-green-400' : currentStage === 4 ? 'text-blue-400' : 'text-slate-400'}`}>
                          Stage 4: Aggregator Synthesis {currentStage >= 4 && '✓'}
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

