import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  double,
  boolean,
} from "drizzle-orm/mysql-core";

/** 廠商（台達電子 isFeatured=true） */
export const vendors = mysqlTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 191 }).notNull().unique(),
  country: varchar("country", { length: 64 }),
  website: varchar("website", { length: 255 }),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 非 IT 設備型錄（8 類：cdu/chiller/dry_cooler/cooling_tower/pdu/ups/msb/generator） */
export const equipment = mysqlTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  vendorId: bigint("vendor_id", { mode: "number", unsigned: true }).references(() => vendors.id),
  vendorName: varchar("vendor_name", { length: 191 }),
  category: varchar("category", { length: 32 }).notNull(),
  capacityKw: double("capacity_kw").notNull(),
  peakPowerConsumptionKw: double("peak_power_consumption_kw"),
  efficiency: double("efficiency"),
  heightM: double("height_m"),
  widthM: double("width_m"),
  depthM: double("depth_m"),
  accessAreaShare: double("access_area_share").notNull().default(0.2),
  generation: varchar("generation", { length: 16 }),
  sourceUrl: varchar("source_url", { length: 512 }),
  notes: text("notes"),
  isCustom: boolean("is_custom").notNull().default(false),
  engineEligible: boolean("engine_eligible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/** IT 參考/標準資料中心配置 */
export const itConfigurations = mysqlTable("it_configurations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  datacenterType: varchar("datacenter_type", { length: 64 }).notNull(),
  model: varchar("model", { length: 16 }).notNull(), // Canonical | Reference
  rackSize: int("rack_size").notNull(),
  rackType: varchar("rack_type", { length: 16 }).notNull(), // Cloud | HPC
  floorSpace: double("floor_space").notNull(), // m2/rack
  generation: varchar("generation", { length: 16 }).notNull(),
  sourceUrl: varchar("source_url", { length: 512 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/** IT 配置的節點型別明細 */
export const itNodeTypes = mysqlTable("it_node_types", {
  id: serial("id").primaryKey(),
  configId: bigint("config_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => itConfigurations.id, { onDelete: "cascade" }),
  nodeType: varchar("node_type", { length: 32 }).notNull(),
  rackCount: int("rack_count").notNull(),
  rackTdp: double("rack_tdp").notNull(),
});

/** 全域模型參數（可調整、可新增 custom_） */
export const parameters = mysqlTable("parameters", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 191 }).notNull().unique(),
  value: double("value").notNull(),
  defaultValue: double("default_value").notNull(),
  unit: varchar("unit", { length: 32 }),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/** 參數變更紀錄 */
export const paramAudits = mysqlTable("param_audits", {
  id: serial("id").primaryKey(),
  parameterKey: varchar("parameter_key", { length: 191 }).notNull(),
  oldValue: double("old_value"),
  newValue: double("new_value").notNull(),
  action: varchar("action", { length: 16 }).notNull(), // update | create | reset | delete
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 算法註冊表（內建 DCGen 式 1–19 + 自訂算法） */
export const algorithms = mysqlTable("algorithms", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 191 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  formula: text("formula"), // 自訂算法：可求值公式字串；內建：展示用
  formulaDisplay: text("formula_display"),
  paperRef: varchar("paper_ref", { length: 64 }),
  parameterBindings: text("parameter_bindings"), // JSON: { varName: parameterKey }
  isBuiltin: boolean("is_builtin").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  version: varchar("version", { length: 16 }).notNull().default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/** 已儲存的配置情境 */
export const designs = mysqlTable("designs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  input: text("input").notNull(), // JSON GenerateInput
  result: text("result").notNull(), // JSON GenerateResult
  parameterSnapshot: text("parameter_snapshot"), // JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 配置圖工作室：使用者自訂版面（拖放/尺寸覆寫） */
export const layouts = mysqlTable("layouts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  designId: bigint("design_id", { mode: "number", unsigned: true }),
  configName: varchar("config_name", { length: 255 }),
  criterion: varchar("criterion", { length: 16 }),
  layout: text("layout").notNull(), // LayoutDoc JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
