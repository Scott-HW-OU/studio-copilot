import { NextResponse } from "next/server";
import { createDemoResponse } from "@/lib/demo-response";
import { loadProduction, saveAgentLog } from "@/lib/firestore";
import { runDecisionAgent } from "@/lib/gemini";
import { searchProductionContext } from "@/lib/parallel";
import { decisionRequestSchema } from "@/lib/schemas";
import { authenticateRequest } from "@/lib/firebase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

function clientError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (user instanceof NextResponse) return user;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return clientError("Request body must be valid JSON.");
  }

  const parsed = decisionRequestSchema.safeParse(body);
  if (!parsed.success) return clientError(parsed.error.issues[0]?.message || "Invalid request.");

  if (process.env.STUDIOCOPILOT_DEMO_MODE === "true") {
    return NextResponse.json(createDemoResponse(), { headers: { "Cache-Control": "no-store" } });
  }
  if (!process.env.PARALLEL_API_KEY || !process.env.GOOGLE_CLOUD_PROJECT) {
    return clientError("Live analysis is not configured. Set PARALLEL_API_KEY and GOOGLE_CLOUD_PROJECT, or explicitly enable demo mode.", 503);
  }

  try {
    const production = await loadProduction(parsed.data.productionId);
    if (production.memberUids?.length && !production.memberUids.includes(user.uid)) {
      return clientError("You do not have access to this production.", 403);
    }
    const locations = production.shootDays.map((day) => day.location).join("; ");
    const objective = "Find current, authoritative information relevant to this film-production decision: " +
      parsed.data.message + ". Production locations: " + locations +
      ". Focus on official permit guidance, transport disruption, local events, weather, and operational hazards.";
    const research = await searchProductionContext(objective);
    const result = await runDecisionAgent({
      question: parsed.data.message,
      production,
      research: research.summary,
      sources: research.sources
    });

    const response = {
      recommendation: result.recommendation,
      confidence: result.confidence,
      summary: result.summary,
      risks: result.risks,
      actions: result.actions,
      agents: result.agent_findings.map((finding) => ({ ...finding, status: "complete" as const })),
      sources: research.sources,
      mode: "live" as const,
      generatedAt: new Date().toISOString()
    };
    await saveAgentLog(parsed.data.productionId, parsed.data.message, response).catch((logError) => {
      console.error("Agent log write failed", logError instanceof Error ? logError.message : "Unknown error");
    });
    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Decision workflow failed", error instanceof Error ? error.message : "Unknown error");
    return clientError("The live agent workflow could not complete. Please retry; no production records were changed.", 502);
  }
}
