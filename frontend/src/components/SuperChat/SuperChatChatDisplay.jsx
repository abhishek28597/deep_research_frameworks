import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getModelName } from '../../utils/constants';
import CollapsibleSection from '../Council/CollapsibleSection';

export default function SuperChatChatDisplay({ messages, currentStage, isLoading, executionMode }) {
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

        const mode = message.execution_mode || executionMode || 'sequential';

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
                {mode === 'sequential' ? (
                  <SequentialTimeline 
                    message={message} 
                    currentStage={currentStage} 
                    isLoading={isLoading}
                  />
                ) : (
                  <ParallelTimeline 
                    message={message} 
                    currentStage={currentStage} 
                    isLoading={isLoading}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SequentialTimeline({ message, currentStage, isLoading }) {
  const council = message.council || {};
  const dxo = message.dxo || {};

  return (
    <>
      {/* Council Framework Header */}
      {(council.stage1 || council.stage2 || council.stage3) && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-blue-400">Council Framework</h3>
          </div>
          <p className="text-sm text-slate-400 ml-4">Multiple AI models provide responses, rank each other, and synthesize a final answer</p>
        </div>
      )}

      {/* Council Stages */}
      {council.stage1 && Array.isArray(council.stage1) && council.stage1.length > 0 && (
        <CollapsibleSection
          title="Council Stage 1: Individual Model Responses"
          badge="Complete"
          badgeColor="green"
          defaultExpanded={false}
        >
          <div className="space-y-4 mt-4">
            {council.stage1.map((result, idx) => {
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

      {council.stage2 && Array.isArray(council.stage2) && council.stage2.length > 0 && (
        <CollapsibleSection
          title="Council Stage 2: Peer Rankings & Evaluations"
          badge="Complete"
          badgeColor="green"
          defaultExpanded={false}
        >
          <div className="space-y-4 mt-4">
            {council.stage2.map((result, idx) => {
              if (!result || !result.model) return null;
              return (
                <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-400">{getModelName(result.model)}</h4>
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

      {council.stage3 && council.stage3.model && (
        <CollapsibleSection
          title="Council Stage 3: Synthesized Answer"
          badge="Complete"
          badgeColor="green"
          defaultExpanded={false}
        >
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-400">{getModelName(council.stage3.model)}</h4>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{council.stage3.response || ''}</ReactMarkdown>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Visual Connector */}
      {(council.stage3 || dxo.stage1) && (
        <div className="flex flex-col items-center py-4">
          <div className="w-0.5 h-12 bg-blue-500/50"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full -mt-1.5"></div>
          <div className="w-0.5 h-12 bg-blue-500/50"></div>
        </div>
      )}

      {/* DxO Framework Header */}
      {(dxo.stage1 || dxo.stage2 || dxo.stage3 || dxo.stage4) && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-purple-400">DxO Framework</h3>
          </div>
          <p className="text-sm text-slate-400 ml-4">Refining Council result through Lead Research → Critic → Domain Expert → Aggregator</p>
        </div>
      )}

      {/* DxO Stages */}
      {dxo.stage1 && dxo.stage1.model && (
        <CollapsibleSection
          title="DxO Stage 1: Lead Research (Refining Council Result)"
          badge="Complete"
          badgeColor="green"
          defaultExpanded={false}
        >
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-400">{getModelName(dxo.stage1.model)}</h4>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage1.response || ''}</ReactMarkdown>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {dxo.stage2 && dxo.stage2.model && (
        <CollapsibleSection
          title="DxO Stage 2: Critic Analysis"
          badge="Complete"
          badgeColor="green"
          defaultExpanded={false}
        >
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-400">{getModelName(dxo.stage2.model)}</h4>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage2.response || ''}</ReactMarkdown>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {dxo.stage3 && dxo.stage3.model && (
        <CollapsibleSection
          title="DxO Stage 3: Domain Expert"
          badge="Complete"
          badgeColor="green"
          defaultExpanded={false}
        >
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-400">{getModelName(dxo.stage3.model)}</h4>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage3.response || ''}</ReactMarkdown>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {dxo.stage4 && dxo.stage4.model && (
        <CollapsibleSection
          title="DxO Stage 4: Final Synthesized Answer"
          defaultExpanded={true}
          badge="Complete"
          badgeColor="green"
          headerActions={
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
              Aggregator: {getModelName(dxo.stage4.model)}
            </span>
          }
        >
          <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-600/50 rounded-lg p-4 mt-4">
            <div className="prose prose-invert max-w-none text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage4.response || ''}</ReactMarkdown>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Loading indicator */}
      {isLoading && !dxo.stage4 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex flex-col space-y-3">
            {currentStage <= 3 && (
              <>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 1 ? 'bg-green-500' : currentStage === 1 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 1 ? 'text-green-400' : currentStage === 1 ? 'text-blue-400' : 'text-slate-400'}`}>
                    Council Stage 1 {currentStage >= 1 && '✓'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 2 ? 'bg-green-500' : currentStage === 2 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 2 ? 'text-green-400' : currentStage === 2 ? 'text-blue-400' : 'text-slate-400'}`}>
                    Council Stage 2 {currentStage >= 2 && '✓'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 3 ? 'bg-green-500' : currentStage === 3 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 3 ? 'text-green-400' : currentStage === 3 ? 'text-blue-400' : 'text-slate-400'}`}>
                    Council Stage 3 {currentStage >= 3 && '✓'}
                  </span>
                </div>
              </>
            )}
            {currentStage >= 4 && (
              <>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 4 ? 'bg-green-500' : currentStage === 4 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 4 ? 'text-green-400' : currentStage === 4 ? 'text-blue-400' : 'text-slate-400'}`}>
                    DxO Stage 1: Lead Research {currentStage >= 4 && '✓'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 5 ? 'bg-green-500' : currentStage === 5 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 5 ? 'text-green-400' : currentStage === 5 ? 'text-blue-400' : 'text-slate-400'}`}>
                    DxO Stage 2: Critic {currentStage >= 5 && '✓'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 6 ? 'bg-green-500' : currentStage === 6 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 6 ? 'text-green-400' : currentStage === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                    DxO Stage 3: Domain Expert {currentStage >= 6 && '✓'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentStage >= 7 ? 'bg-green-500' : currentStage === 7 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${currentStage >= 7 ? 'text-green-400' : currentStage === 7 ? 'text-blue-400' : 'text-slate-400'}`}>
                    DxO Stage 4: Aggregator {currentStage >= 7 && '✓'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ParallelTimeline({ message, currentStage, isLoading }) {
  const council = message.council || {};
  const dxo = message.dxo || {};
  const superAggregator = message.super_aggregator;

  return (
    <>
      {/* Split Timeline Header */}
      <div className="text-center mb-4">
        <div className="inline-block px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
          Parallel Execution
        </div>
      </div>

      {/* Split Layout: Council and DxO side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Council Branch */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Council Framework</h3>
          
          {council.stage1 && Array.isArray(council.stage1) && council.stage1.length > 0 && (
            <CollapsibleSection
              title="Stage 1: Individual Responses"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="space-y-4 mt-4">
                {council.stage1.map((result, idx) => {
                  if (!result || !result.model) return null;
                  return (
                    <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-400 text-sm">{getModelName(result.model)}</h4>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.response || ''}</ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {council.stage2 && Array.isArray(council.stage2) && council.stage2.length > 0 && (
            <CollapsibleSection
              title="Stage 2: Peer Rankings"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="space-y-4 mt-4">
                {council.stage2.map((result, idx) => {
                  if (!result || !result.model) return null;
                  return (
                    <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                      <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.ranking || ''}</ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {council.stage3 && council.stage3.model && (
            <CollapsibleSection
              title="Stage 3: Final Answer"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{council.stage3.response || ''}</ReactMarkdown>
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Right: DxO Branch */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">DxO Framework</h3>
          
          {dxo.stage1 && dxo.stage1.model && (
            <CollapsibleSection
              title="Stage 1: Lead Research"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage1.response || ''}</ReactMarkdown>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {dxo.stage2 && dxo.stage2.model && (
            <CollapsibleSection
              title="Stage 2: Critic"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage2.response || ''}</ReactMarkdown>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {dxo.stage3 && dxo.stage3.model && (
            <CollapsibleSection
              title="Stage 3: Domain Expert"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage3.response || ''}</ReactMarkdown>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {dxo.stage4 && dxo.stage4.model && (
            <CollapsibleSection
              title="Stage 4: Final Answer"
              badge="Complete"
              badgeColor="green"
              defaultExpanded={false}
            >
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{dxo.stage4.response || ''}</ReactMarkdown>
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Convergence to Super Aggregator */}
      {(council.stage3 || dxo.stage4) && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-0.5 bg-blue-500/50"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-16 h-0.5 bg-blue-500/50"></div>
          </div>
        </div>
      )}

      {/* Super Aggregator Final Answer */}
      {superAggregator && superAggregator.model && (
        <CollapsibleSection
          title="Super Aggregator: Final Synthesized Answer"
          defaultExpanded={true}
          badge="Complete"
          badgeColor="green"
          headerActions={
            <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm font-medium">
              Super Aggregator: {getModelName(superAggregator.model)}
            </span>
          }
        >
          <div className="bg-gradient-to-br from-purple-900/20 to-slate-800/50 border border-purple-600/50 rounded-lg p-4 mt-4">
            <div className="prose prose-invert max-w-none text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{superAggregator.response || ''}</ReactMarkdown>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Loading indicator */}
      {isLoading && !superAggregator && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-400 mb-2">Council Framework</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm text-blue-400">Processing...</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-400 mb-2">DxO Framework</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm text-blue-400">Processing...</span>
              </div>
            </div>
          </div>
          {currentStage === 8 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-sm text-purple-400">Super Aggregator: Synthesizing...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

