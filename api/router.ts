import { createRouter, publicQuery } from "./middleware";
import {
  algorithmRouter,
  catalogRouter,
  designRouter,
  generateRouter,
  itConfigRouter,
  layoutRouter,
  parameterRouter,
  statsRouter,
} from "./routers/dcgen";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  catalog: catalogRouter,
  itConfig: itConfigRouter,
  parameters: parameterRouter,
  algorithms: algorithmRouter,
  generate: generateRouter,
  designs: designRouter,
  layouts: layoutRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
