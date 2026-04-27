import { z } from "zod";
import type { ExtractedFields, SessionFields } from "./types";
import { BUDGET_VALUES, TEAM_SIZE_VALUES, TIMELINE_VALUES } from "./types";
import { isValidEmail } from "@/lib/validation/email";

const ExtractionSchema = z.object({
  useCase: z.string().optional(),
  // NOTE: we accept natural language here and normalize later so that
  // a single non-enum value doesn't cause the whole extraction to fail.
  teamSize: z.string().optional(),
  timeline: z.string().optional(),
  tools: z.string().optional(),
  department: z.string().optional(),
  budget: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
});

export function parseExtraction(jsonStr: string): ExtractedFields | null {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = ExtractionSchema.safeParse(parsed);
    if (result.success) {
      return normalizeExtractedFields(result.data as ExtractedFields);
    }
    return null;
  } catch {
    return null;
  }
}

export function mergeFields(
  existing: SessionFields,
  extracted: ExtractedFields
): SessionFields {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(extracted)) {
    if (value != null && value !== "" && (merged as Record<string, unknown>)[key] == null) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

export function validateExtractedEmail(email: string | undefined): boolean {
  if (!email || email.trim() === "") return false;
  return isValidEmail(email);
}

function normalizeExtractedFields(extracted: ExtractedFields): ExtractedFields {
  const normalized: ExtractedFields = { ...extracted };

  if (typeof extracted.teamSize === "string") {
    normalized.teamSize = normalizeTeamSize(extracted.teamSize) ?? extracted.teamSize;
  }

  if (typeof extracted.timeline === "string") {
    normalized.timeline = normalizeTimeline(extracted.timeline) ?? extracted.timeline;
  }

  if (typeof extracted.budget === "string") {
    normalized.budget = normalizeBudget(extracted.budget) ?? extracted.budget;
  }

  // If timeline/teamSize didn't normalize to a known enum, omit them
  // so we don't store unusable values that block completion.
  if (!isTeamSizeEnum(normalized.teamSize)) delete normalized.teamSize;
  if (!isTimelineEnum(normalized.timeline)) delete normalized.timeline;
  if (!isBudgetEnum(normalized.budget)) delete normalized.budget;

  return normalized;
}

function normalizeTeamSize(input: string): (typeof TEAM_SIZE_VALUES)[number] | null {
  const text = input.toLowerCase().trim();

  // Handle already-normalized values
  if (isTeamSizeEnum(input)) return input;

  // Common phrasings
  if (text.includes("enterprise") || text.includes("200+")) return "TEAM_200_PLUS";
  if (text.includes("startup") || text.includes("small team") || text.includes("1-10")) {
    return "TEAM_1_10";
  }

  // Extract an approximate headcount (employees / people / person)
  const countMatch = text.match(/(\d{1,5})\s*[- ]*(?:person|people|employee|employees|headcount)?/);
  const n = countMatch ? Number(countMatch[1]) : NaN;
  if (!Number.isNaN(n)) {
    if (n <= 10) return "TEAM_1_10";
    if (n <= 50) return "TEAM_10_50";
    if (n <= 200) return "TEAM_50_200";
    return "TEAM_200_PLUS";
  }

  // Range formats like "10-50", "50–200"
  const rangeMatch = text.match(/(\d{1,5})\s*[-–]\s*(\d{1,5})/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    const mid = (low + high) / 2;
    if (mid <= 10) return "TEAM_1_10";
    if (mid <= 50) return "TEAM_10_50";
    if (mid <= 200) return "TEAM_50_200";
    return "TEAM_200_PLUS";
  }

  return null;
}

function normalizeTimeline(input: string): (typeof TIMELINE_VALUES)[number] | null {
  const text = input.toLowerCase().trim();

  // Handle already-normalized values
  if (isTimelineEnum(input)) return input;

  // Strong urgency signals
  if (
    text.includes("asap") ||
    text.includes("as soon as possible") ||
    text.includes("immediately") ||
    text.includes("right away") ||
    text.includes("urgent")
  ) {
    return "ASAP";
  }

  // Explicit exploring signals
  if (
    text.includes("exploring") ||
    text.includes("research") ||
    text.includes("early") ||
    text.includes("just looking") ||
    text.includes("no rush")
  ) {
    return "EXPLORING";
  }

  // Time-window / quarter-ish language. We map to the "active window" enum since
  // the system only supports three coarse buckets.
  if (
    text.includes("q1") ||
    text.includes("q2") ||
    text.includes("q3") ||
    text.includes("q4") ||
    text.includes("before") ||
    text.includes("this quarter") ||
    text.includes("next quarter") ||
    text.includes("this month") ||
    text.includes("next month") ||
    text.match(/\b\d+\s*(day|days|week|weeks|month|months)\b/)
  ) {
    return "DAYS_30_60";
  }

  return null;
}

function isTeamSizeEnum(value: unknown): value is (typeof TEAM_SIZE_VALUES)[number] {
  return typeof value === "string" && (TEAM_SIZE_VALUES as readonly string[]).includes(value);
}

function isTimelineEnum(value: unknown): value is (typeof TIMELINE_VALUES)[number] {
  return typeof value === "string" && (TIMELINE_VALUES as readonly string[]).includes(value);
}

function normalizeBudget(input: string): (typeof BUDGET_VALUES)[number] | null {
  const text = input.toLowerCase().trim();

  if (isBudgetEnum(input)) return input;

  // Explicit "unknown" style answers
  if (
    text.includes("unknown") ||
    text.includes("not sure") ||
    text.includes("tbd") ||
    text.includes("n/a") ||
    text.includes("no budget")
  ) {
    return "BUDGET_UNKNOWN";
  }

  // Prefer numeric parsing when possible, e.g. "$50K", "50,000", "50k range"
  const amount = parseMoneyToDollars(text);
  if (amount != null) {
    if (amount < 25_000) return "BUDGET_UNDER_25K";
    if (amount < 50_000) return "BUDGET_25_50K";
    if (amount < 100_000) return "BUDGET_50_100K";
    if (amount < 250_000) return "BUDGET_100_250K";
    return "BUDGET_250K_PLUS";
  }

  // If they mention approval/allocated/spend but no number, keep as unknown
  if (
    text.includes("approved") ||
    text.includes("allocated") ||
    text.includes("budget") ||
    text.includes("spend")
  ) {
    return "BUDGET_UNKNOWN";
  }

  return null;
}

function parseMoneyToDollars(text: string): number | null {
  // Matches: $50k, 50k, 50,000, 50000, $250K+
  const match = text.match(/\$?\s*(\d{1,3}(?:,\d{3})+|\d{1,7})\s*([kKmM])?/);
  if (!match) return null;

  const raw = match[1].replace(/,/g, "");
  const n = Number(raw);
  if (Number.isNaN(n)) return null;

  const suffix = match[2]?.toLowerCase();
  if (suffix === "k") return n * 1_000;
  if (suffix === "m") return n * 1_000_000;
  return n;
}

function isBudgetEnum(value: unknown): value is (typeof BUDGET_VALUES)[number] {
  return typeof value === "string" && (BUDGET_VALUES as readonly string[]).includes(value);
}
