import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    mode: process.env.STUDIOCOPILOT_DEMO_MODE === "true" ? "demo" : "live",
    geminiConfigured: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
    parallelConfigured: Boolean(process.env.PARALLEL_API_KEY)
  }, { headers: { "Cache-Control": "no-store" } });
}
