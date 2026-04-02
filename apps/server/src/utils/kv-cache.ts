import type { Context, Next } from "hono";
import type { HonoContext } from "@/types/context";

const CACHE_VERSION_KEY = "cache:result-analytics:version";

// Results are mostly static over months; cache for 45 days by default.
export const RESULT_ANALYTICS_CACHE_TTL_SECONDS = 45 * 24 * 60 * 60;

const normalizeUrlForCache = (url: string): string => {
	const parsed = new URL(url);
	const sorted = [...parsed.searchParams.entries()].sort(([a], [b]) =>
		a.localeCompare(b),
	);
	const normalizedParams = new URLSearchParams();
	for (const [key, value] of sorted) {
		normalizedParams.append(key, value);
	}

	const query = normalizedParams.toString();
	return `${parsed.pathname}${query ? `?${query}` : ""}`;
};

const getCacheVersion = async (c: Context<HonoContext>): Promise<string> => {
	const kv = c.env?.RESULT_ANALYTICS_CACHE;
	if (!kv) return "1";

	const version = await kv.get(CACHE_VERSION_KEY);
	if (version) return version;

	await kv.put(CACHE_VERSION_KEY, "1");
	return "1";
};

const createCacheKey = async (
	c: Context<HonoContext>,
	prefix: string,
): Promise<string> => {
	const version = await getCacheVersion(c);
	const normalized = normalizeUrlForCache(c.req.url);
	return `${prefix}:v${version}:${normalized}`;
};

export const bumpResultAnalyticsCacheVersion = async (
	c: Context<HonoContext>,
): Promise<string> => {
	const kv = c.env?.RESULT_ANALYTICS_CACHE;
	if (!kv) return "1";

	const currentVersion = await getCacheVersion(c);
	const nextVersion = String(Number(currentVersion) + 1);
	await kv.put(CACHE_VERSION_KEY, nextVersion);
	return nextVersion;
};

export const createKVJsonCacheMiddleware = (
	prefix: string,
	ttlSeconds: number,
) => {
	return async (c: Context<HonoContext>, next: Next) => {
		if (c.req.method !== "GET") {
			await next();
			return;
		}

		const kv = c.env?.RESULT_ANALYTICS_CACHE;
		if (!kv) {
			await next();
			return;
		}

		const cacheKey = await createCacheKey(c, prefix);
		const cached = await kv.get(cacheKey, "json");

		if (cached !== null) {
			return c.json(cached as unknown as Record<string, unknown>, 200);
		}

		await next();

		if (c.res.status !== 200) return;

		const contentType = c.res.headers.get("content-type") ?? "";
		if (!contentType.toLowerCase().includes("application/json")) return;

		const payload = await c.res.clone().json();
		await kv.put(cacheKey, JSON.stringify(payload), {
			expirationTtl: ttlSeconds,
		});
	};
};
