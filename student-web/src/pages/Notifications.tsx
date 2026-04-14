import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../services/api';

interface Notification {
  id: string;
  type: 'exam' | 'assignment' | 'grade' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get<{ success: boolean; notifications: Notification[] }>('/notifications').catch(() => {
        return { data: { success: true, notifications: [] } };
      });
      setNotifications(response.data.notifications || []);
    } catch {
      toast.error(t('toast.loadDataFailed') || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    } catch {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all').catch(() => {});
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`).catch(() => {});
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      toast.success('Notification deleted');
    } catch {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      toast.success('Notification deleted');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <AlertCircle className="w-5 h-5 text-error" />;
      case 'assignment':
        return <Info className="w-5 h-5 text-warning" />;
      case 'grade':
        return <CheckCircle className="w-5 h-5 text-success" />;
      default:
        return <Bell className="w-5 h-5 text-info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-error/10 border-error/20';
      case 'assignment':
        return 'bg-warning/10 border-warning/20';
      case 'grade':
        return 'bg-success/10 border-success/20';
      default:
        return 'bg-info/10 border-info/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            {t('notifications.title') || 'Notifications'}
          </h1>
          <p className="text-text-secondary text-sm">
            {t('notifications.all') || 'View all notifications and latest updates'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-xl transition-colors"
          >
            {t('notifications.markAllRead') || 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('notifications.all') || 'All'} ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-white'
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('notifications.unread') || 'Unread'} ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 hover:bg-background transition-colors ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-text-primary">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mb-2">{notification.message}</p>
                        <p className="text-xs text-text-muted">
                          {format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {notification.link && (
                      <a
                        href={notification.link}
                        className="inline-block mt-3 text-sm font-semibold text-primary hover:underline"
                      >
                        {t('common.viewDetails') || 'View details'} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <p className="text-text-primary font-semibold mb-1">
            {filter === 'unread' 
              ? 'No unread notifications' 
              : t('notifications.empty') || 'No notifications yet'}
          </p>
          <p className="text-sm text-text-secondary">
            {filter === 'unread'
              ? 'All notifications have been read'
              : 'You will receive notifications when there are new updates'}
          </p>
        </div>
      )}
    </div>
  );
}
