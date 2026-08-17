/**
 * Verifier v1 — 演算法正確性對拍（不依賴資料庫）
 * 以 db/seed-data.ts 的設備/IT 配置 + api/engine/dcgen.ts 引擎，
 * 對照 verifier/python-truth.json（原 Python DCGen 輸出）。
 * 執行：cd $HOME/app-backend && npx tsx /mnt/agents/work/verifier/v1/engine-check.ts
 */
import { readFileSync } from "node:fs";
import { computeDatacenter, computeItResult, type EngineEquipment, type EngineItConfig, type EngineParams } from "/root/app-final-build/api/engine/dcgen";
import type { GenerateInput } from "/root/app-final-build/contracts/dcgen";
import { seedEquipment, seedItConfigs } from "/root/app-final-build/db/seed-data";

const truth = JSON.parse(readFileSync("/mnt/agents/work/verifier/python-truth.json", "utf-8"));
const truthEnriched = JSON.parse(readFileSync("/mnt/agents/work/verifier/python-truth-enriched.json", "utf-8"));

const params: EngineParams = {
  safety_margin: 0.2,
  rack_per_row: 10,
  rows_per_pod: 2,
  conventional_rack_size: 42,
  hpc_to_cloud_rack_ratio: 2 / 3,
};

const equipment: EngineEquipment[] = seedEquipment.filter((e) => e.engineEligible).map((e, i) => ({
  id: i + 1,
  name: e.name,
  vendorName: e.vendor,
  category: e.category,
  capacityKw: e.capacityKw,
  peakPowerConsumptionKw: e.peakPowerConsumptionKw,
  efficiency: e.efficiency,
  heightM: e.heightM,
  widthM: e.widthM,
  depthM: e.depthM,
  accessAreaShare: e.accessAreaShare,
}));

function findConfig(name: string, type: string, model: string): EngineItConfig {
  const c = seedItConfigs.find((x) => x.name === name && x.datacenterType === type && x.model === model);
  if (!c) throw new Error(`config not found: ${name}`);
  return { id: 0, ...c };
}

const baseInput: GenerateInput = {
  datacenterUseCase: "AI training",
  datacenterScale: { target: "rack_count", capacity: 10000 },
  model: "Canonical",
  generation: "2024",
  specificDatacenters: "All",
  heatRejectionMode: "Dry cooling",
  optimizationCriteria: ["Power", "Space"],
  rackPerRow: 10,
  rowsPerPod: 2,
  safetyMargin: 0.2,
  redundancy: { heatRejection: "N+1", chillers: "N+1", cdus: "N+1", pdus: "N+1", upss: "2N", msbs: "2N", generators: "2N" },
};

let pass = 0;
let fail = 0;
function check(label: string, actual: number, expected: number, tolPct = 2) {
  const ok = Math.abs(actual - expected) <= (Math.abs(expected) * tolPct) / 100;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: actual=${actual} expected=${expected} (±${tolPct}%)`);
}
function checkEq(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: actual=${actual} expected=${expected} (exact)`);
}

// ---------- A1: AI training 2024, 10,000 racks ----------
const cfgA1 = findConfig("2024 Canonical Configuration", "AI training", "Canonical");
const a1 = computeItResult(cfgA1, baseInput, params);
const tA1 = truth.A1["2024 Canonical Configuration"];
check("A1 power density (kW/m²)", a1.powerDensityKwM2, tA1["Power density (kW/m²)"], 0.5);
checkEq("A1 GPU racks", a1.rackCount["GPU"], tA1["Rack count"]["GPU"]);
checkEq("A1 Storage racks", a1.rackCount["Storage"], tA1["Rack count"]["Storage"]);
check("A1 GPU peak MW", a1.peakPowerMw["GPU"], tA1["Peak power (MW)"]["GPU"], 0.5);
check("A1 total IT MW ≈1.4GW", a1.totalPeakPowerMw, 1435.791, 1);

// ---------- A2: AI training 2024, 1GW ----------
const inputA2: GenerateInput = { ...baseInput, datacenterScale: { target: "power_capacity", capacity: "1GW" } };
const a2 = computeItResult(cfgA1, inputA2, params);
const tA2 = truth.A2["2024 Canonical Configuration"];
checkEq("A2 total racks (6965)", a2.totalRacks, tA2["Rack count"]["GPU"] + tA2["Rack count"]["Storage"]);
checkEq("A2 GPU racks", a2.rackCount["GPU"], tA2["Rack count"]["GPU"]);
check("A2 power density", a2.powerDensityKwM2, tA2["Power density (kW/m²)"], 0.5);

// ---------- A3: Cloud 2024, 10,000 racks ----------
const cfgA3 = findConfig("2024 Canonical Configuration", "Cloud", "Canonical");
const a3 = computeItResult(cfgA3, { ...baseInput, datacenterUseCase: "Cloud" }, params);
const tA3 = truth.A3["2024 Canonical Configuration"];
check("A3 power density", a3.powerDensityKwM2, tA3["Power density (kW/m²)"], 0.5);
check("A3 total MW (186.5)", a3.totalPeakPowerMw, 186.459, 1);

// ---------- A4: 非 IT（dry cooling, 1000 racks） ----------
const inputA4: GenerateInput = { ...baseInput, datacenterScale: { target: "rack_count", capacity: 1000 } };
const r4 = computeDatacenter(cfgA1, inputA4, equipment, params);
const t4 = truthEnriched.A4["Configuration (2024 Canonical Configuration)"];
for (const criterion of ["Power Optimized Design", "Space Optimized Design"] as const) {
  const mine = r4.nonIt.find((n) => n.criterion === (criterion === "Power Optimized Design" ? "Power" : "Space"))!;
  const py = t4["Cooling system"];
  const myC = mine.cooling.designs;
  checkEq(`A4 ${criterion} dry cooler count`, myC.dry_cooler!.totalCount, py["Dry coolers"][criterion].IT["Total hardware count"]);
  checkEq(`A4 ${criterion} chiller count`, myC.chiller!.totalCount, py["Chillers"][criterion].IT["Total hardware count"]);
  checkEq(`A4 ${criterion} cdu count`, myC.cdu!.totalCount, py["CDUs"][criterion].IT["Total hardware count"]);
  check(`A4 ${criterion} cooling power MW`, mine.cooling.summary.powerMw, py.Summary[criterion]["Maximum power demand (MW)"], 1);
  const pyP = t4["Power system"];
  const myP = mine.power.designsIt;
  checkEq(`A4 ${criterion} pdu count`, myP.pdu!.totalCount, pyP["PDUs"][criterion].IT["Total hardware count"]);
  checkEq(`A4 ${criterion} ups IT count`, myP.ups!.totalCount, pyP["UPSs"][criterion].IT["Total hardware count"]);
  checkEq(`A4 ${criterion} msb IT count`, myP.msb!.totalCount, pyP["MSBs"][criterion].IT["Total hardware count"]);
  const myF = mine.power.designsFacility;
  checkEq(`A4 ${criterion} ups Facility count`, myF.ups!.totalCount, pyP["UPSs"][criterion].Facility["Total hardware count"]);
  checkEq(`A4 ${criterion} msb Facility count`, myF.msb!.totalCount, pyP["MSBs"][criterion].Facility["Total hardware count"]);
  checkEq(`A4 ${criterion} gen IT count`, myP.generator!.totalCount, pyP["Backup Generators"][criterion].IT["Total hardware count"]);
  checkEq(`A4 ${criterion} gen Facility count`, myF.generator!.totalCount, pyP["Backup Generators"][criterion].Facility["Total hardware count"]);
}

// ---------- A4 evap：冷卻水塔模式 ----------
const r4e = computeDatacenter(cfgA1, { ...inputA4, heatRejectionMode: "Evaporative cooling" }, equipment, params);
const t4e = truthEnriched.A4_evap["Configuration (2024 Canonical Configuration)"];
for (const criterion of ["Power Optimized Design", "Space Optimized Design"] as const) {
  const mine = r4e.nonIt.find((n) => n.criterion === (criterion === "Power Optimized Design" ? "Power" : "Space"))!;
  const py = t4e["Cooling system"];
  checkEq(`A4evap ${criterion} tower count`, mine.cooling.designs.cooling_tower!.totalCount, py["Evaporative Cooling Towers"][criterion].IT["Total hardware count"]);
  check(`A4evap ${criterion} cooling power MW`, mine.cooling.summary.powerMw, py.Summary[criterion]["Maximum power demand (MW)"], 1);
}

console.log(`\n=== engine-check: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
