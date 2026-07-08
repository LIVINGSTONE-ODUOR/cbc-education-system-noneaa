import React from 'react';
import { AIInsight } from '@/types/dashboard-enterprise';
import { Lightbulb, AlertTriangle, Info } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: AIInsight[];
  onActionClick?: (insight: AIInsight) => void;
}

const severityConfig = {
  low: {
    icon: Info,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badge: 'bg-blue-50 text-blue-700',
  },
  medium: {
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    badge: 'bg-yellow-50 text-yellow-700',
  },
  high: {
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700 border-red-200',
    badge: 'bg-red-50 text-red-700',
  },
};

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  onActionClick,
}) => {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Lightbulb className="h-8 w-8 text-blue-600" />
        </div>
        <p className="text-gray-600">No AI insights at the moment</p>
        <p className="mt-1 text-sm text-gray-500">
          Check back soon for intelligent recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => {
        const config = severityConfig[insight.severity];
        const Icon = config.icon;

        return (
          <div
            key={insight.id}
            className={`rounded-xl border ${config.color} p-4 transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{insight.insight}</p>

                  {/* Severity Badge */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${config.badge}`}
                  >
                    {insight.severity === 'high'
                      ? 'Critical'
                      : insight.severity === 'medium'
                      ? 'Important'
                      : 'Info'}
                  </span>
                </div>

                {/* Action Button */}
                {insight.actionable && insight.actionUrl && (
                  <button
                    onClick={() => onActionClick?.(insight)}
                    className="mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-medium bg-white/40 hover:bg-white/60 transition-colors text-gray-900"
                  >
                    Take Action →
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AIInsightsPanel;
