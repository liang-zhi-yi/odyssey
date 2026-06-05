/** Notification API calls — /api/v1/notifications */

import { api } from "@/lib/api";
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/notifications";

export const notificationsService = {
  /** Get paginated notifications for the current user */
  listNotifications(params?: {
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const qs = searchParams.toString();
    return api.get<NotificationListResponse>(
      `/notifications${qs ? `?${qs}` : ""}`
    );
  },

  /** Get unread notification count */
  getUnreadCount(): Promise<UnreadCountResponse> {
    return api.get<UnreadCountResponse>("/notifications/unread-count");
  },

  /** Mark a single notification as read */
  markRead(notificationId: string): Promise<Notification> {
    return api.put<Notification>(`/notifications/${notificationId}/read`);
  },

  /** Mark all notifications as read */
  markAllRead(): Promise<{ updated: number }> {
    return api.put<{ updated: number }>("/notifications/read-all");
  },
};
