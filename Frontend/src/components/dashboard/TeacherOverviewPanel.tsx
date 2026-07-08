import React from 'react';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherStats {
  inClass: number;
  available: number;
  onLeave: number;
  attendance: number;
  pendingAssignments: number;
}

interface TeacherOverviewPanelProps {
  stats: TeacherStats;
}

const TeacherOverviewPanel: React.FC<TeacherOverviewPanelProps> = ({ stats }) => {
  const metrics = [
    {
      title: 'Teachers in Class',
      value: stats.inClass,
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Available Teachers',
      value: stats.available,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
    },
    {
      title: 'On Leave',
      value: stats.onLeave,
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance}%`,
      icon: Clock,
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Teacher Overview</h3>
        <p className="mt-1 text-sm text-gray-600">Real-time staff information</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Assignments Alert */}
      {stats.pendingAssignments > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            ⚠️ {stats.pendingAssignments} Pending Assignment{stats.pendingAssignments !== 1 ? 's' : ''}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Teachers have pending assignments to review
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            Review Assignments
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeacherOverviewPanel;