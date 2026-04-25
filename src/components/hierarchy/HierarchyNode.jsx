import React from 'react';
import { Award, ChevronRight, Star } from 'lucide-react';
import { ROLE_LABELS } from '../../contexts/AuthContext';

// Role → color scheme
const ROLE_COLORS = {
  ADMIN:         { bg: 'bg-slate-800',   text: 'text-white',        ring: 'ring-slate-600',   dot: 'bg-slate-400'   },
  STATE_HEAD:    { bg: 'bg-purple-700',  text: 'text-white',        ring: 'ring-purple-500',  dot: 'bg-purple-300'  },
  ZONAL_MANAGER: { bg: 'bg-blue-600',    text: 'text-white',        ring: 'ring-blue-400',    dot: 'bg-blue-300'    },
  AREA_MANAGER:  { bg: 'bg-indigo-500',  text: 'text-white',        ring: 'ring-indigo-300',  dot: 'bg-indigo-200'  },
  DO_MANAGER:    { bg: 'bg-green-600',   text: 'text-white',        ring: 'ring-green-400',   dot: 'bg-green-300'   },
  ADVISOR:       { bg: 'bg-amber-500',   text: 'text-white',        ring: 'ring-amber-300',   dot: 'bg-amber-200'   },
};

const DEFAULT_COLOR = { bg: 'bg-slate-400', text: 'text-white', ring: 'ring-slate-300', dot: 'bg-slate-200' };

export default function HierarchyNode({ node, isHighlighted = false, onClick, depth = 0 }) {
  const colors = ROLE_COLORS[node.role] || DEFAULT_COLOR;
  const label  = ROLE_LABELS[node.role] || node.role;

  return (
    <button
      onClick={() => onClick?.(node)}
      className={`
        group relative flex flex-col items-center gap-1 p-0
        transition-transform hover:scale-105 focus:outline-none
      `}
    >
      {/* Avatar circle */}
      <div className={`
        relative w-14 h-14 rounded-2xl flex items-center justify-center
        text-base font-bold shadow-md ring-2 transition-all
        ${colors.bg} ${colors.text} ${colors.ring}
        ${isHighlighted ? 'ring-4 ring-offset-2 ring-yellow-400 shadow-yellow-200 shadow-lg' : ''}
      `}>
        {node.avatar || node.name?.slice(0, 2)}

        {/* Promoted star badge */}
        {node.isPromoted && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
            <Star size={10} className="text-yellow-900 fill-yellow-900" />
          </span>
        )}
      </div>

      {/* Name + role */}
      <div className="text-center">
        <p className={`text-xs font-semibold leading-tight max-w-[80px] truncate ${isHighlighted ? 'text-yellow-700' : 'text-slate-800'}`}>
          {node.name.split(' ')[0]}
        </p>
        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${colors.bg} ${colors.text}`}>
          {label}
        </span>
        {node.advisorCode && (
          <p className={`text-[9px] font-mono mt-0.5 ${node.isPromoted ? 'text-slate-300 line-through' : 'text-blue-500'}`}>
            {node.advisorCode}
          </p>
        )}
      </div>
    </button>
  );
}
