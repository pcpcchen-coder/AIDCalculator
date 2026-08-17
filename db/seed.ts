import { ensureDb } from "../api/ensureDb";

// CLI 入口：npx tsx db/seed.ts
// 與伺服器啟動共用同一個冪等初始化（CREATE TABLE IF NOT EXISTS + seed-if-empty）
ensureDb()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
