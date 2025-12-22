import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, sendMessageStream, getConversation } from '../../services/api';
import ResearchPrompt from './ResearchPrompt';
import CouncilMembers from './CouncilMembers';
import ChairmanModel from './ChairmanModel';
import ChatDisplay from './ChatDisplay';

export default function CouncilPage({ selectedConversationId = null }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(selectedConversationId);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userInstructions, setUserInstructions] = useState({
    'openai/gpt-oss-20b': '',
    'llama-3.1-8b-instant': '',
    'moonshotai/kimi-k2-instruct-0905': '',
    'chairman': ''
  });

  // Load conversation history when a conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      // Always load when selectedConversationId changes, even if it's the same as conversationId
      // This handles the case where we navigate to a conversation from history
      loadConversation(selectedConversationId);
    } else if (selectedConversationId === null && conversationId) {
      // Clear conversation if selectedConversationId is explicitly null (no conversation in URL)
      // Only clear if we actually had a conversation loaded
      setConversationId(null);
      setMessages([]);
      setCurrentStage(0);
      setError(null);
      // Reset instructions to empty
      setUserInstructions({
        'openai/gpt-oss-20b': '',
        'llama-3.1-8b-instant': '',
        'moonshotai/kimi-k2-instruct-0905': '',
        'chairman': ''
      });
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
              stage1: msg.stage1 || null,
              stage2: msg.stage2 || null,
              stage3: msg.stage3 || null,
              aggregateRankings: msg.aggregate_rankings || msg.aggregateRankings || null,
              labelToModel: msg.label_to_model || msg.labelToModel || null,
              timestamp: conversation.created_at,
            };
          }
          return null;
        }).filter(Boolean);
        setMessages(formattedMessages);
        
        // Load user instructions from conversation if available
        console.log('Loading conversation, user_instructions:', conversation.user_instructions);
        if (conversation.user_instructions && Object.keys(conversation.user_instructions).length > 0) {
          const loadedInstructions = {
            'openai/gpt-oss-20b': conversation.user_instructions['openai/gpt-oss-20b'] || '',
            'llama-3.1-8b-instant': conversation.user_instructions['llama-3.1-8b-instant'] || '',
            'moonshotai/kimi-k2-instruct-0905': conversation.user_instructions['moonshotai/kimi-k2-instruct-0905'] || '',
            'chairman': conversation.user_instructions['chairman'] || ''
          };
          console.log('Loaded instructions:', loadedInstructions);
          console.log('Setting userInstructions state with:', loadedInstructions);
          setUserInstructions(loadedInstructions);
        } else {
          // Reset to empty if no instructions found
          console.log('No instructions found, resetting to empty');
          setUserInstructions({
            'openai/gpt-oss-20b': '',
            'llama-3.1-8b-instant': '',
            'moonshotai/kimi-k2-instruct-0905': '',
            'chairman': ''
          });
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
        stage1: null,
        stage2: null,
        stage3: null,
        aggregateRankings: null,
        labelToModel: null,
        timestamp: new Date().toISOString(),
      };
      
      // Add both messages
      setMessages(prev => {
        const newMessages = [...prev, userMessage, assistantMessage];
        console.log('Messages updated:', newMessages);
        return newMessages;
      });

      // Use existing conversation or create a new one
      let convId = conversationId;
      if (!convId) {
        const conversation = await createConversation('Council');
        convId = conversation.id;
        setConversationId(convId);
      }

      // Prepare user instructions (only include non-empty ones)
      const instructionsToSend = Object.keys(userInstructions).reduce((acc, key) => {
        if (userInstructions[key] && userInstructions[key].trim()) {
          acc[key] = userInstructions[key].trim();
        }
        return acc;
      }, {});

      // Send message and stream response
      await sendMessageStream(convId, query, (event) => {
        console.log('SSE Event:', event.type, event);
        switch (event.type) {
          case 'stage1_start':
            setCurrentStage(1);
            break;
          case 'stage1_complete':
            setMessages(prev => {
              const updated = [...prev];
              const lastAssistantIndex = updated.length - 1;
              if (updated[lastAssistantIndex]?.role === 'assistant') {
                updated[lastAssistantIndex] = {
                  ...updated[lastAssistantIndex],
                  stage1: event.data,
                };
                console.log('Stage1 updated:', updated[lastAssistantIndex]);
              }
              return updated;
            });
            break;
          case 'stage2_start':
            setCurrentStage(2);
            break;
          case 'stage2_complete':
            setMessages(prev => {
              const updated = [...prev];
              const lastAssistantIndex = updated.length - 1;
              if (updated[lastAssistantIndex]?.role === 'assistant') {
                updated[lastAssistantIndex] = {
                  ...updated[lastAssistantIndex],
                  stage2: event.data,
                  aggregateRankings: event.metadata?.aggregate_rankings || null,
                  labelToModel: event.metadata?.label_to_model || null,
                };
              }
              return updated;
            });
            break;
          case 'stage3_start':
            setCurrentStage(3);
            break;
          case 'stage3_complete':
            setMessages(prev => {
              const updated = [...prev];
              const lastAssistantIndex = updated.length - 1;
              if (updated[lastAssistantIndex]?.role === 'assistant') {
                updated[lastAssistantIndex] = {
                  ...updated[lastAssistantIndex],
                  stage3: event.data,
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
            setMessages(prev => prev.slice(0, -1)); // Remove incomplete assistant message
            break;
          default:
            break;
        }
      }, Object.keys(instructionsToSend).length > 0 ? instructionsToSend : null);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to process your request');
      setIsLoading(false);
      setCurrentStage(0);
      setMessages(prev => prev.slice(0, -1)); // Remove incomplete assistant message
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Council</h1>
        {conversationId && (
          <button
            onClick={() => {
              // Navigate first to clear URL params, which will trigger useEffect to clear state
              navigate('/council', { replace: true });
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
          <CouncilMembers 
            instructions={userInstructions}
            onChange={setUserInstructions}
          />
          <ChairmanModel 
            instruction={userInstructions.chairman || ''}
            onChange={(value) => setUserInstructions(prev => ({ ...prev, chairman: value }))}
          />
          <ResearchPrompt onSubmit={handleSubmit} isLoading={isLoading} />
          
          {messages.length > 0 ? (
            <ChatDisplay 
              messages={messages}
              currentStage={currentStage}
              isLoading={isLoading}
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
