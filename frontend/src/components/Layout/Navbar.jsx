import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ConversationHistory from '../Council/ConversationHistory';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/super-chat', label: 'Super Chat' },
  { path: '/council', label: 'Council' },
  { path: '/dxo', label: 'DxO' },
  { path: '/ensemble', label: 'Ensemble' },
  { path: '/shoppr', label: 'Shoppr' },
  { path: '/frontier', label: 'Frontier' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <nav className="bg-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">D DeepR</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="text-slate-300 hover:text-white transition-colors"
              title="Conversation History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="text-slate-300 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-medium">
              S
            </button>
            <button className="text-slate-300 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <ConversationHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectConversation={(convId, conversationMode) => {
          // Navigate to appropriate page based on conversation mode
          const mode = conversationMode || 'Council';
          if (mode === 'Super Chat') {
            navigate(`/super-chat?conversation=${convId}`);
          } else if (mode === 'DxO') {
            navigate(`/dxo?conversation=${convId}`);
          } else if (mode === 'Council') {
            navigate(`/council?conversation=${convId}`);
          } else {
            // Default to council for unknown modes
            navigate(`/council?conversation=${convId}`);
          }
        }}
        currentMode={
          location.pathname === '/council' ? 'Council' :
          location.pathname === '/super-chat' ? 'Super Chat' :
          location.pathname === '/dxo' ? 'DxO' :
          location.pathname === '/ensemble' ? 'Ensemble' :
          location.pathname === '/shoppr' ? 'Shoppr' :
          null
        }
      />
    </nav>
  );
}

