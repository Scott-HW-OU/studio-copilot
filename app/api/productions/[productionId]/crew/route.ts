import { createItem, listItems } from "@/lib/resource-api";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ productionId: string }> }) { return listItems(request, (await params).productionId, "crew"); }
export async function POST(request: Request, { params }: { params: Promise<{ productionId: string }> }) { return createItem(request, (await params).productionId, "crew"); }
