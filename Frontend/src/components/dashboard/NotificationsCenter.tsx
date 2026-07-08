import React, { useState } from 'react';
import { Notification, NotificationCategory } from '@/types/dashboard-enterprise';
import { X, Bell, Search, Archive, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NotificationsCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const categoryConfig: Record<NotificationCategory, { color: string; icon: string }> = {
  academic: { color: 'bg-blue-100 text-blue-700', icon: '📚' },
  finance: { color: 'bg-green-100 text-green-700', icon: '💰' },
  admissions: { color: 'bg-purple-100 text-purple-700', icon: '📋' },
  attendance: { color: 'bg-orange-100 text-orange-700', icon: '✓' },
  messages: { color: 'bg-cyan-100 text-cyan-700', icon: '💬' },
  security: { color: 'bg-red-100 text-red-700', icon: '🔒' },
  system: { color: 'bg-gray-100 text-gray-700', icon: '⚙️' },
};

const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  notifications,
  onMarkAsRead,
  onArchive,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || notif.category === selectedCategory;
    const matchesReadStatus = !showOnlyUnread || !notif.read;

    return matchesSearch && matchesCategory && matchesReadStatus;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categories: (NotificationCategory | 'all')[] = [
    'all',
    'academic',
    'finance',
    'admissions',
    'attendance',
    'messages',
    'security',
    'system',
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat === 'all' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Toggle Unread Filter */}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnread}
            onChange={(e) => setShowOnlyUnread(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show unread only
        </label>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' || showOnlyUnread
                ? 'No notifications match your filters'
                : 'All caught up! No notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-200">
            {filteredNotifications.map((notif) => {
              const config = categoryConfig[notif.category];

              return (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors ${
                    notif.read ? 'bg-white' : 'bg-blue-50'
                  } hover:bg-gray-50 cursor-pointer group`}
                  onClick={() => notif.actionUrl && window.open(notif.actionUrl)}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${config.color}`}>
                      {notif.avatar ? (
                        <img
                          src={notif.avatar}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{config.icon}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notif.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {!notif.read && (
                          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-2" />
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!notif.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead?.(notif.id);
                          }}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {onArchive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchive(notif.id);
                          }}
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notif.id);
                          }}
                          title="Delete"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsCenter;
