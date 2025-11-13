/**
 * Prisma caching utilities for Cloudflare D1
 */

// 30 days in seconds
const THIRTY_DAYS_IN_SECONDS = 2592000;
// 5 minutes in seconds
const FIVE_MINUTES_IN_SECONDS = 300;

/**
 * Default cache strategy for Prisma queries
 * Uses 30-day cache with stale-while-revalidate
 */
export const defaultCacheStrategy = {
	swr: THIRTY_DAYS_IN_SECONDS, // Stale-While-Revalidate: 30 days
	ttl: THIRTY_DAYS_IN_SECONDS, // Time-To-Live: 30 days
} as const;

/**
 * Session cache strategy for auth-related queries
 * Uses 5-minute cache for better security/freshness
 */
export const sessionCacheStrategy = {
	swr: FIVE_MINUTES_IN_SECONDS, // 5 minutes
	ttl: FIVE_MINUTES_IN_SECONDS, // 5 minutes
} as const;

/**
 * Short cache strategy for frequently changing data
 * Uses 1-hour cache
 */
export const shortCacheStrategy = {
	swr: 3600, // 1 hour
	ttl: 3600, // 1 hour
} as const;

/**
 * No cache strategy for real-time data
 */
export const noCacheStrategy = {
	swr: 0,
	ttl: 0,
} as const;
