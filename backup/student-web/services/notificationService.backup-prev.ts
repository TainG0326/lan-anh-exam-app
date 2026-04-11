import api from './api';

export interface Notification {
  id: string;
  user_id: string;
  type: 'exam' | 'assignment' | 'grade' | 'class' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationCountResponse {
  success: boolean;
  count: number;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const response = await api.get<NotificationsResponse>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<NotificationCountResponse> => {
    const response = await api.get<NotificationCountResponse>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
