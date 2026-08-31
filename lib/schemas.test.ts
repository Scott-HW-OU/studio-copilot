import { describe, expect, it } from "vitest";
import { createDemoResponse } from "./demo-response";
import { crewMemberInputSchema, decisionRequestSchema, locationInputSchema, shootDayInputSchema } from "./schemas";

describe("decision request validation", () => {
  it("accepts a bounded production question", () => {
    expect(decisionRequestSchema.parse({ message: "Can we move the shoot?" }).productionId).toBe("north-star");
  });
  it("rejects empty and oversized prompts", () => {
    expect(decisionRequestSchema.safeParse({ message: " " }).success).toBe(false);
    expect(decisionRequestSchema.safeParse({ message: "x".repeat(1201) }).success).toBe(false);
  });
});

describe("production record validation", () => {
  it("accepts valid crew, location and schedule records", () => {
    expect(crewMemberInputSchema.safeParse({ name: "Alex Morgan", role: "Producer", dayRate: 600, available: ["2026-09-03"] }).success).toBe(true);
    expect(locationInputSchema.safeParse({ name: "Studio A", address: "1 Film Way", city: "London", postcode: "W1A 1AA" }).success).toBe(true);
    expect(shootDayInputSchema.safeParse({ date: "2026-09-03", title: "Day one", locationId: "loc_1", type: "Interior", scenes: ["1"], crewIds: ["crew_1"], equipmentDailyCost: 500 }).success).toBe(true);
  });

  it("rejects invalid dates, email addresses and missing addresses", () => {
    expect(crewMemberInputSchema.safeParse({ name: "Alex", role: "Producer", email: "not-email", dayRate: 1 }).success).toBe(false);
    expect(locationInputSchema.safeParse({ name: "Studio A", address: "", city: "London", postcode: "W1" }).success).toBe(false);
    expect(shootDayInputSchema.safeParse({ date: "Thursday", title: "Day", locationId: "loc_1", type: "Exterior", scenes: [], crewIds: [], equipmentDailyCost: 0 }).success).toBe(false);
  });
});

describe("demo response safeguards", () => {
  it("labels demo output and does not attach live sources", () => {
    const response = createDemoResponse();
    expect(response.mode).toBe("demo");
    expect(response.sources).toEqual([]);
    expect(response.agents.find((agent) => agent.agent === "research")?.status).toBe("skipped");
  });
});
