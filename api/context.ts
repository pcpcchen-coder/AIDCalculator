import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { ensureDb } from "./ensureDb";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  // 確保 schema/seed 就緒（shared promise，首次後近乎零成本）
  await ensureDb();
  return { req: opts.req, resHeaders: opts.resHeaders };
}
