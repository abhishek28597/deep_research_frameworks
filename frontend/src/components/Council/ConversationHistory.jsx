import { useState, useEffect } from 'react';
import { listConversations, deleteConversation, exportConversation } from '../../services/api';

export default function ConversationHistory({ isOpen, onClose, onSelectConversation, currentMode = 'Council' }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const [availableModes, setAvailableModes] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, selectedMode]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all conversations to get available modes
      const allConversations = await listConversations();
      
      // Extract unique modes
      const modes = [...new Set(allConversations.map(c => c.mode || 'Council'))];
      setAvailableModes(modes);
      
      // Filter by selected mode
      const filtered = selectedMode 
        ? allConversations.filter(c => (c.mode || 'Council') === selectedMode)
        : allConversations;
      
      setConversations(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      await deleteConversation(conversationId);
      loadConversations(); // Reload list
    } catch (err) {
      alert(`Failed to delete conversation: ${err.message}`);
    }
  };

  const handleExport = async (conversationId, e) => {
    e.stopPropagation();
    try {
      await exportConversation(conversationId);
    } catch (err) {
      alert(`Failed to export conversation: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getModeColor = (mode) => {
    const colors = {
      'Council': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'Super Chat': 'bg-green-500/20 text-green-400 border-green-500/50',
      'DxO': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'Ensemble': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'Shoppr': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    };
    return colors[mode] || 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  };

  // Group conversations by mode
  const groupedConversations = conversations.reduce((acc, conv) => {
    const mode = conv.mode || 'Council';
    if (!acc[mode]) {
      acc[mode] = [];
    }
    acc[mode].push(conv);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Conversation History</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Filter */}
        {availableModes.length > 0 && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMode(null)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                  selectedMode === null
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {availableModes.map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                    selectedMode === mode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadConversations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConversations).map(([mode, modeConversations]) => (
                <div key={mode}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${getModeColor(mode).split(' ')[0]}`}></div>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                      {mode} ({modeConversations.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {modeConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <button
                            onClick={() => {
                              onSelectConversation(conv.id, conv.mode || 'Council');
                              onClose();
                            }}
                            className="flex-1 text-left"
                          >
                            <h3 className="font-medium text-white truncate">
                              {conv.title || 'New Conversation'}
                            </h3>
                          </button>
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={(e) => handleExport(conv.id, e)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Export"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDelete(conv.id, e)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-sm text-slate-400">
                            <span>{conv.message_count} message{conv.message_count !== 1 ? 's' : ''}</span>
                            <span className={`px-2 py-0.5 rounded text-xs border ${getModeColor(conv.mode || 'Council')}`}>
                              {conv.mode || 'Council'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDate(conv.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
