import React from 'react';

/**
 * ProgressBar — reusable labeled progress bar for promotion tracking.
 * Props:
 *  - value:   current value (number)
 *  - max:     target value (number)
 *  - label:   left-side label text
 *  - extra:   optional right-side extra label (e.g. "50,000 / 50,000")
 *  - color:   'green' | 'blue' | 'amber' | 'purple'  (default: 'green')
 *  - size:    'sm' | 'md'   (default: 'md')
 */
const COLOR_MAP = {
  green:  { bar: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700'  },
  blue:   { bar: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  amber:  { bar: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
  purple: { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
};

export default function ProgressBar({ value = 0, max = 100, label = '', extra = '', color = 'green', size = 'md' }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const c = COLOR_MAP[color] || COLOR_MAP.green;
  const barH = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {label && <span className="text-xs text-slate-500">{label}</span>}
        <span className={`text-xs font-semibold ml-auto ${c.text}`}>{pct}%</span>
      </div>
      <div className={`w-full ${barH} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${barH} rounded-full ${c.bar} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {extra && <p className="text-[11px] text-slate-400 mt-0.5">{extra}</p>}
    </div>
  );
}
