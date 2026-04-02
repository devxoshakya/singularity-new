import type { Context } from "hono";
import type { HonoContext } from "@/types/context";
import {
	bumpResultAnalyticsCacheVersion,
	RESULT_ANALYTICS_CACHE_TTL_SECONDS,
} from "@/utils/kv-cache";

/**
 * POST /api/cache/clear
 * Bump KV cache version so all old cache entries are invalidated.
 */
export const purgeCacheController = async (c: Context<HonoContext>) => {
	try {
		const nextVersion = await bumpResultAnalyticsCacheVersion(c);

		return c.json(
			{
				success: true,
				message: "Result and analytics KV cache cleared successfully.",
				cacheVersion: nextVersion,
			},
			200,
		);
	} catch (error: any) {
		console.error("Cache purge error:", error);

		return c.json({
			success: false,
			error: "Failed to clear cache",
			details: error.message,
		}, 500);
	}
};

/**
 * GET /api/cache/status
 * Get cache status information
 */
export const getCacheStatusController = async (c: Context<HonoContext>) => {
	try {
		const kvEnabled = Boolean(c.env?.RESULT_ANALYTICS_CACHE);
		return c.json(
			{
				success: true,
				cache: {
					type: "KV",
					enabled: kvEnabled,
					routes: ["/api/result/*", "/api/analytics/*"],
					ttlSeconds: RESULT_ANALYTICS_CACHE_TTL_SECONDS,
					invalidation: "POST /api/cache/clear",
				},
				note: "Cache keys are versioned. Clearing cache bumps version and invalidates all old keys.",
			},
			200,
		);
	} catch (error: any) {
		console.error("Get cache status error:", error);
		return c.json({ error: "Failed to get cache status" }, 500);
	}
};
