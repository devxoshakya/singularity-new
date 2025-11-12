import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@singularity/db";
import { APIError } from 'better-auth/api'; // Import APIError for custom validation

// Define the required domain for strict enforcement
const REQUIRED_DOMAIN = '@miet.ac.in';

// Define interface for environment variables
export interface AuthEnv {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
}

// Factory function to create auth instance with environment variables
export const createAuth = (env: AuthEnv) => {
	return betterAuth<BetterAuthOptions>({
		database: prismaAdapter(prisma, {
			provider: "mongodb",
		}),
		trustedOrigins: ["http://localhost:3001", "https://listing.singularity.miet.ac.in"],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		// 👇 ADDED: Google Social Provider Configuration 👇
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
				// 2. ENFORCEMENT: This is the mandatory security check on the server side.
				mapProfileToUser: (profile) => {
					const userEmail = profile.email as string | undefined;
					if (!userEmail || !userEmail.endsWith(REQUIRED_DOMAIN)) {
						// Throwing an APIError stops the sign-in/sign-up process
						throw new APIError('FORBIDDEN', {
							message: `Access denied. Google sign-in is restricted to emails ending with ${REQUIRED_DOMAIN}.`,
						});
					}

					// If the domain is correct, return the mapped user data
					return {
						email: userEmail,
						name: profile.name,
						image: profile.picture,
					};
				},
			},
		},
		// 👆 END of ADDED configuration 👆

		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		onAPIError: {
			// This is the guaranteed redirect URL for *any* unhandled server API error,
			// which includes the domain restriction error from your mapProfileToUser hook.
			// Make sure this is the public URL of your login page.
			errorURL: "http://localhost:3000/login",
		},
	});
};