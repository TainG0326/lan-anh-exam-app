import { Request, Response } from 'express';
import { NotificationDB } from '../database/Notification.js';

// Get all notifications for current user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await NotificationDB.findByUserId(userId);
    const unreadCount = await NotificationDB.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('[Notifications] Get error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const success = await NotificationDB.markAsRead(id, userId);

    if (success) {
      res.json({ success: true, message: 'Notification marked as read' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to mark notification as read' });
    }
  } catch (error: any) {
    console.error('[Notifications] Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const success = await NotificationDB.markAllAsRead(userId);

    if (success) {
      res.json({ success: true, message: 'All notifications marked as read' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to mark all notifications as read' });
    }
  } catch (error: any) {
    console.error('[Notifications] Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to mark all notifications as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const success = await NotificationDB.delete(id, userId);

    if (success) {
      res.json({ success: true, message: 'Notification deleted' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to delete notification' });
    }
  } catch (error: any) {
    console.error('[Notifications] Delete error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete notification' });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await NotificationDB.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('[Notifications] Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get unread count' });
  }
};
