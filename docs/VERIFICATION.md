# 驗證方法與結果

驗證資產保留於開發紀錄（`verifier/`，含 criteria 與逐次 run 紀錄）。兩支驗證腳本：

## 1. 演算法正確性（engine-check.ts）— 36/36 PASS

以**原 Python DCGen**（WedanEmmanuel/DCGen，實際執行 v1.1 套件）為 ground truth，在**相同擴充型錄**下對拍 TypeScript 引擎：

| 項目 | 內容 | 結果 |
|---|---|---|
| A1 | AI training 2024 Canonical、10,000 racks：功率密度 79.766 kW/m²（論文 §5.2：79.8）、IT 1,435.791 MW（論文：1.4GW）、GPU 8,876 / Storage 1,124 racks | PASS（與 Python 完全一致） |
| A2 | AI training 2024、1GW：總機架 6,965（論文 §5.3：6,965）、密度 79.764 | PASS |
| A3 | Cloud 2024、10,000 racks：186.459 MW（論文：186.5MW）、10.359 kW/m²（論文：10.4） | PASS |
| A4 | 同輸入下冷卻/配電設備台數（N+1 與 2N、乾冷卻與蒸發冷卻、Space/Power 兩優化目標、IT 與廠務階段、發電機），含冷卻功耗合計 | PASS（全部 exact match） |

## 2. API 端對端（api-check.ts，本機 MariaDB）— 20/20 PASS

- C1 種子完整性：equipment=96、itConfig=31、parameters=14、algorithms=15、vendors=23
- C2 台達電子產品 = 20 項（含 UPS 與 CDU）
- B1 設備型錄 8 類 CRUD（各類 create/update/delete 全過）
- B2 IT 配置 CRUD（含 nodeTypes 替換）
- B3 參數調整 / 新增自訂參數 / 變更紀錄 / generate 套用參數快照（safety_margin 0.3 生效，端到端密度 79.795）
- B4 自訂算法新增＋試算（結果正確）、複製內建、內建刪除保護、公式試算自動帶入全域參數
- B5 情境儲存 / 列表 / 讀回 / 刪除

## 3. 建置

`npm run build`（vite client + esbuild server）通過。

## 重現方式

```bash
# 引擎對拍（不需 DB；需 Python DCGen clone 與 node_modules）
npx tsx verifier/v1/engine-check.ts
# API E2E（需本機 MariaDB：dcgen/dcgenpass@localhost:3306/dcgen_test）
DATABASE_URL=mysql://dcgen:dcgenpass@localhost:3306/dcgen_test npx tsx verifier/v1/api-check.ts
```

歷次 run 紀錄：`verifier/runs/2026-08-17T02-engine-check.md`（36/36）、`2026-08-17T02-api-check.md`（20/20）、`2026-08-17T05-engine-check-final.md`（36/36）、`2026-08-17T05-api-check-final.md`（20/20）、`2026-08-17T07-i18n-final.md`（36/36、20/20）、`2026-08-17T09-layout-final.md`（36/36、23/23，新增 layouts CRUD）、`2026-08-18T00-data-final-v2.md`（36/36、26/26，資料擴充 127 項＋審計修正＋增量種子 B7）。

2026-08-18 資料擴充後，A4 基準已以全型錄重新對拍（Power：CDU 改由修正後的 CoolChip 100 ×1800 勝出；Space：冰水機由 YORK YZ ×33 勝出——新廠商產品實質參與選型）。
