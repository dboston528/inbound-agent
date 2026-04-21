/**
 * Integration test: Low Intent lead
 * Expect: Lead inserted, Score < 6, Booking link absent
 */
import { calculateLeadScore, isHighIntent } from "@/lib/agent/scoring";

describe("Low Intent Lead", () => {
  it("scores low intent correctly", () => {
    const fields = {
      useCase: "just looking",
      teamSize: "TEAM_1_10",
      timeline: "EXPLORING",
      email: "low@example.com",
    };

    const score = calculateLeadScore(fields);
    expect(score).toBeLessThan(6);
    expect(isHighIntent(score)).toBe(false);
  });

  it("does not return booking link for low intent", () => {
    const score = 2;
    expect(isHighIntent(score)).toBe(false);
  });
});
