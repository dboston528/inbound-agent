export const TEAM_SIZE_VALUES = [
  "TEAM_1_10",
  "TEAM_10_50",
  "TEAM_50_200",
  "TEAM_200_PLUS",
] as const;

export const TIMELINE_VALUES = [
  "EXPLORING",
  "DAYS_30_60",
  "ASAP",
] as const;

export const BUDGET_VALUES = [
  "BUDGET_UNDER_25K",
  "BUDGET_25_50K",
  "BUDGET_50_100K",
  "BUDGET_100_250K",
  "BUDGET_250K_PLUS",
  "BUDGET_UNKNOWN",
] as const;

export type TeamSize = (typeof TEAM_SIZE_VALUES)[number];
export type Timeline = (typeof TIMELINE_VALUES)[number];
export type Budget = (typeof BUDGET_VALUES)[number];

export interface ExtractedFields {
  useCase?: string;
  teamSize?: string;
  timeline?: string;
  tools?: string;
  department?: string;
  budget?: string;
  email?: string;
  name?: string;
  company?: string;
}

export interface SessionFields {
  useCase?: string | null;
  teamSize?: string | null;
  timeline?: string | null;
  tools?: string | null;
  department?: string | null;
  budget?: string | null;
  email?: string | null;
  name?: string | null;
  company?: string | null;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentState {
  sessionId: string;
  fields: SessionFields;
  conversationHistory: ConversationMessage[];
  currentAction: "ASK_QUESTION" | "EXTRACT_FIELDS" | "CHECK_COMPLETION" | "FINALIZE";
  lastUserMessage: string;
  reply: string;
  isComplete: boolean;
  bookingLink?: string;
  error?: string;
}

export const FIELD_ORDER = [
  "useCase",
  "teamSize",
  "timeline",
  "tools",
  "department",
  "email",
  "name",
  "company",
] as const;

export type FieldName = (typeof FIELD_ORDER)[number];
