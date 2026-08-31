import { describe, expect, it } from "vitest";
import { createDemoResponse } from "./demo-response";
import { decisionRequestSchema } from "./schemas";

describe("decision request validation", () => {
  it("accepts a bounded production question", () => {
    expect(decisionRequestSchema.parse({ message: "Can we move the shoot?" }).productionId).toBe("north-star");
  });
  it("rejects empty and oversized prompts", () => {
    expect(decisionRequestSchema.safeParse({ message: " " }).success).toBe(false);
    expect(decisionRequestSchema.safeParse({ message: "x".repeat(1201) }).success).toBe(false);
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
