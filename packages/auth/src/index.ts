import { betterAuth, success, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@singularity/db";
import { APIError } from 'better-auth/api';
import { DodoPayments } from "dodopayments";
import {
	dodopayments,
	checkout as dodocheckout,
	portal as dodoportal,
	webhooks as dodowebhooks,
} from "@dodopayments/better-auth";


const REQUIRED_DOMAIN = '@miet.ac.in';

export interface AuthEnv {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	FRONTEND_URL: string;
}

export const dodoPayments = new DodoPayments({
	bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
	environment: "test_mode"
});


export const createBetterAuth = (env: AuthEnv) => {
	return betterAuth<BetterAuthOptions>({
		database: prismaAdapter(prisma, {
			provider: "mongodb",
		}),
		user: {
			additionalFields: {
				rollNo: {
					type: "string",
					required: false,
					defaultValue: null,
				},
				blocked: {
					type: "boolean",
					required: true,
					defaultValue: false,
					input: false,
				}
			}
		},
		trustedOrigins: ["http://localhost:3001", "https://m.devshakya.xyz", env.FRONTEND_URL],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
				mapProfileToUser: (profile) => {
					const userEmail = profile.email as string | undefined;
					if (!userEmail || !userEmail.endsWith(REQUIRED_DOMAIN)) {
						// Throwing an APIError stops the sign-in/sign-up process
						throw new APIError('FORBIDDEN', {
							message: `Access denied. Google sign-in is restricted to emails ending with ${REQUIRED_DOMAIN}.`,
						});
					}

					return {
						email: userEmail,
						name: profile.name,
						image: profile.picture,
					};
				},
			},
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
				domain: ".devshakya.xyz"
			},
		},
		onAPIError: {
			errorURL: "https://m.devshakya.xyz/login",
		},
		plugins: [
			dodopayments({
				client: dodoPayments,
				createCustomerOnSignUp: true,
				use: [
					dodocheckout({
						products: [
							{
								productId: "pdt_eBvi3ZK8ZsX7QDJshNWBA",
								slug: "premium-plan",
							},
						],
						successUrl: "/",
						authenticatedUsersOnly: true,
					}),
				],
			}),
			dodoportal(),
			dodowebhooks(),

		]
	});
};