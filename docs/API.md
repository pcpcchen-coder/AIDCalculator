# tRPC API

Base path：`/api/trpc`（superjson 序列化）。全部 public procedure（本版本未啟用登入）。前端以 `trpc`（`@/providers/trpc`）呼叫；輸入皆經 zod 驗證。

## stats

| Procedure | 型別 | 說明 |
|---|---|---|
| `stats.get` | query | 平台統計：equipmentCount、vendorCount、deltaCount、itConfigCount、designCount、algorithmCount、parameterCount、categoryBreakdown、topVendors |

## catalog（設備型錄）

| Procedure | 型別 | 輸入 | 說明 |
|---|---|---|---|
| `catalog.list` | query | `{ category?, vendor?, search?, deltaOnly? }` | 設備清單（含全部規格欄位） |
| `catalog.vendors` | query | — | 廠商清單 |
| `catalog.create` | mutation | equipmentInput | 新增設備（vendorName 不存在時自動建廠商）；isCustom=true |
| `catalog.update` | mutation | `{ id, data: Partial<equipmentInput> }` | 更新（可切換 engineEligible） |
| `catalog.delete` | mutation | `{ id }` | 刪除 |

equipmentInput：`{ name, vendorName?, category: enum(8), capacityKw>0, peakPowerConsumptionKw?, efficiency?: 0–1, heightM?, widthM?, depthM?, accessAreaShare=0.2, generation?, sourceUrl?, notes?, engineEligible? }`

## itConfig（IT 配置）

| Procedure | 型別 | 輸入 | 說明 |
|---|---|---|---|
| `itConfig.list` | query | `{ datacenterType?, model?, generation? }` | IT 配置清單（含 nodeTypes） |
| `itConfig.create` | mutation | itConfigInput | 新增（連同 nodeTypes 至少 1 筆） |
| `itConfig.update` | mutation | `{ id, data: Partial<itConfigInput> }` | 更新（nodeTypes 全量替換） |
| `itConfig.delete` | mutation | `{ id }` | 刪除（連同明細） |

itConfigInput：`{ name, datacenterType: enum(4), model: Canonical|Reference, rackSize>0, rackType: Cloud|HPC, floorSpace>0, generation, sourceUrl?, notes?, nodeTypes: [{ nodeType, rackCount≥0, rackTdp≥0 }] }`

## parameters

| Procedure | 型別 | 輸入 | 說明 |
|---|---|---|---|
| `parameters.list` | query | — | 全部參數 |
| `parameters.audits` | query | `{ limit=50 }` | 變更紀錄 |
| `parameters.update` | mutation | `{ key, value }` | 調整（寫入 audit） |
| `parameters.create` | mutation | `{ key(英數底線), value, unit?, category?, description? }` | 新增自訂參數（isCustom=true） |
| `parameters.reset` | mutation | `{ key }` | 還原預設值 |
| `parameters.delete` | mutation | `{ key }` | 刪除（僅 isCustom） |

## algorithms

| Procedure | 型別 | 輸入 | 說明 |
|---|---|---|---|
| `algorithms.list` | query | — | 算法註冊表 |
| `algorithms.create` | mutation | `{ key, name, category?, description?, formula, parameterBindings? }` | 新增自訂算法（公式先經 validate） |
| `algorithms.update` | mutation | `{ key, data }` | 調整；內建算法僅可改 name/description/bindings/enabled/category（公式禁改），自動升版號 |
| `algorithms.duplicate` | mutation | `{ key, newKey }` | 複製為自訂算法 |
| `algorithms.delete` | mutation | `{ key }` | 刪除（僅自訂） |
| `algorithms.test` | mutation | `{ formula, variables }` | 公式試算；未提供的變數自動帶入同名全域參數 |
| `algorithms.validate` | query | `{ formula }` | 語法檢查，回傳 `{ ok, error?, variables }` |

## generate

| Procedure | 型別 | 輸入 | 說明 |
|---|---|---|---|
| `generate.run` | mutation | GenerateInput | 端到端演算（IT＋冷卻＋配電），回傳 GenerateResult（含 parameterSnapshot） |
| `generate.saveDesign` | mutation | `{ name, result }` | 儲存情境 |

GenerateInput 關鍵欄位：`datacenterUseCase`（4 類）、`datacenterScale`（`{target:"rack_count",capacity:int}` 或 `{target:"power_capacity",capacity:"1GW"}`）、`model`、`generation`、`specificDatacenters`（"All" 或名稱陣列）、`heatRejectionMode`、`optimizationCriteria`、`rackPerRow`、`rowsPerPod`、`safetyMargin`、`redundancy`（七槽位字串，如 "N+1"、"2N"、"3N/2"）。

## designs

| Procedure | 型別 | 說明 |
|---|---|---|
| `designs.list` | query | 情境清單（摘要欄位） |
| `designs.get` | query `{ id }` | 讀回完整 input/result |
| `designs.delete` | mutation `{ id }` | 刪除 |

## 錯誤格式

tRPC 標準錯誤；業務檢查以中文訊息拋出（如「參數 key 已存在」「內建算法的核心公式不可修改」「查無符合條件的 IT 配置」），前端以 toast 呈現。
