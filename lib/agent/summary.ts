import type { SessionFields } from "./types";

export function buildSummaryPrompt(fields: SessionFields): string {
  return `Summarize this lead in 2-3 concise sentences. Include: use case, team size, timeline, and key context.
useCase: ${fields.useCase ?? "N/A"}
teamSize: ${fields.teamSize ?? "N/A"}
timeline: ${fields.timeline ?? "N/A"}
tools: ${fields.tools ?? "N/A"}
department: ${fields.department ?? "N/A"}
company: ${fields.company ?? "N/A"}`;
}
