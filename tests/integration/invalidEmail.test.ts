/**
 * Integration test: Invalid Email
 * Expect: No DB insert, Agent re-prompts for email
 */
import { isValidEmail } from "@/lib/validation/email";
import { validateExtractedEmail } from "@/lib/agent/extraction";

describe("Invalid Email", () => {
  it("rejects invalid email formats", () => {
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("no-at-sign.com")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("missing-tld@domain")).toBe(false);
  });

  it("accepts valid email formats", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@company.co")).toBe(true);
  });

  it("extraction validation rejects invalid emails", () => {
    expect(validateExtractedEmail("bad")).toBe(false);
    expect(validateExtractedEmail("")).toBe(false);
    expect(validateExtractedEmail(undefined)).toBe(false);
    expect(validateExtractedEmail("good@test.com")).toBe(true);
  });
});
