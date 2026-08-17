import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "./connection";
import {
  algorithms,
  designs,
  equipment,
  itConfigurations,
  itNodeTypes,
  paramAudits,
  parameters,
  vendors,
} from "../../db/schema";
import type { EngineEquipment, EngineItConfig, EngineParams } from "../engine/dcgen";

// ---------------- Vendors ----------------
export async function listVendors() {
  return getDb().select().from(vendors).orderBy(asc(vendors.name));
}

// ---------------- Equipment ----------------
export interface EquipmentFilter {
  category?: string;
  vendor?: string;
  search?: string;
  deltaOnly?: boolean;
}

export async function listEquipment(filter: EquipmentFilter = {}) {
  const db = getDb();
  const conds = [];
  if (filter.category) conds.push(eq(equipment.category, filter.category));
  if (filter.vendor) conds.push(eq(equipment.vendorName, filter.vendor));
  if (filter.deltaOnly) conds.push(like(equipment.vendorName, "%Delta%"));
  if (filter.search) {
    conds.push(
      or(like(equipment.name, `%${filter.search}%`), like(equipment.vendorName, `%${filter.search}%`)),
    );
  }
  const q = db.select().from(equipment).orderBy(asc(equipment.category), asc(equipment.vendorName), asc(equipment.name));
  return conds.length ? q.where(and(...conds)) : q;
}

export async function listAllEquipmentForEngine(): Promise<EngineEquipment[]> {
  const rows = await getDb().select().from(equipment).where(eq(equipment.engineEligible, true));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    vendorName: r.vendorName,
    category: r.category,
    capacityKw: r.capacityKw,
    peakPowerConsumptionKw: r.peakPowerConsumptionKw,
    efficiency: r.efficiency,
    heightM: r.heightM,
    widthM: r.widthM,
    depthM: r.depthM,
    accessAreaShare: r.accessAreaShare,
  }));
}

// ---------------- IT configurations ----------------
export async function listItConfigs(filter: { datacenterType?: string; model?: string; generation?: string } = {}) {
  const db = getDb();
  const conds = [];
  if (filter.datacenterType) conds.push(eq(itConfigurations.datacenterType, filter.datacenterType));
  if (filter.model) conds.push(eq(itConfigurations.model, filter.model));
  if (filter.generation) conds.push(eq(itConfigurations.generation, filter.generation));
  const configs = await (conds.length
    ? db.select().from(itConfigurations).where(and(...conds)).orderBy(asc(itConfigurations.model), asc(itConfigurations.name))
    : db.select().from(itConfigurations).orderBy(asc(itConfigurations.model), asc(itConfigurations.name)));
  const nodes = await db.select().from(itNodeTypes);
  return configs.map((c) => ({
    ...c,
    nodeTypes: nodes.filter((n) => n.configId === c.id),
  }));
}

export async function listItConfigsForEngine(
  datacenterType: string,
  model: string,
  generation?: string,
): Promise<EngineItConfig[]> {
  const rows = await listItConfigs({
    datacenterType,
    model,
    generation: generation && generation !== "All" ? generation : undefined,
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    datacenterType: r.datacenterType,
    model: r.model,
    rackSize: r.rackSize,
    rackType: r.rackType,
    floorSpace: r.floorSpace,
    generation: r.generation,
    nodeTypes: r.nodeTypes.map((n) => ({ nodeType: n.nodeType, rackCount: n.rackCount, rackTdp: n.rackTdp })),
  }));
}

// ---------------- Parameters ----------------
export async function listParameters() {
  return getDb().select().from(parameters).orderBy(asc(parameters.category), asc(parameters.key));
}

export async function getParameterMap(): Promise<EngineParams> {
  const rows = await getDb().select().from(parameters);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function listParamAudits(limit = 50) {
  return getDb().select().from(paramAudits).orderBy(desc(paramAudits.createdAt)).limit(limit);
}

// ---------------- Algorithms ----------------
export async function listAlgorithms() {
  return getDb().select().from(algorithms).orderBy(asc(algorithms.isBuiltin), asc(algorithms.category), asc(algorithms.key));
}

// ---------------- Designs ----------------
export async function listDesigns(limit = 100) {
  return getDb().select().from(designs).orderBy(desc(designs.createdAt)).limit(limit);
}

// ---------------- Stats ----------------
export async function getStats() {
  const db = getDb();
  const [eqCount] = await db.select({ n: sql<number>`count(*)` }).from(equipment);
  const [vendorCount] = await db.select({ n: sql<number>`count(distinct ${equipment.vendorName})` }).from(equipment);
  const [deltaCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(equipment)
    .where(like(equipment.vendorName, "%Delta%"));
  const [itCount] = await db.select({ n: sql<number>`count(*)` }).from(itConfigurations);
  const [designCount] = await db.select({ n: sql<number>`count(*)` }).from(designs);
  const [algoCount] = await db.select({ n: sql<number>`count(*)` }).from(algorithms);
  const [paramCount] = await db.select({ n: sql<number>`count(*)` }).from(parameters);
  const cats = await db
    .select({ category: equipment.category, n: sql<number>`count(*)` })
    .from(equipment)
    .groupBy(equipment.category);
  const topVendors = await db
    .select({ vendor: equipment.vendorName, n: sql<number>`count(*)` })
    .from(equipment)
    .groupBy(equipment.vendorName)
    .orderBy(desc(sql`count(*)`))
    .limit(8);
  return {
    equipmentCount: eqCount.n,
    vendorCount: vendorCount.n,
    deltaCount: deltaCount.n,
    itConfigCount: itCount.n,
    designCount: designCount.n,
    algorithmCount: algoCount.n,
    parameterCount: paramCount.n,
    categoryBreakdown: cats,
    topVendors,
  };
}
