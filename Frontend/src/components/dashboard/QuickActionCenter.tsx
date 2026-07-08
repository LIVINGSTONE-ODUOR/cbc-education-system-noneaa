import React from 'react';
import { Plus, Users, BookOpen, DollarSign, FileText, Bell, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface QuickActionCenterProps {
  actions?: QuickAction[];
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'add-student',
    label: 'Add Student',
    description: 'Enroll new learners',
    icon: <Plus className="h-5 w-5" />,
    href: '/school-admin/learners/add',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'add-teacher',
    label: 'Add Teacher',
    description: 'Hire new staff',
    icon: <Users className="h-5 w-5" />,
    href: '/school-admin/teachers?add=1',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'create-class',
    label: 'Create Class',
    description: 'Setup new grade',
    icon: <BookOpen className="h-5 w-5" />,
    href: '/school-admin/classes/add',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'collect-fees',
    label: 'Collect Fees',
    description: 'Record payments',
    icon: <DollarSign className="h-5 w-5" />,
    href: '/school-admin/fees',
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 'create-exam',
    label: 'Create Exam',
    description: 'Setup assessments',
    icon: <FileText className="h-5 w-5" />,
    href: '/school-admin/exams/add',
    color: 'from-red-500 to-red-600',
  },
  {
    id: 'announcements',
    label: 'Post Announcement',
    description: 'Communicate news',
    icon: <Bell className="h-5 w-5" />,
    href: '/school-admin/announcements/add',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'reports',
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/school-admin/reports',
    color: 'from-cyan-500 to-cyan-600',
  },
];

const QuickActionCenter: React.FC<QuickActionCenterProps> = ({
  actions = DEFAULT_ACTIONS,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
        <p className="mt-1 text-sm text-gray-600">Common tasks and shortcuts</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link key={action.id} to={action.href}>
            <div className="group h-full rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 cursor-pointer">
              {/* Icon Background */}
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                {action.icon}
              </div>

              {/* Label & Description */}
              <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
              <p className="text-xs text-gray-600 mt-1">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActionCenter;
