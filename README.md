# DCGen Web — AI 資料中心配置產生平台（AIDCalculator）

基於 **DCGen 1.1 技術報告**（arXiv:2604.09616，UChicago / Argonne）與開源實作 [WedanEmmanuel/DCGen](https://github.com/WedanEmmanuel/DCGen) 打造的**全端資料庫網站**。使用者可產生資料中心配置（IT＋冷卻＋配電）、線上管理設備型錄資料庫、調整/新增全域參數、管理/新增算法，並儲存與比較 what-if 情境。

> 全站 UI 為繁體中文。設備型錄採用**市售產品官方規格**（含**台達電子 InfraSuite** 系列 20 項），逐筆附來源 URL。

## 功能總覽

| 頁面 | 路由 | 功能 |
|---|---|---|
| 總覽 | `/` | 平台簡介、型錄即時統計（設備/廠商/台達焦點）、四種 DC 類型、最近情境 |
| 配置產生器 | `/generator` | 表單（類型/規模/年份/散熱/冗餘 N+1~2N~xN-y/安全餘裕）→ tRPC 演算 → 結果儀表板（指標卡、堆疊圖、冷卻/配電 BOM、Gray space、參數快照）；情境儲存、重開、2–3 情境並排比較、JSON/CSV 匯出 |
| 資料庫管理 | `/catalog` | 8 類非 IT 設備型錄（96 筆種子）與 IT 參考/標準配置（31 筆）之瀏覽/篩選/新增/編輯/刪除；「僅看台達」篩選、來源外鏈、匯出 |
| 參數管理 | `/parameters` | 14 個全域模型參數行內調整、一鍵還原預設、新增自訂參數（`custom_`）、變更紀錄（audit log） |
| 算法管理 | `/algorithms` | 論文式 1–19 內建算法註冊表（公式展示、參數綁定調整、啟用開關）、自訂算法新增（公式即時語法檢查）、試算面板、複製內建為自訂 |
| 模型說明 | `/docs` | DCGen 方法論、冷卻鏈/配電鏈 SVG 動畫、冗餘互動計算器、資料來源聲明、BibTeX 引用 |

## 技術棧

- **前端**：React 19 + TypeScript + Vite 7 + Tailwind CSS 3.4 + shadcn/ui + Recharts + Framer Motion + GSAP + Lenis + Three.js（首頁 Hero）
- **後端**：Hono + tRPC 11 + Drizzle ORM + MySQL（啟動時自動建表＋種子，`api/ensureDb.ts`）
- **演算引擎**：`api/engine/dcgen.ts` 忠實移植 DCGen 式 1–19（IT 模型、LPT pod 裝箱、N+r / xN-y 冗餘設備計數、Gray space）；`api/engine/expr.ts` 安全公式求值器（自訂算法用）

## 快速開始

```bash
npm install
# 設定 .env（DATABASE_URL、APP_ID、APP_SECRET；見 .env.example）
npm run db:push        # 或使用內建 ensureDb（伺服器啟動自動建表+種子）
npm run dev            # http://localhost:3000
npm run build && npm start   # 正式模式
```

首次啟動會自動建立 8 張表並寫入種子資料：23 家廠商、96 項設備、31 個 IT 配置、14 個參數、15 條內建算法（冪等，重複啟動不會重複寫入）。

## 文件

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 系統架構與資料模型
- [docs/MODEL.md](docs/MODEL.md) — DCGen 模型與方程式對照（式 1–19）
- [docs/API.md](docs/API.md) — tRPC API 端點
- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) — 設備型錄資料來源（含台達電子）
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — 部署說明（Kimi / 自架）
- [docs/VERIFICATION.md](docs/VERIFICATION.md) — 驗證方法與結果（36/36、20/20）

## 引用

```bibtex
@article{gnibga2026dcgen,
  title={DCGen 1.1 Technical Report: Generating Datacenter Configurations (including IT, Power, Cooling)},
  author={Gnibga, Wedan Emmanuel and Chien, Andrew A},
  journal={arXiv preprint arXiv:2604.09616},
  year={2026}
}
```

## 聲明

設備規格取自各廠商官方型錄與公開資料（見 docs/DATA_SOURCES.md），僅供研究用途；數值以原廠最新公告為準。本平台為研究原型，不隸屬 DCGen 官方或任何設備廠商。
