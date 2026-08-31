export type AgentName = "production" | "research" | "weather" | "crew" | "budget" | "decision";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  available: string[];
  dayRate: number;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ProductionLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
}

export interface ShootDay {
  id: string;
  date: string;
  title: string;
  location: string;
  locationId?: string;
  type: "Interior" | "Exterior";
  scenes: string[];
  crewIds: string[];
  equipmentDailyCost: number;
}

export interface ProductionContext {
  id: string;
  name: string;
  currency: "GBP";
  crew: CrewMember[];
  shootDays: ShootDay[];
  locations: ProductionLocation[];
}

export interface Source {
  title: string;
  url: string;
  excerpt?: string;
}

export interface AgentFinding {
  agent: AgentName;
  label: string;
  status: "complete" | "skipped" | "error";
  summary: string;
  evidence: string[];
}

export interface DecisionResponse {
  recommendation: string;
  confidence: number;
  summary: string;
  risks: string[];
  actions: string[];
  agents: AgentFinding[];
  sources: Source[];
  mode: "live" | "demo";
  generatedAt: string;
}
