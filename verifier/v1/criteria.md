# Verifier v1 — DCGen Web 驗收標準

## A. 演算法正確性（核心）
以原 Python DCGen（/mnt/agents/work/DCGen）為 ground truth，對拍 TypeScript 引擎：
- A1. rack_count 模式：AI training, 2024 Canonical, 10,000 racks → power density ≈ 79.8 kW/m²（±2%）、IT 峰值功率 ≈ 1.4GW（±2%）
- A2. power_capacity 模式：AI training, 2024 Canonical, 1GW → 總機架數 ≈ 6,965（±2%）
- A3. Cloud 2024 10,000 racks → ≈ 186.5MW、10.4 kW/m²（±3%）
- A4. 非 IT 設備：同輸入下冷卻/配電設備數量與 Python 版完全一致（N+1 與 2N 各一案）
- A5. 自訂算法公式求值器：新增一條公式（如 storage 估算變體）可正確試算

## B. API 功能
- B1. 設備型錄 CRUD（8 類設備各至少 list/create/update/delete 一次成功）
- B2. IT 配置 CRUD（含 node types）
- B3. 參數 CRUD：調整現有參數 + 新增參數成功，且 generate 會吃到新值
- B4. 算法 CRUD：新增自訂算法、調整內建算法參數成功
- B5. designs：產生結果可存取與讀回

## C. 資料完整性
- C1. 種子資料涵蓋 REPO 全部 IT 配置（canonical+reference 四類型）與 8 類非 IT 設備
- C2. 台達電子（Delta Electronics）產品 ≥ 4 項，規格有來源註記
- C3. 其他市售廠商補充產品有來源註記

## D. 前端
- D1. 前端 build 成功
- D2. 頁面：總覽/產生器/資料庫管理/參數管理/算法管理/說明 皆存在且路由可達
- D3. 產生器端到端：輸入→後端運算→結果圖表呈現
