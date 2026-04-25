import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import useAnimatedCounter from '../../hooks/useAnimatedCounter';

export function StatCard({ title, value, icon: Icon, iconBg = 'bg-green-50', iconColor = 'text-green-600', change, prefix = '', suffix = '', format = 'number' }) {
  const displayValue = format === 'currency'
    ? formatCurrency(value)
    : prefix + formatNumber(value) + suffix;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            change > 0 ? 'bg-green-50 text-green-600' : change < 0 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
          }`}>
            {change > 0 ? <ArrowUp size={11} /> : change < 0 ? <ArrowDown size={11} /> : <Minus size={11} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-0.5">{displayValue}</div>
      <div className="text-sm text-slate-500">{title}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '', padding = true }) {
  return (
    <div className={`card ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const colorMap = {
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-600',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <span className={`badge ${colorMap[color] || colorMap.slate}`}>{children}</span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function FilterBar({ filters, onFilterChange, children }) {
  return (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative flex-1 min-w-40 max-w-xs">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 py-2"
      />
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder = 'All' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-field py-2 text-sm" style={{ width: 'auto', minWidth: '120px' }}>
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function StockBar({ current, max }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = pct === 0 ? 'bg-red-400' : pct < 20 ? 'bg-orange-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ minWidth: 60 }}>
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">{current}</span>
    </div>
  );
}

// ─── Animated Stat (counter that animates from 0 → value) ──────────────
export function AnimatedStat({ value, format = 'number', prefix = '', suffix = '', className = '' }) {
  const numValue = typeof value === 'number' ? value : 0;
  const animated = useAnimatedCounter(numValue, 1200);
  const display = format === 'currency'
    ? formatCurrency(animated)
    : prefix + animated.toLocaleString() + suffix;
  return <span className={`counter-glow tabular-nums ${className}`}>{display}</span>;
}

// ─── Skeleton Components ────────────────────────────────────────────────
export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-7 w-28 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="skeleton w-10 h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container">
      <div className="p-4">
        <div className="skeleton h-9 w-64 rounded-lg" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="table-header">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3"><div className="skeleton h-3 rounded" style={{ width: `${50 + Math.random() * 30}%` }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <SkeletonRow key={r} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-5 animate-pulse">
      <div><div className="skeleton h-6 w-48 mb-2" /><div className="skeleton h-4 w-64" /></div>
      <SkeletonCards count={4} />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="skeleton-card"><div className="skeleton h-4 w-32 mb-4" /><div className="skeleton h-48 rounded-lg" /></div>
        <div className="skeleton-card"><div className="skeleton h-4 w-32 mb-4" /><div className="skeleton h-48 rounded-lg" /></div>
      </div>
    </div>
  );
}
