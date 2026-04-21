import { z } from "zod";
import type { ExtractedFields, SessionFields } from "./types";
import { TEAM_SIZE_VALUES, TIMELINE_VALUES } from "./types";
import { isValidEmail } from "@/lib/validation/email";

const ExtractionSchema = z.object({
  useCase: z.string().optional(),
  teamSize: z.enum(TEAM_SIZE_VALUES as unknown as [string, ...string[]]).optional(),
  timeline: z.enum(TIMELINE_VALUES as unknown as [string, ...string[]]).optional(),
  tools: z.string().optional(),
  department: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
});

export function parseExtraction(jsonStr: string): ExtractedFields | null {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = ExtractionSchema.safeParse(parsed);
    if (result.success) {
      return result.data as ExtractedFields;
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
