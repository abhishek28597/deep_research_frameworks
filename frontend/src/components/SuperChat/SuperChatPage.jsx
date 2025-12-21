import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, sendMessageStream, getConversation } from '../../services/api';
import ResearchPrompt from '../Council/ResearchPrompt';
import SuperChatChatDisplay from './SuperChatChatDisplay';

export default function SuperChatPage({ selectedConversationId = null }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(selectedConversationId);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [executionMode, setExecutionMode] = useState('sequential'); // 'sequential' or 'parallel'

  // Load conversation history when a conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      // Always load when selectedConversationId changes, even if it's the same as conversationId
      // This handles the case where we navigate to a conversation from history
      loadConversation(selectedConversationId);
    } else if (selectedConversationId === null && conversationId) {
      // Clear conversation if selectedConversationId is explicitly null
      setConversationId(null);
      setMessages([]);
    }
  }, [selectedConversationId]);

  const loadConversation = async (convId) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const conversation = await getConversation(convId);
      if (conversation) {
        setConversationId(convId);
        // Convert conversation messages to our message format
        const formattedMessages = conversation.messages.map(msg => {
          if (msg.role === 'user') {
            return {
              role: 'user',
              content: msg.content,
              timestamp: conversation.created_at,
            };
          } else if (msg.role === 'assistant') {
            return {
              role: 'assistant',
              execution_mode: msg.execution_mode || 'sequential',
              council: msg.council || null,
              dxo: msg.dxo || null,
              super_aggregator: msg.super_aggregator || null,
              timestamp: conversation.created_at,
            };
          }
          return null;
        }).filter(Boolean);
        setMessages(formattedMessages);
        // Set execution mode from first assistant message if available
        if (formattedMessages.length > 0 && formattedMessages[0].execution_mode) {
          setExecutionMode(formattedMessages[0].execution_mode);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (query) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentStage(0);
      
      // Add user message to chat
      const userMessage = {
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      };
      
      // Initialize assistant message placeholder
      const assistantMessage = {
        role: 'assistant',
        execution_mode: executionMode,
        council: null,
        dxo: null,
        super_aggregator: null,
        timestamp: new Date().toISOString(),
      };
      
      // Add both messages
      setMessages(prev => [...prev, userMessage, assistantMessage]);

      // Use existing conversation or create a new one
      let convId = conversationId;
      if (!convId) {
        const conversation = await createConversation('Super Chat');
        convId = conversation.id;
        setConversationId(convId);
      }

      // Send message and stream response
      await sendMessageStream(convId, query, (event) => {
        console.log('SSE Event:', event.type, event);
        
        // Handle sequential mode events
        if (executionMode === 'sequential') {
          switch (event.type) {
            case 'council_stage1_start':
              setCurrentStage(1);
              break;
            case 'council_stage1_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    council: {
                      ...updated[lastAssistantIndex].council,
                      stage1: event.data,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'council_stage2_start':
              setCurrentStage(2);
              break;
            case 'council_stage2_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    council: {
                      ...updated[lastAssistantIndex].council,
                      stage1: updated[lastAssistantIndex].council?.stage1 || null,
                      stage2: event.data,
                      aggregateRankings: event.metadata?.aggregate_rankings || null,
                      labelToModel: event.metadata?.label_to_model || null,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'council_stage3_start':
              setCurrentStage(3);
              break;
            case 'council_stage3_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    council: {
                      ...updated[lastAssistantIndex].council,
                      stage3: event.data,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'dxo_stage1_start':
              setCurrentStage(4);
              break;
            case 'dxo_stage1_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    dxo: {
                      ...updated[lastAssistantIndex].dxo,
                      stage1: event.data,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'dxo_stage2_start':
              setCurrentStage(5);
              break;
            case 'dxo_stage2_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    dxo: {
                      ...updated[lastAssistantIndex].dxo,
                      stage2: event.data,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'dxo_stage3_start':
              setCurrentStage(6);
              break;
            case 'dxo_stage3_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    dxo: {
                      ...updated[lastAssistantIndex].dxo,
                      stage3: event.data,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'dxo_stage4_start':
              setCurrentStage(7);
              break;
            case 'dxo_stage4_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    dxo: {
                      ...updated[lastAssistantIndex].dxo,
                      stage4: event.data,
                    },
                  };
                }
                return updated;
              });
              break;
            case 'complete':
              setIsLoading(false);
              setCurrentStage(0);
              break;
            case 'error':
              setError(event.message || 'An error occurred');
              setIsLoading(false);
              setCurrentStage(0);
              setMessages(prev => prev.slice(0, -1));
              break;
            default:
              break;
          }
        } else {
          // Handle parallel mode events
          switch (event.type) {
            case 'council_start':
            case 'dxo_start':
              setCurrentStage(1);
              break;
            case 'council_stage1_complete':
            case 'council_stage2_complete':
            case 'council_stage3_complete':
            case 'dxo_stage1_complete':
            case 'dxo_stage2_complete':
            case 'dxo_stage3_complete':
            case 'dxo_stage4_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  const council = updated[lastAssistantIndex].council || {};
                  const dxo = updated[lastAssistantIndex].dxo || {};
                  
                  if (event.type.startsWith('council_stage')) {
                    const stageNum = event.type.replace('council_stage', '').replace('_complete', '');
                    council[`stage${stageNum}`] = event.data;
                    if (event.metadata) {
                      council.aggregateRankings = event.metadata.aggregate_rankings;
                      council.labelToModel = event.metadata.label_to_model;
                    }
                  } else if (event.type.startsWith('dxo_stage')) {
                    const stageNum = event.type.replace('dxo_stage', '').replace('_complete', '');
                    dxo[`stage${stageNum}`] = event.data;
                  }
                  
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    council,
                    dxo,
                  };
                }
                return updated;
              });
              break;
            case 'aggregation_start':
              setCurrentStage(8);
              break;
            case 'aggregation_complete':
              setMessages(prev => {
                const updated = [...prev];
                const lastAssistantIndex = updated.length - 1;
                if (updated[lastAssistantIndex]?.role === 'assistant') {
                  updated[lastAssistantIndex] = {
                    ...updated[lastAssistantIndex],
                    super_aggregator: event.data,
                  };
                }
                return updated;
              });
              break;
            case 'complete':
              setIsLoading(false);
              setCurrentStage(0);
              break;
            case 'error':
              setError(event.message || 'An error occurred');
              setIsLoading(false);
              setCurrentStage(0);
              setMessages(prev => prev.slice(0, -1));
              break;
            default:
              break;
          }
        }
      }, null, executionMode);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to process your request');
      setIsLoading(false);
      setCurrentStage(0);
      setMessages(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Super Chat</h1>
        {conversationId && (
          <button
            onClick={() => {
              setConversationId(null);
              setMessages([]);
              navigate('/super-chat');
            }}
            className="px-4 py-2 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            New Conversation
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loadingHistory ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-400">Loading conversation...</span>
        </div>
      ) : (
        <>
          {/* Execution Mode Selector */}
          <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Execution Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="executionMode"
                  value="sequential"
                  checked={executionMode === 'sequential'}
                  onChange={(e) => setExecutionMode(e.target.value)}
                  disabled={isLoading || messages.length > 0}
                  className="mr-2"
                />
                <span className="text-white">Sequential (Council → DxO)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="executionMode"
                  value="parallel"
                  checked={executionMode === 'parallel'}
                  onChange={(e) => setExecutionMode(e.target.value)}
                  disabled={isLoading || messages.length > 0}
                  className="mr-2"
                />
                <span className="text-white">Parallel (Council || DxO → Aggregator)</span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {executionMode === 'sequential' 
                ? 'Research prompt goes through Council first, then DxO refines the result'
                : 'Research prompt goes to both Council and DxO simultaneously, then aggregated'}
            </p>
          </div>

          <ResearchPrompt onSubmit={handleSubmit} isLoading={isLoading} />
          
          {messages.length > 0 ? (
            <SuperChatChatDisplay 
              messages={messages}
              currentStage={currentStage}
              isLoading={isLoading}
              executionMode={executionMode}
            />
          ) : (
            <div className="mt-8 text-center text-slate-400">
              <p>Submit a research question to see results here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

