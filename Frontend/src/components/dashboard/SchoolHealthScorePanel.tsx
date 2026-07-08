import React from 'react';
import { SchoolHealthScore } from '@/types/dashboard-enterprise';
import { Activity, BarChart3 } from 'lucide-react';

interface SchoolHealthScorePanelProps {
  score: SchoolHealthScore;
}

const MetricGauge: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => {
  const isLow = value < 40;
  const isMedium = value >= 40 && value < 70;
  const isHigh = value >= 70;

  const statusColor = isLow ? 'text-red-600' : isMedium ? 'text-yellow-600' : 'text-green-600';
  const bgColor = isLow ? 'bg-red-50' : isMedium ? 'bg-yellow-50' : 'bg-green-50';
  const barColor = isLow ? 'from-red-500 to-red-600' : isMedium ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600';

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className={`text-lg font-bold ${statusColor}`}>{value}%</p>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${barColor} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>

      {/* Status Text */}
      <p className="mt-2 text-xs text-gray-600">
        {isLow ? 'Needs Improvement' : isMedium ? 'Good Progress' : 'Excellent'}
      </p>
    </div>
  );
};

const SchoolHealthScorePanel: React.FC<SchoolHealthScorePanelProps> = ({ score }) => {
  const metrics = [
    { label: 'Attendance', value: score.attendance, color: 'blue' },
    { label: 'Academic Performance', value: score.academicPerformance, color: 'purple' },
    { label: 'Financial Health', value: score.financialHealth, color: 'green' },
    { label: 'Admissions', value: score.admissions, color: 'orange' },
    { label: 'Teacher Productivity', value: score.teacherProductivity, color: 'cyan' },
    { label: 'Parent Engagement', value: score.parentEngagement, color: 'pink' },
  ];

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-blue-700">Overall School Health</p>
            <p className="text-xs text-blue-600 mt-1">Comprehensive performance indicator</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Large Circular Progress Indicator */}
        <div className="flex items-center justify-center gap-8">
          {/* Circular Gauge */}
          <div className="relative h-40 w-40 flex-shrink-0">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={`url(#scoreGradient)`}
                strokeWidth="8"
                strokeDasharray={`${(score.overall / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
              <defs>
                <linearGradient
                  id="scoreGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-gray-900">{score.overall}</p>
              <p className="text-xs text-gray-600 mt-1">Out of 100</p>
            </div>
          </div>

          {/* Status Info */}
          <div className="flex-1">
            <div className="mb-4">
              <p className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(score.overall)} bg-clip-text text-transparent`}>
                {getScoreLabel(score.overall)}
              </p>
              <p className="mt-2 text-sm text-gray-700">
                {score.overall >= 80
                  ? 'Your school is performing excellently. Continue with current strategies.'
                  : score.overall >= 60
                  ? 'Good performance. Focus on areas with lower scores.'
                  : 'Performance needs attention. Consider targeted improvements.'}
              </p>
            </div>

            {/* Key Recommendations */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Focus Areas</p>
              {metrics
                .sort((a, b) => a.value - b.value)
                .slice(0, 2)
                .map((metric) => (
                  <p key={metric.label} className="text-xs text-gray-600">
                    • Improve {metric.label.toLowerCase()} ({metric.value}%)
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Metrics Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-700" />
          <h4 className="font-semibold text-gray-900">Performance Breakdown</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.map((metric) => (
            <MetricGauge
              key={metric.label}
              label={metric.label}
              value={metric.value}
              color={metric.color}
            />
          ))}
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">System Insights</p>
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ School health score calculated from 6 key performance metrics</p>
          <p>✓ Data updates in real-time from Supabase</p>
          <p>✓ Weekly trends available in detailed reports</p>
        </div>
      </div>
    </div>
  );
};

export default SchoolHealthScorePanel;
