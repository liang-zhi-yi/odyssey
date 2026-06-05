/** Notification types for the notification system */

export type NotificationType =
  | "CREDENTIAL_EARNED"
  | "TIER_ADVANCE"
  | "MILESTONE_REACHED"
  | "ASSESSMENT_COMPLETE"
  | "WEEKLY_DIGEST";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  count: number;
}
