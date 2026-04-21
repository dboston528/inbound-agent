/**
 * Integration test: Multi-field extraction
 * Expect: Multiple fields extracted correctly from single message
 */
import { parseExtraction, mergeFields } from "@/lib/agent/extraction";

describe("Multi-field extraction", () => {
  it("parses multiple fields from JSON", () => {
    const json = `{
      "useCase": "Sales automation",
      "teamSize": "TEAM_10_50",
      "timeline": "ASAP",
      "tools": "Salesforce, Slack, HubSpot"
    }`;

    const extracted = parseExtraction(json);
    expect(extracted).not.toBeNull();
    expect(extracted?.useCase).toBe("Sales automation");
    expect(extracted?.teamSize).toBe("TEAM_10_50");
    expect(extracted?.timeline).toBe("ASAP");
    expect(extracted?.tools).toBe("Salesforce, Slack, HubSpot");
  });

  it("merges extracted fields with existing state without overwriting", () => {
    const existing = {
      useCase: "Existing use case",
      teamSize: "TEAM_50_200",
    };

    const extracted = {
      useCase: "New use case",
      timeline: "ASAP",
      email: "test@example.com",
    };

    const merged = mergeFields(existing as never, extracted);
    expect(merged.useCase).toBe("Existing use case");
    expect(merged.teamSize).toBe("TEAM_50_200");
    expect(merged.timeline).toBe("ASAP");
    expect(merged.email).toBe("test@example.com");
  });

  it("handles user message: we have 30 people and want automation soon", () => {
    const json = `{"teamSize":"TEAM_10_50","timeline":"ASAP"}`;
    const extracted = parseExtraction(json);
    expect(extracted?.teamSize).toBe("TEAM_10_50");
    expect(extracted?.timeline).toBe("ASAP");
  });
});
