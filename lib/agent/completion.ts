import type { SessionFields } from "./types";

export function isLeadComplete(fields: SessionFields): boolean {
  return !!(
    fields.useCase &&
    fields.teamSize &&
    fields.timeline &&
    fields.email
  );
}
