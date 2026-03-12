import { Hono } from "hono";
import type { HonoContext } from "@/types/context";
import { purgeCacheController, getCacheStatusController } from "@/controllers/cache.controller";

const cacheRouter = new Hono<HonoContext>();

// POST /api/cache/purge - Purge all caches
cacheRouter.post("/purge", purgeCacheController);

// GET /api/cache/status - Get cache status
cacheRouter.get("/status", getCacheStatusController);

export default cacheRouter;
