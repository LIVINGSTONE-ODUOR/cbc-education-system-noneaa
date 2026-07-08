import React from 'react';
import { FinancialOverview } from '@/types/dashboard-enterprise';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface FinancialOverviewPanelProps {
  data: FinancialOverview;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const FinancialOverviewPanel: React.FC<FinancialOverviewPanelProps> = ({
  data,
}) => {
  const isPositive = data.profitLoss >= 0;

  const financialMetrics = [
    {
      title: "Today's Revenue",
      value: data.todayRevenue,
      icon: DollarSign,
      color: 'bg-green-100 text-green-700',
      trend: 'up',
    },
    {
      title: 'Monthly Revenue',
      value: data.monthlyRevenue,
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-700',
      trend: 'up',
    },
    {
      title: 'Outstanding Fees',
      value: data.outstandingFees,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-700',
      trend: 'down',
    },
    {
      title: 'Expected Income',
      value: data.expectedIncome,
      icon: Wallet,
      color: 'bg-purple-100 text-purple-700',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Financial Overview</h3>
        <p className="mt-1 text-sm text-gray-600">
          Real-time financial performance metrics
        </p>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {financialMetrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-gray-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatCurrency(metric.value)}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Collection Rate */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Collection Rate</h4>
            <div className="rounded-full bg-cyan-100 p-2">
              <CheckCircle className="h-5 w-5 text-cyan-700" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-cyan-700">
                {data.collectionRate}%
              </p>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000"
                style={{ width: `${data.collectionRate}%` }}
              />
            </div>

            <p className="text-xs text-gray-600">
              {data.collectionRate >= 80
                ? 'Excellent collection performance'
                : data.collectionRate >= 60
                ? 'Good collection rate'
                : 'Collection needs attention'}
            </p>
          </div>
        </div>

        {/* Profit/Loss */}
        <div
          className={`rounded-xl border p-6 ${
            isPositive
              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
              : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Profit / Loss</h4>
            <div
              className={`rounded-full p-2 ${
                isPositive
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}
            >
              {isPositive ? (
                <TrendingUp className={`h-5 w-5 ${isPositive ? 'text-green-700' : 'text-red-700'}`} />
              ) : (
                <TrendingDown className={`h-5 w-5 ${isPositive ? 'text-green-700' : 'text-red-700'}`} />
              )}
            </div>
          </div>

          <div>
            <p className={`text-3xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
              {isPositive ? '+' : ''}
              {formatCurrency(data.profitLoss)}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {isPositive
                ? 'Strong financial position'
                : 'Review expenses and revenue'}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Expenses
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(data.expenses)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Outstanding Fees
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(data.outstandingFees)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Expected Income
          </p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(data.expectedIncome)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverviewPanel;
