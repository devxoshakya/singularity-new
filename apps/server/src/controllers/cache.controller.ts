import type { Context } from "hono";
import prisma from "@singularity/db";
import type { HonoContext } from "@/types/context";

/**
 * POST /api/cache/purge
 * Invalidate all Prisma Accelerate cache
 */
export const purgeCacheController = async (c: Context<HonoContext>) => {
	try {
		// Use Prisma Accelerate's cache invalidation API
		await prisma.$accelerate.invalidateAll();

		return c.json(
			{
				success: true,
				message: "All cache invalidated successfully. Next requests will fetch fresh data.",
			},
			200,
		);
	} catch (error: any) {
		console.error("Cache purge error:", error);
		
		// Handle rate limit error
		if (error.code === "P6003") {
			return c.json(
				{ 
					success: false,
					error: "Cache invalidation rate limit reached. Please try again later." 
				}, 
				429
			);
		}
		
		return c.json({ 
			success: false,
			error: "Failed to purge cache",
			details: error.message 
		}, 500);
	}
};

/**
 * GET /api/cache/status
 * Get cache status information
 */
export const getCacheStatusController = async (c: Context<HonoContext>) => {
	try {
		return c.json(
			{
				success: true,
				cacheStrategies: {
					default: {
						description: "30-day cache for general queries",
						ttl: "2592000 seconds (30 days)",
						swr: "2592000 seconds (30 days)",
					},
					session: {
						description: "5-minute cache for auth-related queries",
						ttl: "300 seconds (5 minutes)",
						swr: "300 seconds (5 minutes)",
					},
					short: {
						description: "1-hour cache for frequently changing data",
						ttl: "3600 seconds (1 hour)",
						swr: "3600 seconds (1 hour)",
					},
					none: {
						description: "No cache for real-time data",
						ttl: "0 seconds",
						swr: "0 seconds",
					},
				},
				note: "Cache is managed by Prisma Accelerate. Use POST /api/cache/purge to invalidate all cache.",
			},
			200,
		);
	} catch (error: any) {
		console.error("Get cache status error:", error);
		return c.json({ error: "Failed to get cache status" }, 500);
	}
};
