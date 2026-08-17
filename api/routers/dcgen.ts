import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
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
import {
  getParameterMap,
  getStats,
  listAlgorithms,
  listAllEquipmentForEngine,
  listDesigns,
  listEquipment,
  listItConfigs,
  listItConfigsForEngine,
  listParamAudits,
  listParameters,
  listVendors,
} from "../queries/dcgen";
import { computeDatacenter } from "../engine/dcgen";
import { evaluateFormula, extractVariables, validateFormula } from "../engine/expr";
import type { GenerateInput, GenerateResult } from "../../contracts/dcgen";

// ---------------- 共用 zod schema ----------------
const equipmentInput = z.object({
  name: z.string().min(1).max(191),
  vendorName: z.string().max(191).optional().nullable(),
  category: z.enum(["cdu", "chiller", "dry_cooler", "cooling_tower", "pdu", "ups", "msb", "generator"]),
  capacityKw: z.number().positive(),
  peakPowerConsumptionKw: z.number().nonnegative().optional().nullable(),
  efficiency: z.number().min(0).max(1).optional().nullable(),
  heightM: z.number().nonnegative().optional().nullable(),
  widthM: z.number().nonnegative().optional().nullable(),
  depthM: z.number().nonnegative().optional().nullable(),
  accessAreaShare: z.number().min(0).max(2).default(0.2),
  generation: z.string().max(16).optional().nullable(),
  sourceUrl: z.string().max(512).optional().nullable(),
  notes: z.string().optional().nullable(),
  engineEligible: z.boolean().optional(),
});

const nodeTypeInput = z.object({
  nodeType: z.string().min(1).max(32),
  rackCount: z.number().int().nonnegative(),
  rackTdp: z.number().nonnegative(),
});

const itConfigInput = z.object({
  name: z.string().min(1).max(191),
  datacenterType: z.enum(["AI training", "AI inference", "Mixed AI training and inference", "Cloud"]),
  model: z.enum(["Canonical", "Reference"]),
  rackSize: z.number().int().positive(),
  rackType: z.enum(["Cloud", "HPC"]),
  floorSpace: z.number().positive(),
  generation: z.string().min(1).max(16),
  sourceUrl: z.string().max(512).optional().nullable(),
  notes: z.string().optional().nullable(),
  nodeTypes: z.array(nodeTypeInput).min(1),
});

const generateInputSchema = z.object({
  datacenterUseCase: z.enum(["AI training", "AI inference", "Mixed AI training and inference", "Cloud"]),
  datacenterScale: z.union([
    z.object({ target: z.literal("rack_count"), capacity: z.number().int().positive() }),
    z.object({ target: z.literal("power_capacity"), capacity: z.string().min(1) }),
  ]),
  model: z.enum(["Canonical", "Reference"]),
  generation: z.string().default("2024"),
  specificDatacenters: z.union([z.literal("All"), z.array(z.string())]).default("All"),
  heatRejectionMode: z.enum(["Dry cooling", "Evaporative cooling"]),
  optimizationCriteria: z.array(z.enum(["Space", "Power"])).min(1),
  rackPerRow: z.number().int().positive(),
  rowsPerPod: z.number().int().positive(),
  safetyMargin: z.number().min(0),
  redundancy: z.object({
    heatRejection: z.string(),
    chillers: z.string(),
    cdus: z.string(),
    pdus: z.string(),
    upss: z.string(),
    msbs: z.string(),
    generators: z.string(),
  }),
});

// ---------------- 設備型錄 ----------------
export const catalogRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          category: z.string().optional(),
          vendor: z.string().optional(),
          search: z.string().optional(),
          deltaOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(({ input }) => listEquipment(input ?? {})),

  vendors: publicQuery.query(() => listVendors()),

  create: publicQuery.input(equipmentInput).mutation(async ({ input }) => {
    const db = getDb();
    let vendorId: number | null = null;
    if (input.vendorName) {
      const existing = await db.select().from(vendors).where(eq(vendors.name, input.vendorName));
      if (existing.length) vendorId = existing[0].id;
      else {
        await db.insert(vendors).values({ name: input.vendorName });
        const created = await db.select().from(vendors).where(eq(vendors.name, input.vendorName));
        vendorId = created[0]?.id ?? null;
      }
    }
    const result = await db.insert(equipment).values({ ...input, vendorId, isCustom: true });
    return { id: Number(result[0].insertId) };
  }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: equipmentInput.partial() }))
    .mutation(async ({ input }) => {
      await getDb().update(equipment).set(input.data).where(eq(equipment.id, input.id));
      return { ok: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await getDb().delete(equipment).where(eq(equipment.id, input.id));
    return { ok: true };
  }),
});

// ---------------- IT 配置 ----------------
export const itConfigRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          datacenterType: z.string().optional(),
          model: z.string().optional(),
          generation: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input }) => listItConfigs(input ?? {})),

  create: publicQuery.input(itConfigInput).mutation(async ({ input }) => {
    const db = getDb();
    const { nodeTypes: nodes, ...config } = input;
    const result = await db.insert(itConfigurations).values(config);
    const configId = Number(result[0].insertId);
    await db.insert(itNodeTypes).values(nodes.map((n) => ({ ...n, configId })));
    return { id: configId };
  }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: itConfigInput.partial() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { nodeTypes: nodes, ...config } = input.data;
      if (Object.keys(config).length) {
        await db.update(itConfigurations).set(config).where(eq(itConfigurations.id, input.id));
      }
      if (nodes) {
        await db.delete(itNodeTypes).where(eq(itNodeTypes.configId, input.id));
        if (nodes.length) {
          await db.insert(itNodeTypes).values(nodes.map((n) => ({ ...n, configId: input.id })));
        }
      }
      return { ok: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(itNodeTypes).where(eq(itNodeTypes.configId, input.id));
    await db.delete(itConfigurations).where(eq(itConfigurations.id, input.id));
    return { ok: true };
  }),
});

// ---------------- 參數 ----------------
export const parameterRouter = createRouter({
  list: publicQuery.query(() => listParameters()),
  audits: publicQuery.input(z.object({ limit: z.number().default(50) }).optional()).query(({ input }) =>
    listParamAudits(input?.limit ?? 50),
  ),

  update: publicQuery
    .input(z.object({ key: z.string(), value: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(parameters).where(eq(parameters.key, input.key));
      if (!rows.length) throw new Error(`參數不存在: ${input.key}`);
      await db.update(parameters).set({ value: input.value }).where(eq(parameters.key, input.key));
      await db.insert(paramAudits).values({
        parameterKey: input.key,
        oldValue: rows[0].value,
        newValue: input.value,
        action: "update",
      });
      return { ok: true };
    }),

  create: publicQuery
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .max(191)
          .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "key 僅能包含英數與底線"),
        value: z.number(),
        unit: z.string().max(32).optional().nullable(),
        category: z.string().max(64).default("自訂參數"),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const dup = await db.select().from(parameters).where(eq(parameters.key, input.key));
      if (dup.length) throw new Error(`參數 key 已存在: ${input.key}`);
      await db.insert(parameters).values({
        key: input.key,
        value: input.value,
        defaultValue: input.value,
        unit: input.unit ?? null,
        category: input.category,
        description: input.description ?? null,
        isCustom: true,
      });
      await db.insert(paramAudits).values({
        parameterKey: input.key,
        oldValue: null,
        newValue: input.value,
        action: "create",
      });
      return { ok: true };
    }),

  reset: publicQuery.input(z.object({ key: z.string() })).mutation(async ({ input }) => {
    const db = getDb();
    const rows = await db.select().from(parameters).where(eq(parameters.key, input.key));
    if (!rows.length) throw new Error(`參數不存在: ${input.key}`);
    await db.update(parameters).set({ value: rows[0].defaultValue }).where(eq(parameters.key, input.key));
    await db.insert(paramAudits).values({
      parameterKey: input.key,
      oldValue: rows[0].value,
      newValue: rows[0].defaultValue,
      action: "reset",
    });
    return { ok: true };
  }),

  delete: publicQuery.input(z.object({ key: z.string() })).mutation(async ({ input }) => {
    const db = getDb();
    const rows = await db.select().from(parameters).where(eq(parameters.key, input.key));
    if (!rows.length) throw new Error(`參數不存在: ${input.key}`);
    if (!rows[0].isCustom) throw new Error("內建參數不可刪除（可調整數值或還原預設）");
    await db.delete(parameters).where(eq(parameters.key, input.key));
    await db.insert(paramAudits).values({
      parameterKey: input.key,
      oldValue: rows[0].value,
      newValue: rows[0].value,
      action: "delete",
    });
    return { ok: true };
  }),
});

// ---------------- 算法 ----------------
export const algorithmRouter = createRouter({
  list: publicQuery.query(() => listAlgorithms()),

  create: publicQuery
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .max(191)
          .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "key 僅能包含英數與底線"),
        name: z.string().min(1).max(255),
        category: z.string().max(64).default("自訂算法"),
        description: z.string().optional().nullable(),
        formula: z.string().min(1),
        parameterBindings: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const check = validateFormula(input.formula);
      if (!check.ok) throw new Error(`公式語法錯誤：${check.error}`);
      const db = getDb();
      const dup = await db.select().from(algorithms).where(eq(algorithms.key, input.key));
      if (dup.length) throw new Error(`算法 key 已存在: ${input.key}`);
      await db.insert(algorithms).values({
        key: input.key,
        name: input.name,
        category: input.category,
        description: input.description ?? null,
        formula: input.formula,
        formulaDisplay: input.formula,
        parameterBindings: JSON.stringify(input.parameterBindings ?? {}),
        isBuiltin: false,
      });
      return { ok: true, variables: check.variables };
    }),

  update: publicQuery
    .input(
      z.object({
        key: z.string(),
        data: z.object({
          name: z.string().max(255).optional(),
          description: z.string().optional().nullable(),
          formula: z.string().optional(),
          parameterBindings: z.record(z.string(), z.string()).optional(),
          enabled: z.boolean().optional(),
          category: z.string().max(64).optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(algorithms).where(eq(algorithms.key, input.key));
      if (!rows.length) throw new Error(`算法不存在: ${input.key}`);
      const set: Record<string, unknown> = {};
      if (input.data.name !== undefined) set.name = input.data.name;
      if (input.data.description !== undefined) set.description = input.data.description;
      if (input.data.enabled !== undefined) set.enabled = input.data.enabled;
      if (input.data.category !== undefined) set.category = input.data.category;
      if (input.data.parameterBindings !== undefined)
        set.parameterBindings = JSON.stringify(input.data.parameterBindings);
      if (input.data.formula !== undefined) {
        if (rows[0].isBuiltin) throw new Error("內建算法的核心公式不可修改（可複製為自訂算法後調整）");
        const check = validateFormula(input.data.formula);
        if (!check.ok) throw new Error(`公式語法錯誤：${check.error}`);
        set.formula = input.data.formula;
        set.formulaDisplay = input.data.formula;
      }
      // 內建算法允許調整 bindings/說明/啟用，並升版號
      const [maj, min] = rows[0].version.split(".").map((x) => parseInt(x, 10));
      set.version = `${maj}.${(min || 0) + 1}`;
      await db.update(algorithms).set(set).where(eq(algorithms.key, input.key));
      return { ok: true };
    }),

  duplicate: publicQuery
    .input(z.object({ key: z.string(), newKey: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(algorithms).where(eq(algorithms.key, input.key));
      if (!rows.length) throw new Error(`算法不存在: ${input.key}`);
      const dup = await db.select().from(algorithms).where(eq(algorithms.key, input.newKey));
      if (dup.length) throw new Error(`算法 key 已存在: ${input.newKey}`);
      const src = rows[0];
      await db.insert(algorithms).values({
        key: input.newKey,
        name: `${src.name}（自訂複製）`,
        category: "自訂算法",
        description: src.description,
        formula: src.formula,
        formulaDisplay: src.formulaDisplay ?? src.formula,
        parameterBindings: src.parameterBindings,
        isBuiltin: false,
      });
      return { ok: true };
    }),

  delete: publicQuery.input(z.object({ key: z.string() })).mutation(async ({ input }) => {
    const db = getDb();
    const rows = await db.select().from(algorithms).where(eq(algorithms.key, input.key));
    if (!rows.length) throw new Error(`算法不存在: ${input.key}`);
    if (rows[0].isBuiltin) throw new Error("內建算法不可刪除（可停用）");
    await db.delete(algorithms).where(eq(algorithms.key, input.key));
    return { ok: true };
  }),

  /** 公式試算：自動帶入同名全域參數，使用者可覆寫 */
  test: publicQuery
    .input(
      z.object({
        formula: z.string().min(1),
        variables: z.record(z.string(), z.number()).default({}),
      }),
    )
    .mutation(async ({ input }) => {
      const varNames = extractVariables(input.formula);
      const params = await getParameterMap();
      const merged: Record<string, number> = {};
      for (const name of varNames) {
        if (input.variables[name] !== undefined) merged[name] = input.variables[name];
        else if (params[name] !== undefined) merged[name] = params[name];
        else throw new Error(`變數 ${name} 未提供數值，且無同名全域參數`);
      }
      const result = evaluateFormula(input.formula, merged);
      return { result, usedVariables: merged };
    }),

  validate: publicQuery.input(z.object({ formula: z.string() })).query(({ input }) => validateFormula(input.formula)),
});

// ---------------- 產生器 ----------------
export const generateRouter = createRouter({
  run: publicQuery.input(generateInputSchema).mutation(async ({ input }) => {
    const typed = input as GenerateInput;
    const [configs, equipmentRows, params] = await Promise.all([
      listItConfigsForEngine(
        typed.datacenterUseCase,
        typed.model,
        typed.model === "Canonical" ? typed.generation : undefined,
      ),
      listAllEquipmentForEngine(),
      getParameterMap(),
    ]);
    if (!configs.length) throw new Error("查無符合條件的 IT 配置（請確認類型/模型/年份篩選）");

    let targets = configs;
    if (typed.specificDatacenters !== "All") {
      const names = new Set(typed.specificDatacenters as string[]);
      targets = configs.filter((c) => names.has(c.name));
      if (!targets.length) throw new Error("指定的參考配置不存在於篩選結果中");
    }

    const results = targets.map((c) => computeDatacenter(c, typed, equipmentRows, params));
    const result: GenerateResult = {
      input: typed,
      parameterSnapshot: params,
      results,
      createdAt: new Date().toISOString(),
    };
    return result;
  }),

  saveDesign: publicQuery
    .input(z.object({ name: z.string().min(1).max(255), result: z.any() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const res = input.result as GenerateResult;
      const r = await db.insert(designs).values({
        name: input.name,
        input: JSON.stringify(res.input),
        result: JSON.stringify(res),
        parameterSnapshot: JSON.stringify(res.parameterSnapshot ?? {}),
      });
      return { id: Number(r[0].insertId) };
    }),
});

// ---------------- 情境 ----------------
export const designRouter = createRouter({
  list: publicQuery.query(async () => {
    const rows = await listDesigns();
    return rows.map((d) => {
      const input = JSON.parse(d.input) as GenerateInput;
      return {
        id: d.id,
        name: d.name,
        createdAt: d.createdAt,
        datacenterUseCase: input.datacenterUseCase,
        scale: input.datacenterScale,
        model: input.model,
      };
    });
  }),

  get: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const rows = await getDb().select().from(designs).where(eq(designs.id, input.id));
    if (!rows.length) throw new Error("情境不存在");
    const d = rows[0];
    return { ...d, input: JSON.parse(d.input), result: JSON.parse(d.result) };
  }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await getDb().delete(designs).where(eq(designs.id, input.id));
    return { ok: true };
  }),
});

// ---------------- 統計 ----------------
export const statsRouter = createRouter({
  get: publicQuery.query(() => getStats()),
});

// 防止未使用告警（保留 drizzle 運算子匯出）
export const __operators = { and, eq, ne };
