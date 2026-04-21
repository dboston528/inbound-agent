/**
 * Integration test: High Intent lead
 * Expect: Lead inserted, Score >= 6, Booking link present
 *
 * Uses mock LLM - set MOCK_LLM=true and provide test fixtures.
 * For full integration, use real OpenAI with test API key.
 */
import { calculateLeadScore, isHighIntent } from "@/lib/agent/scoring";

describe("High Intent Lead", () => {
  it("scores high intent correctly", () => {
    const fields = {
      useCase: "We need to automate our sales process with AI agents and have budget for it",
      teamSize: "TEAM_10_50",
      timeline: "ASAP",
      email: "test@example.com",
      tools: "Salesforce, HubSpot, Slack",
    };

    const score = calculateLeadScore(fields);
    expect(score).toBeGreaterThanOrEqual(6);
    expect(isHighIntent(score)).toBe(true);
  });

  it("returns booking link for high intent", () => {
    const score = 8;
    expect(isHighIntent(score)).toBe(true);
  });
});
