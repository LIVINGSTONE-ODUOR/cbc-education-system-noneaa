import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { ChartData } from '@/types/dashboard-enterprise';
import { Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsChartsProps {
  data: ChartData[];
  chartType?: 'line' | 'bar' | 'area' | 'pie';
  title?: string;
  description?: string;
  onExport?: () => void;
  onFullscreen?: () => void;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  chartType = 'line',
  title = 'Analytics',
  description,
  onExport,
  onFullscreen,
  height = 400,
  colors = DEFAULT_COLORS,
}) => {
  const [hoveredData, setHoveredData] = useState<any>(null);

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => setHoveredData(e.payload?.[0])}
                onMouseLeave={() => setHoveredData(null)}
              />
              <Legend />
              {Object.keys(data[0] || {})
                .filter((key) => key !== 'date')
                .map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    radius={[8, 8, 0, 0]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                {Object.keys(data[0] || {})
                  .filter((key) => key !== 'date')
                  .map((key, index) => (
                    <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {Object.keys(data[0] || {})
                .filter((key) => key !== 'date')
                .map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    fillOpacity={1}
                    fill={`url(#color${key})`}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="date"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <defs>
                {Object.keys(data[0] || {})
                  .filter((key) => key !== 'date')
                  .map((key, index) => (
                    <linearGradient key={key} id={`lineGradient${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => setHoveredData(e.payload?.[0])}
                onMouseLeave={() => setHoveredData(null)}
              />
              <Legend />
              {Object.keys(data[0] || {})
                .filter((key) => key !== 'date')
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[index % colors.length], r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {onFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFullscreen}
              className="gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </Button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        {renderChart()}
      </div>

      {/* Hovered Data Info */}
      {hoveredData && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-900">
            <strong>Selected Data:</strong> {JSON.stringify(hoveredData)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
