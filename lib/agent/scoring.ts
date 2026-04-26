import type { SessionFields } from "./types";

const TEAM_SIZE_SCORES: Record<string, number> = {
  TEAM_1_10: 0,
  TEAM_10_50: 2,
  TEAM_50_200: 2,
  TEAM_200_PLUS: 2,
};

const TIMELINE_SCORES: Record<string, number> = {
  EXPLORING: 0,
  DAYS_30_60: 2,
  ASAP: 2,
};

const TOOL_BONUS = ["salesforce", "hubspot", "slack", "zendesk", "stripe", "notion"];
const BUDGET_KEYWORDS = ["budget", "pricing", "quote", "cost", "proposal"];
const HIGH_INTENT_THRESHOLD = 6;

export function calculateLeadScore(fields: SessionFields): number {
  let score = 0;

  if (fields.teamSize) {
    score += TEAM_SIZE_SCORES[fields.teamSize] ?? 0;
  }
  if (fields.timeline) {
    score += TIMELINE_SCORES[fields.timeline] ?? 0;
  }

  if (fields.tools) {
    const toolsLower = fields.tools.toLowerCase();
    const hasBonusTool = TOOL_BONUS.some((t) => toolsLower.includes(t));
    if (hasBonusTool) score += 1;
  }

  if (fields.useCase && fields.useCase.length > 20) {
    score += 2;
  }

  if (fields.budget && fields.budget !== "BUDGET_UNKNOWN") {
    score += 2;
  } else {
    const useCaseLower = (fields.useCase ?? "").toLowerCase();
    const hasBudgetKeyword = BUDGET_KEYWORDS.some((k) => useCaseLower.includes(k));
    if (hasBudgetKeyword) score += 2;
  }

  return score;
}

export function isHighIntent(score: number): boolean {
  return score >= HIGH_INTENT_THRESHOLD;
}
