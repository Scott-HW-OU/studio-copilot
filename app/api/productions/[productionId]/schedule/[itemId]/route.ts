import { deleteItem, updateItem } from "@/lib/resource-api";
export const runtime = "nodejs";
type Params = { params: Promise<{ productionId: string; itemId: string }> };
export async function PATCH(request: Request, { params }: Params) { const value = await params; return updateItem(request, value.productionId, value.itemId, "schedule"); }
export async function DELETE(request: Request, { params }: Params) { const value = await params; return deleteItem(request, value.productionId, value.itemId, "schedule"); }
