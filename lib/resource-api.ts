import { NextResponse } from "next/server";
import { authenticateRequest, authError } from "./firebase-server";
import { loadProduction, saveProductionChanges, saveProductionResource } from "./firestore";
import { crewMemberInputSchema, locationInputSchema, shootDayInputSchema } from "./schemas";
import type { CrewMember, ProductionLocation, ShootDay } from "./types";

export type ResourceName = "crew" | "schedule" | "locations";
type ResourceItem = CrewMember | ShootDay | ProductionLocation;

const schemas = { crew: crewMemberInputSchema, schedule: shootDayInputSchema, locations: locationInputSchema };
const fields = { crew: "crew", schedule: "shootDays", locations: "locations" } as const;
const prefixes = { crew: "crew", schedule: "shoot", locations: "loc" };

async function context(request: Request, productionId: string) {
  const user = await authenticateRequest(request);
  if (user instanceof NextResponse) return user;
  try {
    const production = await loadProduction(productionId);
    if (production.memberUids?.length && !production.memberUids.includes(user.uid)) {
      return authError("You do not have access to this production.", 403);
    }
    return { user, production };
  } catch {
    return authError("Production not found.", 404);
  }
}

function locationLabel(location: ProductionLocation) {
  return [location.name, location.address, location.city, location.postcode].filter(Boolean).join(", ");
}

function enrich(item: Record<string, unknown>, resource: ResourceName, production: Awaited<ReturnType<typeof loadProduction>>) {
  if (resource !== "schedule") return item;
  const location = production.locations.find((entry) => entry.id === item.locationId);
  if (!location) throw new Error("Select a valid production location.");
  return { ...item, location: locationLabel(location) };
}

export async function listItems(request: Request, productionId: string, resource: ResourceName) {
  const result = await context(request, productionId);
  if (result instanceof NextResponse) return result;
  return NextResponse.json({ items: result.production[fields[resource]] }, { headers: { "Cache-Control": "no-store" } });
}

export async function createItem(request: Request, productionId: string, resource: ResourceName) {
  const result = await context(request, productionId);
  if (result instanceof NextResponse) return result;
  let body: unknown;
  try { body = await request.json(); } catch { return authError("Request body must be valid JSON.", 400); }
  const parsed = schemas[resource].safeParse(body);
  if (!parsed.success) return authError(parsed.error.issues[0]?.message || "Invalid record.", 400);
  try {
    const item = enrich({ ...parsed.data, id: `${prefixes[resource]}_${crypto.randomUUID().slice(0, 12)}` }, resource, result.production) as unknown as ResourceItem;
    const items = [...result.production[fields[resource]], item] as ResourceItem[];
    await saveProductionResource(productionId, fields[resource], items);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) { return authError(error instanceof Error ? error.message : "Unable to create record.", 400); }
}

export async function updateItem(request: Request, productionId: string, itemId: string, resource: ResourceName) {
  const result = await context(request, productionId);
  if (result instanceof NextResponse) return result;
  let body: unknown;
  try { body = await request.json(); } catch { return authError("Request body must be valid JSON.", 400); }
  const parsed = schemas[resource].safeParse(body);
  if (!parsed.success) return authError(parsed.error.issues[0]?.message || "Invalid record.", 400);
  const current = result.production[fields[resource]] as ResourceItem[];
  if (!current.some((item) => item.id === itemId)) return authError("Record not found.", 404);
  try {
    const item = enrich({ ...parsed.data, id: itemId }, resource, result.production) as unknown as ResourceItem;
    const updated = current.map((entry) => entry.id === itemId ? item : entry);
    if (resource === "locations") {
      const location = item as ProductionLocation;
      const shootDays = result.production.shootDays.map((day) => day.locationId === itemId ? { ...day, location: locationLabel(location) } : day);
      await saveProductionChanges(productionId, { locations: updated as ProductionLocation[], shootDays });
    } else {
      await saveProductionResource(productionId, fields[resource], updated);
    }
    return NextResponse.json({ item });
  } catch (error) { return authError(error instanceof Error ? error.message : "Unable to update record.", 400); }
}

export async function deleteItem(request: Request, productionId: string, itemId: string, resource: ResourceName) {
  const result = await context(request, productionId);
  if (result instanceof NextResponse) return result;
  if (resource === "locations" && result.production.shootDays.some((day) => day.locationId === itemId)) {
    return authError("This location is used by a scheduled shoot and cannot be deleted.", 409);
  }
  if (resource === "crew" && result.production.shootDays.some((day) => day.crewIds.includes(itemId))) {
    return authError("This crew member is assigned to a scheduled shoot and cannot be deleted.", 409);
  }
  const current = result.production[fields[resource]] as ResourceItem[];
  if (!current.some((item) => item.id === itemId)) return authError("Record not found.", 404);
  await saveProductionResource(productionId, fields[resource], current.filter((item) => item.id !== itemId));
  return new NextResponse(null, { status: 204 });
}
