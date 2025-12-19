import { useState } from 'react';

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = true,
  badge,
  badgeColor = 'green',
  headerActions
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const badgeColors = {
    green: 'bg-green-600/20 text-green-400',
    blue: 'bg-blue-600/20 text-blue-400',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-700/50 transition-colors select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`text-slate-400 hover:text-white transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : 'rotate-0'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {headerActions}
          {badge && (
            <span className={`px-3 py-1 ${badgeColors[badgeColor]} rounded-full text-sm font-medium`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

