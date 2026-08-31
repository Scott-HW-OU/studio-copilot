import { z } from "zod";

export const decisionRequestSchema = z.object({
  message: z.string().trim().min(3).max(1200),
  productionId: z.string().trim().min(1).max(80).default("north-star")
});

export const geminiDecisionSchema = z.object({
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  risks: z.array(z.string()).max(8),
  actions: z.array(z.string()).max(8),
  agent_findings: z.array(z.object({
    agent: z.enum(["production", "research", "weather", "crew", "budget", "decision"]),
    label: z.string(),
    summary: z.string(),
    evidence: z.array(z.string()).max(8)
  }))
});

const idSchema = z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
const optionalText = z.string().trim().max(500).optional().default("");

export const crewMemberInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200).or(z.literal("")).optional().default(""),
  phone: z.string().trim().max(50).optional().default(""),
  notes: optionalText,
  dayRate: z.coerce.number().min(0).max(100000),
  available: z.array(z.string().date()).max(100).default([])
});

export const locationInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(250),
  city: z.string().trim().min(1).max(120),
  postcode: z.string().trim().min(1).max(30),
  contactName: z.string().trim().max(120).optional().default(""),
  contactPhone: z.string().trim().max(50).optional().default(""),
  notes: optionalText
});

export const shootDayInputSchema = z.object({
  date: z.string().date(),
  title: z.string().trim().min(1).max(160),
  locationId: idSchema,
  type: z.enum(["Interior", "Exterior"]),
  scenes: z.array(z.string().trim().min(1).max(30)).max(100),
  crewIds: z.array(idSchema).max(200),
  equipmentDailyCost: z.coerce.number().min(0).max(10000000)
});
