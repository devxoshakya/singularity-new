import { betterAuth, type BetterAuthOptions } from "better-auth";
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
import { SubscriptionService } from "./services/subscription.service";
import { TEST_PRODUCTS, LIVE_PRODUCTS } from "./config/products";


const REQUIRED_DOMAIN = '@miet.ac.in';

export interface AuthEnv {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	FRONTEND_URL: string;
	DODO_PAYMENTS_API_KEY: string;
	DODO_PAYMENTS_WEBHOOK_SECRET: string;
	DODO_PAYMENTS_BUSINESS_ID: string;
	WORKER_ENVIRONMENT: string;
}


export const createBetterAuth = (env: AuthEnv) => {
	const dodoPayments = new DodoPayments({
		bearerToken: env.DODO_PAYMENTS_API_KEY,
		environment: env.WORKER_ENVIRONMENT === "prod" ? "live_mode" : "test_mode" // Change to "production" for live
	});

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
		trustedOrigins: [
			"http://localhost:3001", 
			"https://m.devshakya.xyz", 
			env.FRONTEND_URL
		],
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
				domain: env.WORKER_ENVIRONMENT === "prod" ? ".devshakya.xyz" : "localhost"// Added localhost for local testing
			},
		},
		onAPIError: {
			errorURL: env.WORKER_ENVIRONMENT === "prod" ? "https://m.devshakya.xyz/login" : "http://localhost:3001/login",
		},

		plugins: [
			dodopayments({
				client: dodoPayments,
				createCustomerOnSignUp: true,
				use: [
					dodocheckout({
						products: env.WORKER_ENVIRONMENT === "prod" ? LIVE_PRODUCTS.map(p => ({
							productId: p.productId,
							slug: p.slug,
						})) : TEST_PRODUCTS.map(p => ({
							productId: p.productId,
							slug: p.slug,
						})),
						successUrl: `${env.FRONTEND_URL}/dashboard?payment=success`,
						authenticatedUsersOnly: true,
					}),
					dodoportal(),
					dodowebhooks({
						webhookKey: env.DODO_PAYMENTS_WEBHOOK_SECRET,
						onPayload: async (payload: any) => {
							console.log('🔔 Received DodoPayments webhook:', payload.type);
							console.log('📦 Payload:', JSON.stringify(payload, null, 2));

							try {
								switch (payload.type) {
									// Subscription lifecycle events
									case 'subscription.created':
									case 'subscription.activated':
									case 'subscription.active':
										console.log('➕ Upserting subscription:', payload.data.subscription_id);
										await SubscriptionService.upsertSubscription({
											subscriptionId: payload.data.subscription_id,
											customerEmail: payload.data.customer.email,
											productId: payload.data.product_id,
											status: 'active',
											startDate: payload.data.start_date,
											endDate: payload.data.end_date || payload.data.next_billing_date,
											autoRenew: payload.data.auto_renew ?? true,
										});
										break;

									case 'subscription.cancelled':
										await SubscriptionService.cancelSubscription(
											payload.data.subscription_id
										);
										break;

									case 'subscription.expired':
										await SubscriptionService.expireSubscription(
											payload.data.subscription_id
										);
										break;

									case 'subscription.paused':
										await SubscriptionService.pauseSubscription(
											payload.data.subscription_id
										);
										break;

									case 'subscription.resumed':
										await SubscriptionService.upsertSubscription({
											subscriptionId: payload.data.subscription_id,
											customerEmail: payload.data.customer.email,
											productId: payload.data.product_id,
											status: 'active',
											endDate: payload.data.end_date || payload.data.next_billing_date,
											autoRenew: payload.data.auto_renew ?? true,
										});
										break;

									case 'subscription.renewed':
										// Update end date on renewal
										await SubscriptionService.upsertSubscription({
											subscriptionId: payload.data.subscription_id,
											customerEmail: payload.data.customer.email,
											productId: payload.data.product_id,
											status: 'active',
											endDate: payload.data.next_billing_date,
											autoRenew: true,
										});
										break;

									// Payment events (optional logging)
									case 'payment.succeeded':
										console.log('💰 Payment succeeded:', payload.data.payment_id);
										break;

									case 'payment.failed':
										console.warn('❌ Payment failed:', payload.data.payment_id);
										// Optionally notify user or pause subscription
										break;

									default:
										console.log(`ℹ️ Unhandled webhook type: ${payload.type}`);
								}
							} catch (error) {
								console.error('❌ Error processing webhook:', error);
								// In production, you might want to send this to an error tracking service
								throw error; // Re-throw to let DodoPayments know webhook failed
							}
						},
					}),
				],
			}),
		]
	});
};