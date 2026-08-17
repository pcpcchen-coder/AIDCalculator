/**
 * Verifier v1 — API 端對端測試（本地 MariaDB）
 * 執行：cd $HOME/app-backend && DATABASE_URL=mysql://dcgen:dcgenpass@localhost:3306/dcgen_test npx tsx /mnt/agents/work/verifier/v1/api-check.ts
 * 注意：會清空 dcgen_test 全部表格（僅測試用 DB）
 */


const ctx = { req: new Request("http://localhost/"), resHeaders: new Headers() };

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, extra = "") {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? "PASS" : "FAIL"} ${label}${extra ? " — " + extra : ""}`);
}

async function main() {
  const { sql } = await import("/root/app-final-build/node_modules/drizzle-orm/index.js");
  const { getDb } = await import("/root/app-final-build/api/queries/connection");
  const { ensureDb } = await import("/root/app-final-build/api/ensureDb");
  const { appRouter } = await import("/root/app-final-build/api/router");

  // 清空測試 DB
  const db = getDb();
  for (const t of ["equipment", "vendors", "it_configurations", "it_node_types", "parameters", "param_audits", "algorithms", "designs"]) {
    await db.execute(sql.raw(`DROP TABLE IF EXISTS ${t}`)).catch(() => {});
  }

  await ensureDb();
  const caller = appRouter.createCaller(ctx as never);

  // ---------- C1：種子資料完整性 ----------
  const stats = await caller.stats.get();
  check("C1 equipment seed = 96", stats.equipmentCount === 96, `got ${stats.equipmentCount}`);
  check("C1 itConfig seed = 31", stats.itConfigCount === 31, `got ${stats.itConfigCount}`);
  check("C1 parameters seed = 14", stats.parameterCount === 14, `got ${stats.parameterCount}`);
  check("C1 algorithms seed = 15", stats.algorithmCount === 15, `got ${stats.algorithmCount}`);
  check("C1 vendorCount >= 20", stats.vendorCount >= 20, `got ${stats.vendorCount}`);

  // ---------- C2：台達電子產品 ----------
  const delta = await caller.catalog.list({ deltaOnly: true });
  check("C2 台達電子產品 >= 4", delta.length >= 4, `got ${delta.length}`);
  check("C2 台達含 UPS 與 CDU", delta.some((d) => d.category === "ups") && delta.some((d) => d.category === "cdu"));

  // ---------- B1：設備 CRUD ----------
  const cats = ["cdu", "chiller", "dry_cooler", "cooling_tower", "pdu", "ups", "msb", "generator"] as const;
  let crudOk = true;
  for (const c of cats) {
    const created = await caller.catalog.create({
      name: `TEST-${c}-1`,
      vendorName: "TestVendor",
      category: c,
      capacityKw: 100,
      peakPowerConsumptionKw: c === "pdu" || c === "ups" || c === "msb" || c === "generator" ? null : 5,
      efficiency: c === "pdu" || c === "ups" || c === "msb" || c === "generator" ? 0.98 : null,
      heightM: 2,
      widthM: 1,
      depthM: 1,
      accessAreaShare: 0.2,
    });
    await caller.catalog.update({ id: created.id, data: { capacityKw: 120 } });
    const list = await caller.catalog.list({ search: `TEST-${c}-1` });
    if (!(list.length === 1 && list[0].capacityKw === 120)) crudOk = false;
    await caller.catalog.delete({ id: created.id });
    const gone = await caller.catalog.list({ search: `TEST-${c}-1` });
    if (gone.length !== 0) crudOk = false;
  }
  check("B1 設備型錄 8 類 CRUD", crudOk);

  // ---------- B2：IT 配置 CRUD ----------
  const itc = await caller.itConfig.create({
    name: "TEST-DC",
    datacenterType: "AI training",
    model: "Reference",
    rackSize: 42,
    rackType: "Cloud",
    floorSpace: 1.8,
    generation: "2026",
    nodeTypes: [
      { nodeType: "GPU", rackCount: 10, rackTdp: 100 },
      { nodeType: "Storage", rackCount: 2, rackTdp: 30 },
    ],
  });
  await caller.itConfig.update({ id: itc.id, data: { floorSpace: 2.0, nodeTypes: [{ nodeType: "GPU", rackCount: 12, rackTdp: 110 }] } });
  const itcList = await caller.itConfig.list({ datacenterType: "AI training", model: "Reference" });
  const itcFound = itcList.find((x) => x.id === itc.id);
  check(
    "B2 IT 配置 CRUD",
    !!itcFound && itcFound.floorSpace === 2.0 && itcFound.nodeTypes.length === 1 && itcFound.nodeTypes[0].rackCount === 12,
  );

  // ---------- B3：參數調整與新增 ----------
  await caller.parameters.update({ key: "safety_margin", value: 0.3 });
  const plist = await caller.parameters.list();
  check("B3 參數調整", plist.find((p) => p.key === "safety_margin")?.value === 0.3);
  await caller.parameters.create({ key: "custom_test_param", value: 7.5, unit: "x", category: "自訂參數" });
  const plist2 = await caller.parameters.list();
  check("B3 新增自訂參數", plist2.find((p) => p.key === "custom_test_param")?.value === 7.5);
  const audits = await caller.parameters.audits({ limit: 10 });
  check("B3 變更紀錄", audits.length >= 2);

  // generate 會吃到新參數值（safety_margin 影響設備計數）
  const gen1 = await caller.generate.run({
    datacenterUseCase: "AI training",
    datacenterScale: { target: "rack_count", capacity: 1000 },
    model: "Canonical",
    generation: "2024",
    specificDatacenters: "All",
    heatRejectionMode: "Dry cooling",
    optimizationCriteria: ["Power"],
    rackPerRow: 10,
    rowsPerPod: 2,
    safetyMargin: 0.3,
    redundancy: { heatRejection: "N+1", chillers: "N+1", cdus: "N+1", pdus: "N+1", upss: "2N", msbs: "2N", generators: "2N" },
  });
  check("B3 generate 套用參數快照", gen1.parameterSnapshot["safety_margin"] === 0.3);
  check(
    "B3 generate 端到端（密度 79.795±1%）",
    Math.abs(gen1.results[0].it.powerDensityKwM2 - 79.795) < 0.8,
    `got ${gen1.results[0].it.powerDensityKwM2}`,
  );
  await caller.parameters.reset({ key: "safety_margin" });

  // ---------- B4：算法 CRUD＋試算 ----------
  await caller.algorithms.create({
    key: "custom_storage_v2",
    name: "自訂儲存估算 v2",
    formula: "ceil(p * computeRacks * computeTdpKw / ((1 - p) * rackSize * nodeTdpKw)) * 2",
  });
  const t = await caller.algorithms.test({
    formula: "ceil(p * computeRacks * computeTdpKw / ((1 - p) * rackSize * nodeTdpKw)) * 2",
    variables: { p: 0.042, computeRacks: 300, computeTdpKw: 158, rackSize: 42, nodeTdpKw: 0.708 },
  });
  check("B4 自訂算法試算", t.result === 140, `got ${t.result}`);
  await caller.algorithms.update({ key: "custom_storage_v2", data: { enabled: false } });
  const dup = await caller.algorithms.duplicate({ key: "storage_from_power_proportion", newKey: "custom_storage_copy" });
  check("B4 複製內建算法", dup.ok === true);
  await caller.algorithms.delete({ key: "custom_storage_v2" });
  await caller.algorithms.delete({ key: "custom_storage_copy" });
  const algos = await caller.algorithms.list();
  check("B4 內建算法不可刪除保護", algos.filter((a) => a.isBuiltin).length === 15);
  // 內建公式帶參數自動帶入
  const t2 = await caller.algorithms.test({
    formula: "ceil(tflops * iops_per_tflops / (storage_disk_iops * storage_disks_per_node * rackSize))",
    variables: { tflops: 100000, rackSize: 42 },
  });
  check("B4/A5 公式試算自動帶入全域參數", t2.result === 1, `got ${t2.result}`);

  // ---------- B5：情境存取 ----------
  const saved = await caller.generate.saveDesign({ name: "測試情境 1GW", result: gen1 });
  const dlist = await caller.designs.list();
  check("B5 情境列表", dlist.some((d) => d.id === saved.id));
  const dget = await caller.designs.get({ id: saved.id });
  check("B5 情境讀回", dget.name === "測試情境 1GW" && (dget.result as typeof gen1).results.length === 1);
  await caller.designs.delete({ id: saved.id });

  // 清理測試資料
  await caller.itConfig.delete({ id: itc.id });
  await caller.parameters.delete({ key: "custom_test_param" });

  console.log(`\n=== api-check: ${pass} PASS, ${fail} FAIL ===`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("api-check 執行失敗:", e);
  process.exit(1);
});
