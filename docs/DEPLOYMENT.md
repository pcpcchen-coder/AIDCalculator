# 部署說明

## 環境變數（.env）

```bash
APP_ID=            # 平台應用 ID
APP_SECRET=        # JWT/簽章用密鑰
DATABASE_URL=      # mysql://user:pass@host:port/dbname
```

## Kimi 平台（已交付）

本專案以 Kimi 全端能力交付（dynamic 版本）：平台從版本快照以 dev server 啟動，伺服器第一次請求時自動完成建表與種子（`api/ensureDb.ts`），無需手動 migration。預覽：對話中的版本卡。發佈：於平台介面按「發佈」（手動動作）。

## 自架部署

```bash
npm install
cp .env.example .env   # 填入實際值
npm run build          # 產生 dist/public（前端）+ dist/boot.js（伺服器）
npm start              # 預設 http://localhost:3000（PORT 可改）
```

- 首次啟動自動建表＋種子（冪等）；亦可用 `npm run db:push` + `npx tsx db/seed.ts` 手動完成。
- 需要 Node.js 20+ 與 MySQL 8 相容資料庫（TiDB 亦可）。
- 前端為 SPA，伺服器已內建 fallback；反向代理（nginx）只需將流量轉發至 3000。

## 常用指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | 開發模式（HMR） |
| `npm run build` | 正式建置 |
| `npm start` | 正式啟動 |
| `npm run check` | TypeScript 檢查 |
| `npm run db:push` | 同步 Drizzle schema 到 DB |
| `npx tsx db/seed.ts` | 手動種子（冪等） |

## 資料重置

種子為冪等（equipment 非空即略過）。若要重置：清空 8 張表後重啟伺服器即可重新建表+種子（注意：使用者的自訂資料與情境將一併清除）。
