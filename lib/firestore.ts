import { Firestore, FieldValue } from "@google-cloud/firestore";
import { demoProduction } from "./demo-data";
import type { CrewMember, DecisionResponse, ProductionContext, ProductionLocation, ShootDay } from "./types";

let database: Firestore | undefined;

function firestore() {
  if (!database) {
    database = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      databaseId: process.env.FIRESTORE_DATABASE_ID || "(default)"
    });
  }
  return database;
}

export async function loadProduction(id: string): Promise<ProductionContext> {
  const snapshot = await firestore().collection("productions").doc(id).get();
  if (!snapshot.exists && id === demoProduction.id) return structuredClone(demoProduction);
  if (!snapshot.exists) throw new Error("Production not found");
  return snapshot.data() as ProductionContext;
}

type ProductionResource = "crew" | "shootDays" | "locations";
type ProductionItem = CrewMember | ShootDay | ProductionLocation;

export async function saveProductionResource(
  productionId: string,
  resource: ProductionResource,
  items: ProductionItem[]
) {
  return saveProductionChanges(productionId, { [resource]: items });
}

export async function saveProductionChanges(
  productionId: string,
  changes: Partial<Pick<ProductionContext, ProductionResource>>
) {
  const reference = firestore().collection("productions").doc(productionId);
  const snapshot = await reference.get();
  if (!snapshot.exists && productionId !== demoProduction.id) throw new Error("Production not found");
  const base = snapshot.exists ? snapshot.data() as ProductionContext : demoProduction;
  await reference.set({ ...base, ...changes, updatedAt: FieldValue.serverTimestamp() });
}

export async function saveAgentLog(productionId: string, question: string, result: DecisionResponse) {
  await firestore().collection("agent_logs").add({
    productionId,
    question,
    result,
    createdAt: FieldValue.serverTimestamp()
  });
}
