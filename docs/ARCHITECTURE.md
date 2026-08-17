# 系統架構

## 總覽

```
┌────────────────────────────┐        ┌────────────────────────────┐
│  React 19 SPA (Vite)        │  tRPC  │  Hono + tRPC 11 (Node 20)  │
│  src/pages|components       │ ─────▶ │  api/router.ts             │
│  @/providers/trpc           │ ◀───── │  api/routers/dcgen.ts      │
└────────────────────────────┘        │  api/engine/*              │
                                      │  api/queries/*             │
                                      │  api/ensureDb.ts ──┐       │
                                      └────────────────────┼───────┘
                                                           ▼
                                                ┌──────────────────┐
                                                │ MySQL (Drizzle)  │
                                                │ 8 tables         │
                                                └──────────────────┘
```

- **前端**：`src/`（React 19 + Tailwind + shadcn/ui）。`src/main.tsx` 全域掛載 `TRPCProvider`；`src/App.tsx` 以 `BrowserRouter` 註冊 6 條路由並全域掛載 `<Toaster>`。
- **後端**：`api/`（Hono，`api/boot.ts`；tRPC fetch adapter 掛在 `/api/trpc/*`）。正式模式由同一程序供應前端靜態檔（SPA fallback）。
- **共用合約**：`contracts/dcgen.ts`（型別、8 類設備、冗餘語彙、GenerateInput/Result），前後端共用，禁止前端 import `api/`。
- **啟動自舉**：`api/ensureDb.ts` 於伺服器啟動與每個 tRPC 請求（shared promise）執行冪等初始化：`CREATE TABLE IF NOT EXISTS` × 8 → equipment 為空則寫入全部種子資料。

## 資料模型（db/schema.ts）

| 表 | 說明 | 關鍵欄位 |
|---|---|---|
| `vendors` | 廠商 | name（unique）、country、website、isFeatured（台達=true） |
| `equipment` | 非 IT 設備型錄（8 類） | category(cdu/chiller/dry_cooler/cooling_tower/pdu/ups/msb/generator)、capacityKw、peakPowerConsumptionKw（冷卻類）、efficiency（配電類）、heightM/widthM/depthM、accessAreaShare(λ)、generation、sourceUrl、notes、isCustom、**engineEligible**（是否參與自動選型；機架級 rPDU 等預設 false） |
| `it_configurations` | IT 參考/標準配置 | datacenterType（4 類）、model（Canonical/Reference）、rackSize、rackType(Cloud/HPC)、floorSpace、generation |
| `it_node_types` | IT 配置之節點明細 | configId→it_configurations（cascade）、nodeType(GPU/CPU-GPU/CPU/Storage)、rackCount、rackTdp |
| `parameters` | 全域模型參數 | key(unique)、value、defaultValue、unit、category、isCustom |
| `param_audits` | 參數變更紀錄 | parameterKey、oldValue、newValue、action(update/create/reset/delete) |
| `algorithms` | 算法註冊表 | key(unique)、name、category、formula（自訂可求值）、formulaDisplay、paperRef、parameterBindings(JSON)、isBuiltin、enabled、version |
| `designs` | 已存情境 | name、input(JSON)、result(JSON)、parameterSnapshot(JSON) |

## 演算引擎（api/engine/）

- `dcgen.ts`：DCGen 式 1–19 移植。輸入 GenerateInput + DB 型錄 → GenerateResult。含冗餘解析（N/N+r/xN-y/xN/N-y）、功率字串解析（W/kW/MW/GW/TW）、二元最小堆 LPT pod 裝箱、IT 模型（機架數/功率雙模式）、非 IT 設備 IT 階段與廠務階段（UPS/MSB/Gen 支撐冷卻功耗）、雙優化目標（Space/Power）選型、Gray space 室內/室外分攤。
- `expr.ts`：安全公式求值器（遞迴下降剖析；白名單函數 ceil/floor/round/sqrt/abs/min/max/log/exp/pow/sum；無賦值/屬性存取 → 無注入風險）。`validateFormula` 供前端即時語法檢查；`extractVariables` 供試算面板列出變數。
- 引擎正確性以原 Python DCGen 對拍（見 docs/VERIFICATION.md）。

## 選型與 engineEligible

型錄中「機架級/小型配電產品」（如 0U rPDU、小型配電櫃）不是 DCGen pod 級設備，種子時 `engineEligible=false`：型錄可瀏覽/編輯，但自動選型不採用；使用者可在型錄編輯 Drawer 中手動開啟。

## 種子資料（db/seed-data.ts）

由 ` WedanEmmanuel/DCGen` 全量 JSON 型錄＋台達電子 20 項＋國際大廠 19 項（2026-08-17 研究，逐筆附 sourceUrl）組成；規格條件對齊處理見 docs/DATA_SOURCES.md。

## 關鍵設計決策

1. **參數三層全部入庫**（使用者輸入/內部參數/輸出），改參數不需改碼；每次 generate 回傳 parameterSnapshot 以保證可重現。
2. **算法註冊表模式**：內建算法具名、帶式號與版本；內建公式核心不可改（可複製為自訂後調整），bindings/說明/啟用可調並自動升版號。
3. **ensureDb 冪等自舉**：部署環境首次啟動即完成建表與種子，不需手動 migration 步骤。
4. **安全公式求值**：自訂算法不經 eval，以白名單剖析器求值。
