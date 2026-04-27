import type { SessionFields } from "./types";

// ─────────────────────────────────────────────────────────────
// Acme Media — Partnership Lead Scoring Engine
// Deterministic only. No LLM involvement in scoring decisions.
// ─────────────────────────────────────────────────────────────

export type TeamSize =
  | "TEAM_1_10"
  | "TEAM_10_50"
  | "TEAM_50_200"
  | "TEAM_200_PLUS";

export type Timeline = "EXPLORING" | "DAYS_30_60" | "ASAP";

export type PartnershipType =
  | "newsletter_sponsorship"
  | "content_licensing"
  | "co_branded"
  | "general_inquiry";

export type Vertical = "finance" | "tech" | "healthcare" | "multiple";

export interface ScoreBreakdown {
  teamSizeScore: number;
  timelineScore: number;
  toolsScore: number;
  partnershipTypeScore: number;
  verticalScore: number;
  useCaseLengthScore: number;
  budgetKeywordScore: number;
  total: number;
  intent: "High Intent" | "Low Intent";
  bookingLinkEligible: boolean;
}

// ─────────────────────────────────────────────────────────────
// SCORING CONSTANTS
// Adjust thresholds here without touching scoring logic below.
// ─────────────────────────────────────────────────────────────

const HIGH_INTENT_THRESHOLD = 6; // >= 6 = High Intent

const TEAM_SIZE_SCORES: Record<TeamSize, number> = {
  TEAM_1_10: 0,
  TEAM_10_50: 1,
  TEAM_50_200: 2,
  TEAM_200_PLUS: 3,
};

const TIMELINE_SCORES: Record<Timeline, number> = {
  EXPLORING: 0,
  DAYS_30_60: 2,
  ASAP: 3,
};

const HIGH_VALUE_TOOLS = [
  "salesforce",
  "hubspot",
  "marketo",
  "pardot",
  "slack",
  "zendesk",
  "stripe",
  "notion",
  "eloqua",
  "microsoft dynamics",
];

const HIGH_VALUE_PARTNERSHIP_TYPES: PartnershipType[] = [
  "content_licensing",
  "co_branded",
];

const HIGH_VALUE_VERTICALS: Vertical[] = ["finance", "healthcare"];

const BUDGET_KEYWORDS = [
  "budget",
  "pricing",
  "price",
  "quote",
  "cost",
  "proposal",
  "approved",
  "allocated",
  "spend",
  "investment",
];

export function scoreLead(fields: SessionFields): ScoreBreakdown {
  let total = 0;

  const teamSizeScore =
    fields.teamSize && isTeamSize(fields.teamSize)
      ? TEAM_SIZE_SCORES[fields.teamSize]
      : 0;
  total += teamSizeScore;

  const timelineScore =
    fields.timeline && isTimeline(fields.timeline)
      ? TIMELINE_SCORES[fields.timeline]
      : 0;
  total += timelineScore;

  const toolsScore = scoreTools(fields.tools ?? undefined);
  total += toolsScore;

  const partnershipType = inferPartnershipType(fields.useCase ?? undefined);
  const partnershipTypeScore = partnershipType
    ? HIGH_VALUE_PARTNERSHIP_TYPES.includes(partnershipType)
      ? 1
      : 0
    : 0;
  total += partnershipTypeScore;

  const vertical = inferVertical(fields.department ?? undefined);
  const verticalScore = vertical
    ? HIGH_VALUE_VERTICALS.includes(vertical)
      ? 1
      : 0
    : 0;
  total += verticalScore;

  const useCaseLengthScore =
    fields.useCase && fields.useCase.trim().length > 20 ? 1 : 0;
  total += useCaseLengthScore;

  const budgetKeywordScore = scoreBudgetKeywords(fields);
  total += budgetKeywordScore;

  const intent = total >= HIGH_INTENT_THRESHOLD ? "High Intent" : "Low Intent";
  const bookingLinkEligible = total >= HIGH_INTENT_THRESHOLD;

  return {
    teamSizeScore,
    timelineScore,
    toolsScore,
    partnershipTypeScore,
    verticalScore,
    useCaseLengthScore,
    budgetKeywordScore,
    total,
    intent,
    bookingLinkEligible,
  };
}

export function formatScoreSummary(
  fields: SessionFields,
  breakdown: ScoreBreakdown
): string {
  const partnershipType = inferPartnershipType(fields.useCase ?? undefined);
  const vertical = inferVertical(fields.department ?? undefined);

  const lines = [
    `Partnership intent score: ${breakdown.total}`,
    `Classification: ${breakdown.intent}`,
    ``,
    `Score breakdown:`,
    `  Brand size:           +${breakdown.teamSizeScore}`,
    `  Launch timeline:      +${breakdown.timelineScore}`,
    `  Marketing stack:      +${breakdown.toolsScore}`,
    `  Partnership type:     +${breakdown.partnershipTypeScore}${
      partnershipType ? ` (${partnershipType})` : ""
    }`,
    `  Vertical interest:    +${breakdown.verticalScore}${
      vertical ? ` (${vertical})` : ""
    }`,
    `  Inquiry detail:       +${breakdown.useCaseLengthScore}`,
    `  Budget signal:        +${breakdown.budgetKeywordScore}`,
    ``,
    `Booking link eligible: ${breakdown.bookingLinkEligible ? "Yes" : "No"}`,
  ];

  return lines.join("\n");
}

export function calculateLeadScore(fields: SessionFields): number {
  return scoreLead(fields).total;
}

export function isHighIntent(score: number): boolean {
  return score >= HIGH_INTENT_THRESHOLD;
}

function scoreTools(tools?: string): number {
  if (!tools) return 0;

  const normalized = tools.toLowerCase();
  const matchedTools = HIGH_VALUE_TOOLS.filter((tool) =>
    normalized.includes(tool)
  );

  if (matchedTools.length === 0) return 0;
  if (matchedTools.length === 1) return 1;
  return 2;
}

function scoreBudgetKeywords(fields: SessionFields): number {
  const explicitBudgetSignal =
    fields.budget != null && fields.budget !== "" && fields.budget !== "BUDGET_UNKNOWN";

  const textFields = [
    fields.useCase,
    fields.tools,
    fields.department,
    fields.company,
  ]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ")
    .toLowerCase();

  const hasKeywordSignal = BUDGET_KEYWORDS.some((keyword) =>
    textFields.includes(keyword)
  );

  return explicitBudgetSignal || hasKeywordSignal ? 2 : 0;
}

function isTeamSize(value: string): value is TeamSize {
  return (
    value === "TEAM_1_10" ||
    value === "TEAM_10_50" ||
    value === "TEAM_50_200" ||
    value === "TEAM_200_PLUS"
  );
}

function isTimeline(value: string): value is Timeline {
  return value === "EXPLORING" || value === "DAYS_30_60" || value === "ASAP";
}

function inferPartnershipType(useCase?: string): PartnershipType | null {
  if (!useCase) return null;
  const text = useCase.toLowerCase();

  if (text.includes("licens")) return "content_licensing";
  if (text.includes("co-brand") || text.includes("cobrand")) return "co_branded";
  if (text.includes("newsletter")) return "newsletter_sponsorship";

  return "general_inquiry";
}

function inferVertical(department?: string): Vertical | null {
  if (!department) return null;
  const text = department.toLowerCase();

  const matches: Vertical[] = [];
  if (text.includes("finance") || text.includes("fintech") || text.includes("bank")) {
    matches.push("finance");
  }
  if (text.includes("tech") || text.includes("software") || text.includes("ai")) {
    matches.push("tech");
  }
  if (text.includes("health") || text.includes("med") || text.includes("pharma")) {
    matches.push("healthcare");
  }

  if (matches.length > 1) return "multiple";
  return matches[0] ?? null;
}
