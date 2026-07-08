import React from 'react';
import { StudentInsight } from '@/types/dashboard-enterprise';
import { AlertCircle, TrendingUp, User, Gift, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentInsightsPanelProps {
  insights: StudentInsight[];
  onActionClick?: (insight: StudentInsight) => void;
}

const insightTypeConfig = {
  low_attendance: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    label: 'Low Attendance',
    badge: 'bg-red-50 text-red-700',
  },
  unpaid_fees: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'Unpaid Fees',
    badge: 'bg-orange-50 text-orange-700',
  },
  high_performer: {
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'High Performer',
    badge: 'bg-green-50 text-green-700',
  },
  recent_enrollment: {
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Recent Enrollment',
    badge: 'bg-blue-50 text-blue-700',
  },
  birthday: {
    icon: Gift,
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    label: 'Birthday',
    badge: 'bg-pink-50 text-pink-700',
  },
  needs_attention: {
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    label: 'Needs Attention',
    badge: 'bg-yellow-50 text-yellow-700',
  },
};

const StudentInsightsPanel: React.FC<StudentInsightsPanelProps> = ({
  insights,
  onActionClick,
}) => {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-500">No student insights available</p>
        <p className="text-sm text-gray-400 mt-1">All students are in good standing</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const config = insightTypeConfig[insight.type];
        const Icon = config.icon;

        return (
          <div
            key={insight.id}
            className={`rounded-lg border p-4 ${config.color} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {insight.avatar ? (
                  <img
                    src={insight.avatar}
                    alt={insight.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{insight.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{insight.details}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${config.badge}`}>
                    {config.label}
                  </span>
                </div>

                {/* Action Button */}
                {insight.actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onActionClick?.(insight)}
                    className="mt-3 text-xs"
                  >
                    Take Action →
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentInsightsPanel;