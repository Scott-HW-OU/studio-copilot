import type { DecisionResponse } from "./types";

export function createDemoResponse(): DecisionResponse {
  return {
    recommendation: "Hold Thursday for now; prepare Saturday as a conditional cover day",
    confidence: 0.74,
    summary: "Saturday covers five of six assigned crew members, but the gaffer is unavailable. Confirm a replacement and obtain a current weather and permit check before moving the call sheet.",
    risks: [
      "Gaffer Ellis Grant is not recorded as available on Saturday",
      "Weather and city disruption information is sample data in demo mode",
      "Changing the shoot may extend equipment hire by an estimated £2,900 per day"
    ],
    actions: [
      "Place a 24-hour hold on a replacement gaffer",
      "Run the live Parallel/Gemini workflow with production credentials",
      "Confirm permit validity directly with the issuing authority",
      "Issue a revised call sheet only after department-head approval"
    ],
    agents: [
      { agent: "production", label: "Production Manager", status: "complete", summary: "Scenes 12 and 14A would move together; Friday interiors remain unchanged.", evidence: ["Shoot-day records: Canal pursuit, scenes 12 and 14A"] },
      { agent: "research", label: "Research", status: "skipped", summary: "Live Parallel Search is disabled in demo mode.", evidence: ["Configure PARALLEL_API_KEY for current public-web evidence"] },
      { agent: "weather", label: "Weather & Risk", status: "skipped", summary: "No live forecast is asserted in demo mode.", evidence: ["Run live analysis before an operational decision"] },
      { agent: "crew", label: "Crew", status: "complete", summary: "Five of six assigned crew are available Saturday; gaffer coverage is missing.", evidence: ["Crew availability: 83%", "Missing: Gaffer"] },
      { agent: "budget", label: "Budget", status: "complete", summary: "One additional equipment day is recorded at £2,900, before labour or location fees.", evidence: ["Schedule record: equipmentDailyCost £2,900"] },
      { agent: "decision", label: "Decision", status: "complete", summary: "Use Saturday as a cover option, not a confirmed move, until missing evidence is resolved.", evidence: ["Crew, cost, research, and safety findings combined"] }
    ],
    sources: [],
    mode: "demo",
    generatedAt: new Date().toISOString()
  };
}
