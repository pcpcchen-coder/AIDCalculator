# DCGen Web — 交接文件（Handoff）

> 最後更新：2026-08-18 ｜ 文件目的：讓任何工具/開發者接手時，10 分鐘內掌握全貌與「現在卡在哪」。

---

## 1. 這是什麼專案

依據論文 **DCGen 1.1（arXiv:2604.09616）** 與開源 REPO **WedanEmmanuel/DCGen** 打造的全端「資料中心配置產生平台」。使用者輸入資料中心類型、規模目標（機架數或功率）、年份、散熱模式、冗餘等級（N/N+1/N+2/2N/xN-y）、安全餘裕，系統用論文的式 (1)–(19) 產生：IT 機架分布、冷卻/配電設備 BOM（選型＋數量）、機房面積、功率密度，並可儲存情境、產生平面配置圖 / 3D 展示 / 電路圖 / 冷卻架構圖。

**使用者要求的核心能力（皆已完成）**
- 資料庫可更新（設備型錄 CRUD，含台達電子 Delta Electronics 全系列 UPS/CDU/PDU 等市售規格，每筆附 source_url）
- 參數可調整、可新增（`custom_` 前綴自訂參數，含變更稽核 param_audits）
- 算法可新增/調整（安全公式求值器 api/engine/expr.ts，白名單函數，無 eval）
- 三語介面：繁體中文 / 簡體中文 / English（src/i18n）
- 內嵌操作說明書（/docs 頁面，含完整範例與預期結果對照表）

## 2. 技術棧與結構

| 層 | 技術 |
|---|---|
| 前端 | React 19 + TypeScript + Vite 7 + Tailwind 3.4 + shadcn/ui + Framer Motion + GSAP + Three.js(R3F) + Recharts |
| 後端 | Hono + tRPC 11（`/api/trpc/*`）+ Drizzle ORM |
| 資料庫 | MySQL 相容（平台配發的是 TiDB Serverless，port 4000） |
| 部署 | Kimi Websites 全棧託管（dynamic 版本） |

```
api/
  boot.ts            # Hono 入口：/api/health、/api/trpc/*、生產靜態托管
  ensureDb.ts        # ★ 開機/每請求自動建表+補種子（冪等）、欄位漂移防護、3輪重試、getDbStatus()
  engine/dcgen.ts    # ★ 論文式(1)–(19)的 TS 移植（與 Python 原repo對拍過）
  engine/expr.ts     # 自訂算法的安全公式求值器
  queries/dcgen.ts   # Drizzle 查詢層
  routers/           # tRPC routers：catalog / itConfig / parameters / algorithms / generate / designs / stats
contracts/dcgen.ts   # 前後端共享型別（不要 import api/ 進前端）
db/schema.ts         # 8 表：vendors/equipment/it_configurations/it_node_types/parameters/param_audits/algorithms/designs(+layouts)
db/seed-data.ts      # ★ 種子：140+ 設備（57 repo 原廠 + 台達等市售研究）、31 IT 配置、22 參數、15 內建算法
src/pages/           # Home / Generator / Catalog(資料庫管理) / Parameters / Algorithms / Docs / Studio(配置圖工作室)
src/i18n/            # 三語字典
verifier/            # 驗收準則 A1-A5/B/C/D 與對拍記錄
docs/                # 操作說明書 md 三語版等
```

## 3. 部署現況（Kimi 平台）

- **最新版本卡：`46b3743`**（v1.5.3，2026-08-18）＝ GitHub master `2e2f61e`
- **公開網址**：https://uabau7xuvq62m.kimi.site ｜ ⚠️ 目前掛的是**舊版**，需在 Kimi 預覽面板「分享 → 更新发布」才會換新版（詳見 Kimi 幫助中心 websites-overview）
- 版本儲存方式：`website_version_manager build_version type:"dynamic" project_dir:/mnt/agents/output/app`
- 版號顯示：Navbar 左下小字 `v1.5 · 2026-08-18`（src/lib/version.ts + Navbar.tsx）——使用者用它確認部署是否更新

## 4. ⚠️ 目前唯一未解問題：平台資料庫連不上（平台側）

**現象**：2026-08-18 起，「資料庫管理」頁無資料。

**已查明的證據鏈**：
1. 前端渲染已修復（稍早因 FUSE 吞檔導致 import 遺失 → 空白頁，已在 `cb18bcc`/`bce5a42` 修好並用 tsc 全量驗證）
2. `/api/health` 顯示 `ensureState: "error"`，第一句 DDL `CREATE TABLE IF NOT EXISTS vendors` 就失敗
3. `DATABASE_URL` 存在且憑證未輪換（portal 重新配發後拿到同一組）
4. DNS 解析正常（3 個內網 IP），但 **TCP port 4000 連線逾時**——agent 沙盒與預覽 runtime **都**連不上
5. 結論：**平台託管的 TiDB 叢集故障或休眠**，不是程式問題

**已內建的自愈機制**（v1.5.3，`2e2f61e`）：
- ensureDb 失敗時 3 輪重試（20s 間隔），且**每個 tRPC 請求前都會重試初始化**——DB 一恢復，流量進來就自動建表＋補種子，無需重新部署
- `/api/health` 回傳完整 error chain（err.cause 展開）＋ TCP 底層探測（DNS IP、連線 ms/timeout）

**接手者驗證步驟**：
1. 開 Kimi 最新版本卡預覽 → 訪問 `<預覽網址>/api/health`
2. `"probe": { "tcp": "ok …ms" }` → DB 已恢復，回預覽重新整理，型錄應出現 140+ 設備；然後「分享 → 更新发布」
3. `"tcp": "timeout …"` → 平台仍故障，過 10–30 分鐘再試；長時間不通用預覽面板右上角信封圖示「用户反馈」回報「数据库端点 TCP timeout: ep-t4ni387b5e83b7519dc8…:4000」

## 5. 環境地雷（用 Kimi agent 沙盒接手必讀）

1. **`/mnt/agents/output` 是 FUSE mount，會「假寫入」**：工具回報成功但檔案內容消失/截斷（本次空白頁 bug 的根源）。規則：**任何寫入後必讀回驗證**（wc -l / grep），重要修改後跑 `npx tsc -p tsconfig.app.json --noEmit` 與 `tsconfig.server.json` 全量檢查——build 不會抓 undefined identifier（不跑 tsc），只有 tsc 會。
2. **`.git` 與 `node_modules` 會被平台快照流程吃掉**（本次發生兩次）。**GitHub 是唯一可信來源**；還原方式：`git clone repo` → `cp -a .git` 回去 → node_modules 從 `/app/.agents/skills/webapp-building-swarm/scripts/template/node_modules`（256 包）＋ `backend-building-swarm/scripts/template/node_modules`（83 包）overlay 後 `npm install`。
3. **FUSE 不支援 symlink/exec bit**：node_modules/.bin 會有 cp warning，但 `npm run build` 照樣能跑（npm 自己解析）。
4. **`/root`、`/tmp` 會被清空**：工作檔只放 repo 或 /mnt/agents/output。
5. 長指令用 `nohup bash -c '...' > log 2>&1 &`＋輪詢 log，否則 shell 工具會 504。
6. 瀏覽器工具會間歇性死掉（timeout）；除錯渲染問題時可在 index.html 注入 window error trap（capture 階段），把錯誤寫進 document.title/body 再訪問讀取——本次靠它抓到 `RELEASE_NOTE is not defined` 與 `trpc is not defined`。

## 6. 憑證與 .env

- repo 內**無任何憑證**（.env 已 gitignore）。
- `.env` 內容：APP_ID / APP_SECRET / DATABASE_URL，由 Kimi portal 配發：
  ```bash
  curl -X POST http://localhost:8080/api/v1/apps \
    -H "Content-Type: application/json" \
    -d '{"name":"DCGen Web","features":["db"]}'
  ```
  （僅在 Kimi agent 沙盒內有效；目前配發的 DATABASE_URL 指向的 endpoint 故障中，見第 4 節）
- DATABASE_URL 是 **privatelink 內網地址**，只在 Kimi 平台網路內可達，外部/本機連不上屬正常。
- ⚠️ 資安提醒：使用者的 GitHub PAT 曾在對話中明文出現，建議到 GitHub → Settings → Developer settings 撤換（revoke）後重發。

## 7. 驗證狀態（已完成）

| 項目 | 狀態 |
|---|---|
| 引擎數值對拍（verifier A1–A5：10,000 racks→79.8kW/m²、1GW→6,965 racks 等論文基準） | ✅ 通過 |
| API CRUD（B 組）、種子完整性（C 組，台達 ≥4 項附來源） | ✅ 通過 |
| tsc 前端+後端 0 錯誤、`npm run build` 通過 | ✅（最後一次 25.7s） |
| 本地瀏覽器實測首頁渲染 | ✅（注入 trap 法） |
| 平台端到端（DB 連線） | ❌ 卡在平台 DB 故障（第 4 節） |

## 8. TODO（接手後的優先順序）

1. 等平台 DB 恢復 → /api/health 驗證 → 分享→更新发布 → 確認左下版號與型錄資料
2. 若平台 DB 長期不恢復：考慮把 DATABASE_URL 換成自管 MySQL/TiDB（改 .env 即可，schema+seed 全自動）
3. （可選）把 /api/health 狀態做成前端可見的小指示燈
4. （可選）docs/ 說明書與 docx 版本同步更新

## 9. 相關連結

- GitHub：https://github.com/pcpcchen-coder/AIDCalculator
- 公開站：https://uabau7xuvq62m.kimi.site
- 論文：https://arxiv.org/abs/2604.09616 ｜ 原 REPO：https://github.com/WedanEmmanuel/DCGen
- Kimi 發佈機制說明：https://www.kimi.com/zh-cn/help/websites/websites-overview
