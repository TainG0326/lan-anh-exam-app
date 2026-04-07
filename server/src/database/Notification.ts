import { supabase } from '../config/supabase.js';

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

export const NotificationDB = {
  async findByUserId(userId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[NotificationDB] Error fetching notifications:', error);
      return [];
    }
    return data as Notification[];
  },

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NotificationDB] Error fetching unread notifications:', error);
      return [];
    }
    return data as Notification[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[NotificationDB] Error counting unread notifications:', error);
      return 0;
    }
    return count || 0;
  },

  async create(notification: {
    user_id: string;
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
  }): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('[NotificationDB] Error creating notification:', error);
      return null;
    }
    return data as Notification;
  },

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[NotificationDB] Error marking notification as read:', error);
      return false;
    }
    return true;
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[NotificationDB] Error marking all notifications as read:', error);
      return false;
    }
    return true;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[NotificationDB] Error deleting notification:', error);
      return false;
    }
    return true;
  },
};
