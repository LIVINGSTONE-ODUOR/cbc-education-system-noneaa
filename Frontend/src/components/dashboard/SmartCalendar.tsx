import React from 'react';
import { DashboardEvent } from '@/types/dashboard-enterprise';
import {
  Calendar,
  BookOpen,
  Dumbbell,
  Users,
  Gift,
  DollarSign,
  Plane,
  Clock,
} from 'lucide-react';

interface SmartCalendarProps {
  events: DashboardEvent[];
  onEventClick?: (event: DashboardEvent) => void;
}

const eventTypeConfig = {
  exam: { icon: BookOpen, color: 'bg-blue-100 text-blue-700', label: 'Exam' },
  holiday: { icon: Plane, color: 'bg-purple-100 text-purple-700', label: 'Holiday' },
  meeting: { icon: Users, color: 'bg-green-100 text-green-700', label: 'Meeting' },
  pta: { icon: Users, color: 'bg-indigo-100 text-indigo-700', label: 'PTA Event' },
  sports: { icon: Dumbbell, color: 'bg-orange-100 text-orange-700', label: 'Sports' },
  assignment: { icon: BookOpen, color: 'bg-yellow-100 text-yellow-700', label: 'Assignment' },
  birthday: { icon: Gift, color: 'bg-pink-100 text-pink-700', label: 'Birthday' },
  fee_deadline: { icon: DollarSign, color: 'bg-red-100 text-red-700', label: 'Fee Deadline' },
  leave: { icon: Plane, color: 'bg-gray-100 text-gray-700', label: 'Leave' },
};

const getCountdownText = (date: Date): string => {
  const now = new Date();
  const diffInMs = new Date(date).getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(
    (diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffInDays < 0) return 'Passed';
  if (diffInDays === 0) return `${diffInHours}h left`;
  return `${diffInDays}d left`;
};

const SmartCalendar: React.FC<SmartCalendarProps> = ({ events, onEventClick }) => {
  // Group events by date
  const eventsByDate = events.reduce(
    (acc, event) => {
      const dateKey = new Date(event.startDate).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, DashboardEvent[]>
  );

  // Get upcoming events (next 7 days)
  const today = new Date();
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (upcomingEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-500">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcomingEvents.map((event) => {
        const config = eventTypeConfig[event.type];
        const IconComponent = config.icon;
        const eventDate = new Date(event.startDate);

        return (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              {/* Event Icon */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color} flex-shrink-0`}>
                <IconComponent className="h-5 w-5" />
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Countdown Badge */}
                  <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {getCountdownText(event.startDate)}
                  </div>
                </div>

                {/* Date & Location */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                  <span>
                    📅{' '}
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {event.location && <span>📍 {event.location}</span>}
                  {event.attendees && (
                    <span>👥 {event.attendees.length} attendees</span>
                  )}
                </div>
              </div>
            </div>

            {/* Hover Action Indicator */}
            <div className="absolute bottom-0 left-0 h-1 w-0 rounded-b-xl bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 group-hover:w-full" />
          </div>
        );
      })}
    </div>
  );
};

export default SmartCalendar;
