import Stage1Results from './Stage1Results';
import Stage2Results from './Stage2Results';
import Stage3Results from './Stage3Results';
import AggregateRankings from './AggregateRankings';

export default function ResultsDisplay({ 
  stage1Results, 
  stage2Results, 
  stage3Result, 
  aggregateRankings,
  labelToModel,
  currentStage,
  isLoading 
}) {
  if (isLoading && !stage1Results && !stage2Results && !stage3Result) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-slate-400">Processing your research question...</p>
      </div>
    );
  }

  if (!stage1Results && !stage2Results && !stage3Result) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Results</h2>
        {isLoading && (
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentStage >= 1 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
              <span className={`text-sm ${currentStage >= 1 ? 'text-blue-400' : 'text-slate-400'}`}>
                Stage 1: Collecting Responses
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentStage >= 2 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
              <span className={`text-sm ${currentStage >= 2 ? 'text-blue-400' : 'text-slate-400'}`}>
                Stage 2: Collecting Rankings
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentStage >= 3 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
              <span className={`text-sm ${currentStage >= 3 ? 'text-blue-400' : 'text-slate-400'}`}>
                Stage 3: Synthesizing Final Answer
              </span>
            </div>
          </div>
        )}
      </div>

      {stage1Results && <Stage1Results results={stage1Results} />}
      {aggregateRankings && <AggregateRankings aggregateRankings={aggregateRankings} />}
      {stage2Results && <Stage2Results results={stage2Results} labelToModel={labelToModel} />}
      {stage3Result && <Stage3Results result={stage3Result} />}
    </div>
  );
}

