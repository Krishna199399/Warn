import React, { useState, useEffect } from 'react';
import { usersApi } from '../../api/users.api';
import { Card, AnimatedStat } from '../ui';
import {
  MapPin, Phone, ChevronDown, ChevronUp, TrendingUp,
  Users, ShoppingCart, Award, BarChart2, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

export default function EmployeeCard({ employee, accentColor = 'indigo' }) {
  const [expanded, setExpanded] = useState(false);
  const [perf, setPerf] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const colorMap = {
    indigo:  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    blue:    { bg: 'bg-blue-100',     text: 'text-blue-700' },
    green:   { bg: 'bg-green-100',   text: 'text-green-700' },
    amber:   { bg: 'bg-amber-100',   text: 'text-amber-700' },
    purple:  { bg: 'bg-purple-100', text: 'text-purple-700' },
  };
  const colors = colorMap[accentColor] || colorMap.indigo;

  const handleExpand = () => {
    if (!expanded && !perf) {
      setLoadingPerf(true);
      usersApi.getPerformance(employee._id)
        .then(r => setPerf(r.data.data))
        .catch(() => setPerf({ totalSales: 0, teamSize: 0, monthlyPerformance: [] }))
        .finally(() => setLoadingPerf(false));
    }
    setExpanded(!expanded);
  };

  const m = employee;

  return (
    <div className={`card overflow-hidden transition-all duration-300 ${expanded ? 'ring-2 ring-green-200 shadow-lg' : 'hover:shadow-md'}`}>
      {/* Header — always visible */}
      <button
        onClick={handleExpand}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className={`w-11 h-11 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} font-bold flex-shrink-0`}>
          {m.avatar || m.name?.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{m.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin size={10} />{m.region}, {m.state}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Phone size={10} />{m.phone}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            m.status === 'Active'
              ? 'bg-green-50 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}>{m.status}</span>
          {expanded
            ? <ChevronUp size={14} className="text-slate-400" />
            : <ChevronDown size={14} className="text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 animate-in slide-in-from-top">
          {loadingPerf ? (
            <div className="py-6 text-center text-sm text-slate-400">Loading performance data...</div>
          ) : perf ? (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-white border border-slate-100">
                  <TrendingUp size={14} className="mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-slate-500">Sales</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(perf.totalSales || 0)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white border border-slate-100">
                  <Users size={14} className="mx-auto mb-1 text-blue-500" />
                  <p className="text-xs text-slate-500">Team</p>
                  <p className="text-sm font-bold text-slate-800">{perf.teamSize || 0}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white border border-slate-100">
                  <ShoppingCart size={14} className="mx-auto mb-1 text-purple-500" />
                  <p className="text-xs text-slate-500">Orders</p>
                  <p className="text-sm font-bold text-slate-800">{perf.totalOrders || 0}</p>
                </div>
              </div>

              {/* Mini chart */}
              {perf.monthlyPerformance?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <BarChart2 size={11} /> Monthly Sales
                  </p>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={perf.monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Bar dataKey="sales" fill="#22c55e" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center text-sm text-slate-400">No performance data available</div>
          )}
        </div>
      )}
    </div>
  );
}
