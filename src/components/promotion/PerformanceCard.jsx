import React from 'react';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { promotionRules, getProgressToPromotion } from '../../contexts/PromotionContext';
import ProgressBar from './ProgressBar';

/**
 * PerformanceCard — shows an employee's key performance metrics
 * and their progress toward the next promotion threshold.
 *
 * Props:
 *  - performance: { totalSales, teamSize, targetsAchieved, monthlyPerformance }
 *  - userRole:    current role string (e.g. 'ADVISOR')
 */
export default function PerformanceCard({ performance, userRole }) {
  if (!performance) return null;

  const rule = promotionRules[userRole];
  const progress = getProgressToPromotion(userRole, performance);

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <TrendingUp size={16} className="text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">My Performance</h3>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-green-700 font-medium mb-0.5">Total Sales</p>
          <p className="text-base font-bold text-green-800">{formatCurrency(performance.totalSales)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-blue-700 font-medium mb-0.5">Team Size</p>
          <p className="text-base font-bold text-blue-800">{performance.teamSize}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-purple-700 font-medium mb-0.5">Targets Hit</p>
          <p className="text-base font-bold text-purple-800">{performance.targetsAchieved}</p>
        </div>
      </div>

      {/* Progress toward promotion (only if a rule exists) */}
      {rule ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Progress toward promotion
          </p>
          <ProgressBar
            value={performance.totalSales}
            max={rule.sales}
            label="Sales Target"
            extra={`${formatCurrency(performance.totalSales)} of ${formatCurrency(rule.sales)} required`}
            color="green"
          />
          <ProgressBar
            value={performance.teamSize}
            max={rule.teamSize}
            label="Team Size"
            extra={`${performance.teamSize} of ${rule.teamSize} required`}
            color="blue"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
          <Award size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">You are at the highest employee rank.</p>
        </div>
      )}
    </div>
  );
}
