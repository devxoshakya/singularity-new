import prisma from "@singularity/db";
import { SubscriptionStatus, SubscriptionPlan, SubscriptionDuration } from "@prisma/client/edge";
import { getProductConfig } from "../config/products";

export class SubscriptionService {
	/**
	 * Create or update subscription based on webhook data
	 * Only ONE subscription per user - uses email to find and update/create
	 */
	static async upsertSubscription(payload: {
		subscriptionId: string;
		customerEmail: string;
		productId: string;
		status: 'active' | 'cancelled' | 'expired' | 'paused';
		startDate?: string;
		endDate?: string;
		autoRenew?: boolean;
	}) {
		// find user by email
		const user = await prisma.user.findFirst({
			where: { email: payload.customerEmail },
		});

		if (!user) {
			console.warn(`⚠️ No user found for email=${payload.customerEmail}`);
			throw new Error(`User not found: ${payload.customerEmail}`);
		}

		// get product configuration
		const productConfig = getProductConfig(payload.productId);
		if (!productConfig) {
			console.error(`❌ Unknown product ID: ${payload.productId}`);
			throw new Error(`Unknown product: ${payload.productId}`);
		}

		// map status
		const dbStatus = this.mapStatus(payload.status);

		// calculate dates
		const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
		let endDate: Date;

		if (payload.endDate) {
			endDate = new Date(payload.endDate);
		} else {
			endDate = new Date(startDate);
			endDate.setMonth(endDate.getMonth() + productConfig.durationMonths);
		}

		// check if user already has a subscription
		const existingSubscription = await prisma.subscription.findFirst({
			where: { userId: user.id },
		});

		let subscription;

		if (existingSubscription) {
			subscription = await prisma.subscription.update({
				where: { id: existingSubscription.id },
				data: {
					dodopaymentsSub: payload.subscriptionId,
					status: dbStatus,
					plan: productConfig.plan as SubscriptionPlan,
					duration: productConfig.duration as SubscriptionDuration,
					startDate,
					endDate,
					autoRenew: payload.autoRenew ?? false,
					updatedAt: new Date(),
				},
			});
			console.log(`✅ Updated existing subscription for user ${user.email}`);
		} else {
			subscription = await prisma.subscription.create({
				data: {
					userId: user.id,
					dodopaymentsSub: payload.subscriptionId,
					status: dbStatus,
					plan: productConfig.plan as SubscriptionPlan,
					duration: productConfig.duration as SubscriptionDuration,
					startDate,
					endDate,
					autoRenew: payload.autoRenew ?? false,
				},
			});
			console.log(`✅ Created new subscription for user ${user.email}`);
		}

		return subscription;
	}

	/**
	 * Cancel subscription - downgrade to FREE tier
	 */
	static async cancelSubscription(customerEmail: string) {
		// Find user by email
		const user = await prisma.user.findFirst({
			where: { email: customerEmail },
		});

		if (!user) {
			console.warn(`⚠️ No user found for email=${customerEmail}`);
			return;
		}

		// Find user's subscription
		const subscription = await prisma.subscription.findFirst({
			where: { userId: user.id },
		});

		if (!subscription) {
			console.warn(`⚠️ No subscription found for user ${customerEmail}`);
			return;
		}

		// Downgrade to FREE tier
		const endDate = new Date();
		endDate.setFullYear(endDate.getFullYear() + 100); // Effectively permanent

		await prisma.subscription.update({
			where: { id: subscription.id },
			data: {
				status: SubscriptionStatus.ACTIVE,
				plan: SubscriptionPlan.BASIC,
				duration: SubscriptionDuration.YEARLY,
				startDate: new Date(),
				endDate,
				autoRenew: false,
				updatedAt: new Date(),
			},
		});

		console.log(`✅ Downgraded user ${customerEmail} to FREE tier`);
	}

	/**
	 * Check and expire all subscriptions that have passed their end date
	 * Called by cron job
	 */
	// Optimized for speed and minimal database transactions
	static async checkAndExpireSubscriptions() {
		const now = new Date();

		// --- 1. Define the end date for the BASIC/Free tier subscription ---
		// Calculate a distant future date once to use for all updates
		const futureEndDate = new Date();
		futureEndDate.setFullYear(futureEndDate.getFullYear() + 100);

		// --- 2. Perform the update in a single database query (updateMany) ---
		// This query finds ALL matching records AND updates them atomically.
		const result = await prisma.subscription.updateMany({
			where: {
				status: SubscriptionStatus.ACTIVE,
				plan: { not: SubscriptionPlan.BASIC }, // Target paid, active subscriptions
				endDate: {
					lt: now, // Where the end date is less than 'now' (expired)
				},
			},
			data: {
				status: SubscriptionStatus.ACTIVE, // They remain 'active' on the free tier
				plan: SubscriptionPlan.BASIC,
				duration: SubscriptionDuration.YEARLY, // Set to a long default duration
				startDate: new Date(), // Set the start date to the current timestamp
				endDate: futureEndDate, // Use the pre-calculated future date
				autoRenew: false,
				// updatedAt is handled automatically by the @updatedAt directive, 
				// but we can set it explicitly if needed:
				// updatedAt: new Date(), 
			},
		});

		// Note: updateMany returns an object containing only the count of records updated.
		const expiredCount = result.count;

		console.log(`Downgraded ${expiredCount} expired subscriptions to FREE tier via updateMany.`);

		// NOTE: updateMany does not return the updated records, only the count.
		// If you NEED the list of updated subscriptions (including user data),
		// you will have to fall back to the findMany + Promise.all approach, 
		// or perform a second findMany query based on the original criteria, 
		// or use a raw SQL query with RETURNING (if supported by your database/Prisma extension).
		return {
			expiredCount: expiredCount,
			// The list of subscriptions is removed because updateMany doesn't return it.
			// subscriptions: [] 
		};
	}

	/**
	 * Map DodoPayments status to our SubscriptionStatus enum
	 */
	private static mapStatus(status: string): SubscriptionStatus {
		const statusMap: Record<string, SubscriptionStatus> = {
			'active': SubscriptionStatus.ACTIVE,
			'cancelled': SubscriptionStatus.CANCELLED,
			'expired': SubscriptionStatus.EXPIRED,
			'paused': SubscriptionStatus.PAUSED,
		};
		return statusMap[status.toLowerCase()] || SubscriptionStatus.ACTIVE;
	}
}
