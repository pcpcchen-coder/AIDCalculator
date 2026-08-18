import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { ensureDb, getDbStatus } from "./ensureDb";

// 啟動時確保 DB 結構與種子資料（背景執行；每個 tRPC 請求亦會 await 同一 shared promise）
ensureDb().catch((e) => console.error("[ensureDb] 初始化失敗（將於請求時重試）", e));

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
// 診斷端點：部署後資料庫狀態自檢（不需登入）
app.get("/api/health", async (c) => {
  try {
    const status = await getDbStatus();
    return c.json({ ok: status.ensureState === "ok", ...status });
  } catch (e) {
    return c.json({ ok: false, fatal: e instanceof Error ? e.message : String(e) }, 500);
  }
});

app.use("/api/trpc/*", async (c) => {
  // 每個請求先確保 DB 初始化（失敗過會自動重試）；失敗不阻斷，讓 tRPC 回正式錯誤
  await ensureDb().catch(() => {});
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
