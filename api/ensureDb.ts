/**
 * 啟動時確保資料庫結構與種子資料（冪等）。
 * - CREATE TABLE IF NOT EXISTS（與 db/schema.ts 對應）
 * - 若 equipment 為空則執行完整 seed
 * 以 shared promise 保證只執行一次；失敗時重設，下次請求重試。
 */
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./queries/connection";
import {
  algorithms,
  equipment,
  itConfigurations,
  itNodeTypes,
  parameters,
  vendors,
} from "../db/schema";
import { seedAlgorithms, seedEquipment, seedItConfigs, seedParameters } from "../db/seed-data";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS vendors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    country VARCHAR(64),
    website VARCHAR(255),
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS equipment (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    vendor_id BIGINT UNSIGNED NULL,
    vendor_name VARCHAR(191),
    category VARCHAR(32) NOT NULL,
    capacity_kw DOUBLE NOT NULL,
    peak_power_consumption_kw DOUBLE,
    efficiency DOUBLE,
    height_m DOUBLE,
    width_m DOUBLE,
    depth_m DOUBLE,
    access_area_share DOUBLE NOT NULL DEFAULT 0.2,
    generation VARCHAR(16),
    source_url VARCHAR(512),
    notes TEXT,
    is_custom TINYINT(1) NOT NULL DEFAULT 0,
    engine_eligible TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_equipment_category (category),
    INDEX idx_equipment_vendor (vendor_name)
  )`,
  `CREATE TABLE IF NOT EXISTS it_configurations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    datacenter_type VARCHAR(64) NOT NULL,
    model VARCHAR(16) NOT NULL,
    rack_size INT NOT NULL,
    rack_type VARCHAR(16) NOT NULL,
    floor_space DOUBLE NOT NULL,
    generation VARCHAR(16) NOT NULL,
    source_url VARCHAR(512),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_itconfig_type (datacenter_type, model)
  )`,
  `CREATE TABLE IF NOT EXISTS it_node_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    config_id BIGINT UNSIGNED NOT NULL,
    node_type VARCHAR(32) NOT NULL,
    rack_count INT NOT NULL,
    rack_tdp DOUBLE NOT NULL,
    INDEX idx_itnode_config (config_id)
  )`,
  `CREATE TABLE IF NOT EXISTS parameters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`key\` VARCHAR(191) NOT NULL UNIQUE,
    value DOUBLE NOT NULL,
    default_value DOUBLE NOT NULL,
    unit VARCHAR(32),
    category VARCHAR(64) NOT NULL,
    description TEXT,
    is_custom TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS param_audits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parameter_key VARCHAR(191) NOT NULL,
    old_value DOUBLE,
    new_value DOUBLE NOT NULL,
    action VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS algorithms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`key\` VARCHAR(191) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    formula TEXT,
    formula_display TEXT,
    paper_ref VARCHAR(64),
    parameter_bindings TEXT,
    is_builtin TINYINT(1) NOT NULL DEFAULT 0,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    version VARCHAR(16) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS designs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    input TEXT NOT NULL,
    result TEXT NOT NULL,
    parameter_snapshot TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS layouts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    design_id BIGINT UNSIGNED NULL,
    config_name VARCHAR(255),
    criterion VARCHAR(16),
    layout TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
];

/** 欄位漂移防護：舊部署的 equipment 表可能缺後來新增的欄位 */
const DRIFT_COLUMNS: { table: string; column: string; ddl: string }[] = [
  { table: "equipment", column: "engine_eligible", ddl: "ALTER TABLE equipment ADD COLUMN engine_eligible TINYINT(1) NOT NULL DEFAULT 1" },
];

const VENDOR_META: Record<string, { country?: string; website?: string; featured?: boolean }> = {
  "Delta Electronics": { country: "台灣", website: "https://www.deltaww.com", featured: true },
  Vertiv: { country: "美國", website: "https://www.vertiv.com" },
  "Schneider Electric": { country: "法國", website: "https://www.se.com" },
  "Schneider Electric (APC)": { country: "法國", website: "https://www.apc.com" },
  Caterpillar: { country: "美國", website: "https://www.cat.com" },
  Cummins: { country: "美國", website: "https://www.cummins.com" },
  Huawei: { country: "中國", website: "https://digitalpower.huawei.com" },
  Eaton: { country: "愛爾蘭", website: "https://www.eaton.com" },
  Evapco: { country: "美國", website: "https://www.evapco.com" },
};

/** 審計修正（2026-08-17）：僅在資料列仍為舊種子值時套用（不覆寫使用者已修改的列） */
const SEED_PATCHES: { name: string; matchCapacity: number; set: Record<string, number | string | null> }[] = [
  {
    name: "Vertiv CoolChip 100",
    matchCapacity: 1000,
    set: {
      capacityKw: 100,
      peakPowerConsumptionKw: 0.7,
      heightM: 0.175,
      widthM: 0.445,
      depthM: 0.83,
      sourceUrl:
        "https://www.vertiv.com/492989/globalassets/products/thermal-management/high-density-solutions/vertiv-coolchip-cdu/vertiv-coolchip-cdu-100kw-data-sheet-sl-71348.pdf",
    },
  },
  { name: "Caterpillar Diesel-C1.1", matchCapacity: 8.8, set: { heightM: 0.996 } },
  { name: "Huawei UPS5000-H 1200kVA", matchCapacity: 1080, set: { capacityKw: 1200 } },
  { name: "Vertiv UL1066-2000A", matchCapacity: 12000, set: { capacityKw: 1660 } },
];

/** 增量種子：補入新型號（依名稱）、套用審計修正（僅當列仍為舊值） */
export async function seedDelta() {
  const db = getDb();
  const existing = await db.select().from(equipment);
  const names = new Set(existing.map((r) => r.name));
  const vendorNames = await db.select().from(vendors);
  const vendorIdMap = new Map(vendorNames.map((v) => [v.name, v.id]));

  let inserted = 0;
  for (const e of seedEquipment) {
    if (names.has(e.name)) continue;
    if (!vendorIdMap.has(e.vendor)) {
      const meta = VENDOR_META[e.vendor] ?? {};
      const r = await db.insert(vendors).values({
        name: e.vendor,
        country: meta.country ?? null,
        website: meta.website ?? null,
        isFeatured: meta.featured ?? false,
      });
      vendorIdMap.set(e.vendor, Number(r[0].insertId));
    }
    await db.insert(equipment).values({
      name: e.name,
      vendorId: vendorIdMap.get(e.vendor) ?? null,
      vendorName: e.vendor,
      category: e.category,
      capacityKw: e.capacityKw,
      peakPowerConsumptionKw: e.peakPowerConsumptionKw,
      efficiency: e.efficiency,
      heightM: e.heightM,
      widthM: e.widthM,
      depthM: e.depthM,
      accessAreaShare: e.accessAreaShare,
      generation: e.generation,
      sourceUrl: e.sourceUrl,
      notes: e.notes,
      isCustom: e.isCustom,
      engineEligible: e.engineEligible,
    });
    inserted++;
  }
  if (inserted) console.log(`[ensureDb] 增量種子新增 ${inserted} 項設備`);

  for (const patch of SEED_PATCHES) {
    await db
      .update(equipment)
      .set(patch.set)
      .where(and(eq(equipment.name, patch.name), eq(equipment.capacityKw, patch.matchCapacity)));
  }
}

async function seedIfEmpty() {
  const db = getDb();
  const [eqCount] = await db.select({ n: sql<number>`count(*)` }).from(equipment);
  if (eqCount.n > 0) {
    console.log(`[ensureDb] 資料已存在（equipment=${eqCount.n}），執行增量種子`);
    await seedDelta();
    return;
  }
  console.log("[ensureDb] 開始寫入種子資料…");

  const vendorNames = [...new Set(seedEquipment.map((e) => e.vendor))];
  const vendorIdMap = new Map<string, number>();
  for (const name of vendorNames) {
    const meta = VENDOR_META[name] ?? {};
    const r = await db.insert(vendors).values({
      name,
      country: meta.country ?? null,
      website: meta.website ?? null,
      isFeatured: meta.featured ?? false,
    });
    vendorIdMap.set(name, Number(r[0].insertId));
  }

  for (const e of seedEquipment) {
    await db.insert(equipment).values({
      name: e.name,
      vendorId: vendorIdMap.get(e.vendor) ?? null,
      vendorName: e.vendor,
      category: e.category,
      capacityKw: e.capacityKw,
      peakPowerConsumptionKw: e.peakPowerConsumptionKw,
      efficiency: e.efficiency,
      heightM: e.heightM,
      widthM: e.widthM,
      depthM: e.depthM,
      accessAreaShare: e.accessAreaShare,
      generation: e.generation,
      sourceUrl: e.sourceUrl,
      notes: e.notes,
      isCustom: e.isCustom,
      engineEligible: e.engineEligible,
    });
  }

  for (const c of seedItConfigs) {
    const r = await db.insert(itConfigurations).values({
      name: c.name,
      datacenterType: c.datacenterType,
      model: c.model,
      rackSize: c.rackSize,
      rackType: c.rackType,
      floorSpace: c.floorSpace,
      generation: c.generation,
      sourceUrl: c.sourceUrl,
      notes: c.notes,
    });
    const configId = Number(r[0].insertId);
    await db.insert(itNodeTypes).values(c.nodeTypes.map((n) => ({ ...n, configId })));
  }

  for (const p of seedParameters) {
    await db.insert(parameters).values({
      key: p.key,
      value: p.value,
      defaultValue: p.value,
      unit: p.unit,
      category: p.category,
      description: p.description,
      isCustom: false,
    });
  }

  for (const a of seedAlgorithms) {
    await db.insert(algorithms).values({
      key: a.key,
      name: a.name,
      category: a.category,
      description: a.description,
      formula: a.formula,
      formulaDisplay: a.formulaDisplay,
      paperRef: a.paperRef,
      parameterBindings: "{}",
      isBuiltin: true,
      enabled: true,
    });
  }
  console.log(
    `[ensureDb] seed 完成：vendors=${vendorNames.length} equipment=${seedEquipment.length} itConfigs=${seedItConfigs.length} parameters=${seedParameters.length} algorithms=${seedAlgorithms.length}`,
  );
}

let inflight: Promise<void> | null = null;
let lastError: string | null = null;
let lastOkAt: string | null = null;

export function ensureDb(): Promise<void> {
  if (!inflight) {
    inflight = (async () => {
      const db = getDb();
      for (const stmt of DDL) {
        await db.execute(sql.raw(stmt));
      }
      // 欄位漂移防護（舊表缺新欄位時補欄位）
      for (const d of DRIFT_COLUMNS) {
        const rows = await db.execute(
          sql.raw(
            `SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${d.table}' AND COLUMN_NAME = '${d.column}'`,
          ),
        );
        const n = Number((rows[0] as unknown as { n: number }[])[0]?.n ?? 0);
        if (n === 0) {
          console.log(`[ensureDb] 補欄位 ${d.table}.${d.column}`);
          await db.execute(sql.raw(d.ddl));
        }
      }
      await seedIfEmpty();
      lastOkAt = new Date().toISOString();
      lastError = null;
    })().catch((err) => {
      inflight = null; // 失敗時允許下次重試
      lastError = err instanceof Error ? `${err.message}` : String(err);
      console.error("[ensureDb] 失敗：", lastError);
      throw err;
    });
  }
  return inflight;
}

/** 診斷用：初始化狀態 + 各表筆數 */
export async function getDbStatus() {
  let ensureState: "ok" | "error" | "pending" = "pending";
  try {
    await ensureDb();
    ensureState = "ok";
  } catch {
    ensureState = "error";
  }
  const counts: Record<string, number | string> = {};
  if (ensureState === "ok") {
    const db = getDb();
    for (const t of ["vendors", "equipment", "it_configurations", "it_node_types", "parameters", "algorithms", "designs", "layouts"]) {
      try {
        const r = await db.execute(sql.raw(`SELECT COUNT(*) n FROM \`${t}\``));
        counts[t] = Number((r[0] as unknown as { n: number }[])[0]?.n ?? 0);
      } catch (e) {
        counts[t] = `ERR: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  }
  return {
    ensureState,
    lastError,
    lastOkAt,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV ?? null,
    counts,
  };
}
