import type { ProductionContext } from "./types";

export const demoProduction: ProductionContext = {
  id: "north-star",
  name: "North Star",
  currency: "GBP",
  crew: [
    { id: "c1", name: "Maya Chen", role: "Director", available: ["2026-09-03", "2026-09-05"], dayRate: 850, email: "maya@example.test", phone: "+44 7700 900101" },
    { id: "c2", name: "Jon Bell", role: "1st AD", available: ["2026-09-03", "2026-09-05"], dayRate: 540, email: "jon@example.test", phone: "+44 7700 900102" },
    { id: "c3", name: "Priya Shah", role: "Director of Photography", available: ["2026-09-03", "2026-09-05"], dayRate: 720 },
    { id: "c4", name: "Ellis Grant", role: "Gaffer", available: ["2026-09-03"], dayRate: 420 },
    { id: "c5", name: "Ana Costa", role: "Sound Mixer", available: ["2026-09-03", "2026-09-05"], dayRate: 460 },
    { id: "c6", name: "Tom Okafor", role: "Drone Operator", available: ["2026-09-03", "2026-09-05"], dayRate: 510 }
  ],
  shootDays: [
    { id: "s1", date: "2026-09-03", title: "Canal pursuit", location: "Castlefield, Manchester, UK", locationId: "l1", type: "Exterior", scenes: ["12", "14A"], crewIds: ["c1", "c2", "c3", "c4", "c5", "c6"], equipmentDailyCost: 2900 },
    { id: "s2", date: "2026-09-04", title: "Warehouse interiors", location: "Trafford Park, Manchester, UK", locationId: "l2", type: "Interior", scenes: ["15", "16", "18"], crewIds: ["c1", "c2", "c3", "c4", "c5"], equipmentDailyCost: 2300 }
  ],
  locations: [
    { id: "l1", name: "Castlefield Canal", address: "Liverpool Road", city: "Manchester", postcode: "M3 4FP", contactName: "Location Office", notes: "Exterior unit base and canal access." },
    { id: "l2", name: "Trafford Warehouse", address: "Village Way", city: "Trafford Park", postcode: "M17 1HR", contactName: "Site Manager", notes: "Interior stage; loading access at rear." }
  ]
};
