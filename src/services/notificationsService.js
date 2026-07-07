// Notifications Service for Solora StayCo
import {
  createDocument,
  updateDocument,
  getDocument,
  getDocuments,
  deleteDocument,
} from '../firebase/firestoreService.js';

const COLLECTION_NAME = 'notifications';

/**
 * Create a notification
 * @param {Object} notification
 * @returns {Promise<string>} Notification ID
 */
export async function createNotification(notification) {
  const data = {
    ...notification,
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  };

  return await createDocument(COLLECTION_NAME, data);
}

/**
 * Mark notification as read
 * @param {string} notificationId
 */
export async function markNotificationRead(notificationId) {
  return await updateDocument(COLLECTION_NAME, notificationId, {
    isRead: true,
    readAt: new Date().toISOString(),
  });
}

/**
 * Mark all notifications for a user as read
 * @param {string} userId
 */
export async function markAllNotificationsRead(userId) {
  const notifications = await getNotifications(userId, { includeRead: false });
  await Promise.all(notifications.map((n) => markNotificationRead(n.id)));
}

/**
 * Get notifications for a user
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function getNotifications(
  userId,
  { includeRead = true, limit = 50 } = {}
) {
  try {
    const filters = [{ field: 'userId', operator: '==', value: userId }];
    if (!includeRead) {
      filters.push({ field: 'isRead', operator: '==', value: false });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc', limit);
  } catch (error) {
    if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
      console.warn('Notification index unavailable, using user-only fallback query');
      let notifications = await getDocuments(COLLECTION_NAME, [
        { field: 'userId', operator: '==', value: userId }
      ], null, null, limit);

      if (!includeRead) {
        notifications = notifications.filter((notification) => notification.isRead === false);
      }

      return notifications
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit);
    }
    throw error;
  }
}

/**
 * Get notification by ID
 * @param {string} notificationId
 * @returns {Promise<Object|null>}
 */
export async function getNotification(notificationId) {
  return await getDocument(COLLECTION_NAME, notificationId);
}

/**
 * Delete notification
 * @param {string} notificationId
 */
export async function deleteNotification(notificationId) {
  return await deleteDocument(COLLECTION_NAME, notificationId);
}

