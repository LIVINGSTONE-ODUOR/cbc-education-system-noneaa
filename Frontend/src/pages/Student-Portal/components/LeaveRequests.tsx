import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// NOTE: There's no leave-request system in the backend yet — no table,
// controller, or route for submitting/tracking leave (only day-by-day
// attendance marked by teachers). Rather than fabricate a working form,
// this renders an honest "not available yet" state. Once a backend exists
// (e.g. a leave_requests table + POST/GET /api/v1/attendance/leave-requests),
// swap this for a real form + list, following the loading/error/empty
// pattern used in AttendanceInsights.tsx in this folder.

const LeaveRequests: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5 text-primary" />
          {t('leaveRequests', 'Leave Requests')}
        </CardTitle>
        <CardDescription>{t('leaveRequestsDesc', 'Request and track time off from school')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('leaveRequestsNotAvailable', "Leave requests aren't available yet. Contact your class teacher or the school office directly for now.")}
        </p>
      </CardContent>
    </Card>
  );
};

export default LeaveRequests;
