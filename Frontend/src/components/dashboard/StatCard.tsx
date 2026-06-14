import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

const StatCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last term
              </p>
            )}
          </div>
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            iconClassName || 'bg-primary/10 text-primary'
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
