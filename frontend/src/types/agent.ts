/**
 * Agent-related TypeScript types for the Odyssey AI growth companion.
 *
 * Follows the discriminated union pattern from assessment.ts for AgentCard.
 */

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface AgentMessage {
  role: "agent" | "user";
  content: string;
  message_type: "text" | "greeting";
}

export type CardType =
  | "skill_summary"
  | "quest_recommendation"
  | "world_update"
  | "progress_insight"
  | "path_suggestion";

export interface AgentCard {
  card_type: CardType;
  data: Record<string, unknown>;
}

export interface ChatResponse {
  conversation_id: string;
  message: AgentMessage;
  cards?: AgentCard[];
}

export interface ConversationListItem {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  message_type: string;
  created_at: string;
}

export interface HistoryResponse {
  conversations?: ConversationListItem[];
  messages?: ChatMessage[];
}

/** Display-friendly labels for card types */
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  skill_summary: "Skill Summary",
  quest_recommendation: "Quest Recommendation",
  world_update: "World Update",
  progress_insight: "Progress Insight",
  path_suggestion: "Path Suggestion",
};
