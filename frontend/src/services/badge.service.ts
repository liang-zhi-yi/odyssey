/** Badge API service */
import { api } from "@/lib/api";
import type { BadgeDefinition, UserBadge } from "@/types/badge";

export const badgeService = {
  listBadges(): Promise<BadgeDefinition[]> {
    return api.get<BadgeDefinition[]>("/badges");
  },

  listUserBadges(): Promise<UserBadge[]> {
    return api.get<UserBadge[]>("/badges/me");
  },

  getUserBadge(badgeId: string): Promise<UserBadge> {
    return api.get<UserBadge>(`/badges/me/${badgeId}`);
  },
};
