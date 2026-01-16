import { auth } from "../lib/auth";
import type { InferUser } from "better-auth";

export type AuthUser = InferUser<typeof auth> & {
    rollNo?: string | null;
    blocked?: boolean;
	plan?: string | null;
};
/**
 * Type definitions for Hono context variables
 */

export interface User {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	emailVerified: boolean;
	rollNo: string | null;
	blocked: boolean;
	plan: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Session {
	id: string;
	expiresAt: Date;
	token: string;
	ipAddress: string | null;
	userAgent: string | null;
	userId: string;
}

/**
 * Extend Hono's context type to include Better Auth user and session
 */
export type HonoContext = {
	Variables: {
		user: AuthUser | null;
		session: typeof auth.$Infer.Session.session | null;
	}
};
