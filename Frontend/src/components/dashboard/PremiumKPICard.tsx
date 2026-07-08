import React from 'react';
import { EnterpriseKPI } from '@/types/dashboard-enterprise';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PremiumKPICardProps {
  kpi: EnterpriseKPI;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700',
  green: 'from-green-50 to-green-100/50 border-green-200 text-green-700',
  red: 'from-red-50 to-red-100/50 border-red-200 text-red-700',
  purple: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-700',
  orange: 'from-orange-50 to-orange-100/50 border-orange-200 text-orange-700',
  cyan: 'from-cyan-50 to-cyan-100/50 border-cyan-200 text-cyan-700',
};

const trendColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  cyan: 'text-cyan-600',
};

const PremiumKPICard: React.FC<PremiumKPICardProps> = ({ kpi, onClick }) => {
  const color = kpi.color || 'blue';
  const baseColorClass = colorClasses[color];
  const trendColorClass = trendColorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${baseColorClass} p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl`} />
      </div>

      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 opacity-80">{kpi.title}</p>
          </div>
          <div className="rounded-lg bg-white/40 p-2 backdrop-blur-sm">
            <div className="text-2xl">{kpi.icon}</div>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{kpi.value}</span>
            {kpi.unit && (
              <span className="text-sm font-medium text-gray-600 opacity-70">
                {kpi.unit}
              </span>
            )}
          </div>
        </div>

        {/* Comparison & Trend */}
        <div className="flex items-center justify-between">
          {/* Comparison */}
          {kpi.comparison && (
            <div className="text-sm">
              <p className="text-gray-600">{kpi.comparison.label}</p>
              <p className={`font-semibold ${trendColorClass}`}>
                {kpi.comparison.percentage > 0 ? '+' : ''}
                {kpi.comparison.percentage}%
              </p>
            </div>
          )}

          {/* Trend Indicator */}
          {kpi.trend && (
            <div className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-1 backdrop-blur-sm">
              {kpi.trend.isPositive ? (
                <TrendingUp className={`h-4 w-4 ${trendColorClass}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${trendColorClass}`} />
              )}
              <span className={`text-sm font-semibold ${trendColorClass}`}>
                {kpi.trend.isPositive ? '+' : '-'}
                {Math.abs(kpi.trend.value)}% {kpi.trend.period}
              </span>
            </div>
          )}
        </div>

        {/* Mini Sparkline (Placeholder - can be enhanced with recharts) */}
        <div className="mt-4 h-1 rounded-full bg-white/20">
          <div
            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-${color}-400 to-${color}-600`}
            style={{
              width: `${50 + Math.random() * 50}%`,
            }}
          />
        </div>
      </div>

      {/* Hover Accent */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-white/20 to-white/5 transition-all duration-300 group-hover:w-full" />
    </div>
  );
};

export default PremiumKPICard;
