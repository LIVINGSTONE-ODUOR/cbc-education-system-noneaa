import React from 'react';
import { ActivityFeedItem } from '@/types/dashboard-enterprise';
import { CheckCircle, AlertCircle, Clock, User } from 'lucide-react';

interface ActivityTimelineProps {
  activities: ActivityFeedItem[];
  maxItems?: number;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const activityTypeLabels: Record<string, string> = {
  student_registered: '👤 Student Registered',
  teacher_added: '👨‍🏫 Teacher Added',
  attendance_submitted: '✓ Attendance Submitted',
  fees_paid: '💰 Fees Paid',
  results_published: '📊 Results Published',
  parent_login: '👨‍👩‍👧 Parent Logged In',
  timetable_updated: '📅 Timetable Updated',
  announcement_posted: '📢 Announcement Posted',
  exam_created: '📝 Exam Created',
  assignment_created: '📚 Assignment Created',
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  maxItems = 10,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(timestamp).getTime()) / 1000
    );

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (displayedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No recent activity yet</p>
        <p className="text-sm text-gray-400">Activities will appear here as they happen</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {displayedActivities.map((activity, index) => {
        const config = statusConfig[activity.status];
        const Icon = config.icon;
        const isLast = index === displayedActivities.length - 1;

        return (
          <div
            key={activity.id}
            className="relative flex gap-4 pb-4"
          >
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-6 top-14 h-8 w-0.5 bg-gradient-to-b from-gray-200 to-transparent" />
            )}

            {/* Status Icon */}
            <div
              className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${config.bg} border ${config.borderColor}`}
            >
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>

            {/* Activity Content */}
            <div
              className={`flex-1 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-gray-300`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Activity Type */}
                  <p className="mb-1 font-semibold text-gray-900">
                    {activityTypeLabels[activity.type] || activity.action}
                  </p>

                  {/* Activity Details */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">{activity.subject}</p>

                    {/* Actor Info */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 overflow-hidden">
                        {activity.actor.avatar ? (
                          <img
                            src={activity.actor.avatar}
                            alt={activity.actor.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          activity.actor.name.charAt(0)
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {activity.actor.name} •{' '}
                        <span className="capitalize text-gray-400">
                          {activity.actor.role.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex flex-shrink-0 items-start">
                  <span className="whitespace-nowrap text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>

              {/* Metadata (if present) */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                    >
                      <span className="font-medium">{key}:</span>
                      <span className="ml-1">{String(value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
