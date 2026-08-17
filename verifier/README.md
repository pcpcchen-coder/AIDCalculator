# Verifier 索引（append-only）

本目錄存放 DCGen Web 平台的驗收標準與歷次驗證紀錄。

## 版本
- v1/（2026-08-17 建立）：初版驗收標準。量測項目：
  1. 演算法正確性 — TypeScript 引擎 vs 原 Python DCGen（同輸入對拍），基準值取論文 §5：10,000-rack 2024 AI training power density ≈ 79.8 kW/m²、IT load ≈ 1.4GW；1GW 2024 AI training ≈ 6,965 racks（±2% 容差）。
  2. API 功能 — 設備型錄 CRUD、參數 CRUD（含新增）、算法 CRUD（含自訂公式新增與試算）、generate 端對端。
  3. 資料完整性 — 種子資料含 REPO 全部 8 類設備與 IT 配置，且台達電子產品 ≥ 4 項。
  4. 前端建置 — 建置成功、主要頁面存在。
- runs/：每次執行驗證的時間戳紀錄（指令、exit code、數值）。
