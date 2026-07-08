import React from 'react';
import { SystemHealth } from '@/types/dashboard-enterprise';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemHealthPanelProps {
  health: SystemHealth;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
    badge: 'bg-green-100 text-green-700',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
};

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ health }) => {
  const services = [
    { name: 'Database', status: health.database },
    { name: 'API Server', status: health.api },
    { name: 'Authentication', status: health.authentication },
    { name: 'Storage', status: health.storage },
    { name: 'Email Service', status: health.email },
    { name: 'SMS Service', status: health.sms },
    { name: 'Payment Gateway', status: health.payment },
    { name: 'Backup', status: health.backup },
  ];

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const warningCount = services.filter((s) => s.status === 'warning').length;
  const criticalCount = services.filter((s) => s.status === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header with Status Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">System Health</h3>
            <p className="mt-1 text-xs text-gray-500">
              Last checked: {new Date(health.lastChecked).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-700">{healthyCount}</p>
            <p className="text-xs text-green-600 mt-1">Healthy</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{warningCount}</p>
            <p className="text-xs text-yellow-600 mt-1">Warning</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center border border-red-200">
            <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
            <p className="text-xs text-red-600 mt-1">Critical</p>
          </div>
        </div>
      </div>

      {/* Services Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service) => {
          const config = statusConfig[service.status];
          const Icon = config.icon;

          return (
            <div
              key={service.name}
              className={`rounded-lg border p-3 flex items-center justify-between ${config.color}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${config.badge}`}>
                {service.status === 'healthy'
                  ? 'OK'
                  : service.status === 'warning'
                  ? 'Warning'
                  : 'Critical'}
              </span>
            </div>
          );
        })}
      </div>

      {/* System Status Indicator */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`h-2 w-2 rounded-full ${
              criticalCount > 0
                ? 'bg-red-600'
                : warningCount > 0
                ? 'bg-yellow-600'
                : 'bg-green-600'
            }`}
          />
          <p className="text-sm font-medium text-gray-900">
            {criticalCount > 0
              ? 'System Requires Attention'
              : warningCount > 0
              ? 'System Operational with Warnings'
              : 'All Systems Operational'}
          </p>
        </div>
        <p className="text-xs text-gray-600">
          {criticalCount > 0
            ? 'Please address critical issues immediately'
            : warningCount > 0
            ? 'Monitor warning services closely'
            : 'Your system is running smoothly'}
        </p>
      </div>
    </div>
  );
};

export default SystemHealthPanel;
