import prisma from "@singularity/db";
import { SubscriptionStatus, SubscriptionPlan, SubscriptionDuration } from "@prisma/client/edge";
import { getProductConfig } from "../config/products";

export class SubscriptionService {
	/**
	 * Create FREE subscription for new users
	 */
	static async createFreeSubscription(userId: string) {
		// Check if user already has a subscription
		const existingSubscription = await prisma.subscription.findFirst({
			where: { userId }
		});

		if (existingSubscription) {
			console.log(`⚠️ User ${userId} already has a subscription`);
			return existingSubscription;
		}

		// Create FREE subscription with effectively permanent duration
		const endDate = new Date();
		endDate.setFullYear(endDate.getFullYear() + 100);

		const subscription = await prisma.subscription.create({
			data: {
				userId,
				status: SubscriptionStatus.ACTIVE,
				plan: SubscriptionPlan.BASIC,
				duration: SubscriptionDuration.YEARLY,
				startDate: new Date(),
				endDate: endDate,
				autoRenew: false,
			}
		});

		console.log(`✅ Created FREE subscription for user ${userId}`);
		return subscription;
	}
	
	/**
	 * Create or update subscription based on webhook data
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
		// 1. Find user by email
		const user = await prisma.user.findFirst({
			where: { email: payload.customerEmail },
		});

		if (!user) {
			console.warn(`⚠️ No user found for email=${payload.customerEmail}`);
			throw new Error(`User not found: ${payload.customerEmail}`);
		}

		// 2. Get product configuration
		const productConfig = getProductConfig(payload.productId);
		if (!productConfig) {
			console.error(`❌ Unknown product ID: ${payload.productId}`);
			throw new Error(`Unknown product: ${payload.productId}`);
		}

		// 3. Map status
		const dbStatus = this.mapStatus(payload.status);

		// 4. Calculate dates
		const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
		let endDate: Date;
		
		if (payload.endDate) {
			endDate = new Date(payload.endDate);
		} else {
			// Calculate end date based on duration
			endDate = new Date(startDate);
			endDate.setMonth(endDate.getMonth() + productConfig.durationMonths);
		}

		// 5. Cancel any existing FREE subscription
		await prisma.subscription.updateMany({
			where: {
				userId: user.id,
				plan: SubscriptionPlan.BASIC,
				status: SubscriptionStatus.ACTIVE,
			},
			data: {
				status: SubscriptionStatus.CANCELLED,
				updatedAt: new Date(),
			}
		});

		// 6. Upsert paid subscription
		const subscription = await prisma.subscription.upsert({
			where: { dodopaymentsSub: payload.subscriptionId },
			update: {
				status: dbStatus,
				plan: productConfig.plan as SubscriptionPlan,
				duration: productConfig.duration as SubscriptionDuration,
				endDate,
				autoRenew: payload.autoRenew ?? false,
				updatedAt: new Date(),
			},
			create: {
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

		console.log(`✅ Subscription ${payload.subscriptionId} synced for user ${user.email}`);
		return subscription;
	}

	/**
	 * Cancel subscription
	 */
	static async cancelSubscription(subscriptionId: string) {
		const subscription = await prisma.subscription.findFirst({
			where: { dodopaymentsSub: subscriptionId },
		});

		if (!subscription) {
			console.warn(`⚠️ Subscription ${subscriptionId} not found`);
			return;
		}

		// Mark paid subscription as cancelled
		await prisma.subscription.update({
			where: { dodopaymentsSub: subscriptionId },
			data: {
				status: 'CANCELLED',
				autoRenew: false,
				updatedAt: new Date(),
			},
		});

		// Reactivate FREE subscription if no other active paid subscriptions
		const activePaidSubscription = await prisma.subscription.findFirst({
			where: {
				userId: subscription.userId,
				status: 'ACTIVE',
				plan: { not: 'BASIC' }
			}
		});

		if (!activePaidSubscription) {
			await this.createFreeSubscription(subscription.userId);
		}

		console.log(`✅ Subscription ${subscriptionId} cancelled`);
	}

	/**
	 * Mark subscription as expired
	 */
	static async expireSubscription(subscriptionId: string) {
		const subscription = await prisma.subscription.findUnique({
			where: { dodopaymentsSub: subscriptionId }
		});

		if (!subscription) {
			console.warn(`⚠️ Subscription ${subscriptionId} not found`);
			return;
		}

		// Mark paid subscription as expired
		await prisma.subscription.update({
			where: { dodopaymentsSub: subscriptionId },
			data: {
				status: SubscriptionStatus.EXPIRED,
				autoRenew: false,
				updatedAt: new Date(),
			},
		});

		// Reactivate FREE subscription if no other active paid subscriptions
		const activePaidSubscription = await prisma.subscription.findFirst({
			where: {
				userId: subscription.userId,
				status: SubscriptionStatus.ACTIVE,
				plan: { not: SubscriptionPlan.BASIC }
			}
		});

		if (!activePaidSubscription) {
			await this.createFreeSubscription(subscription.userId);
		}

		console.log(`✅ Subscription ${subscriptionId} expired`);
	}

	/**
	 * Pause subscription
	 */
	static async pauseSubscription(subscriptionId: string) {
		await prisma.subscription.update({
			where: { dodopaymentsSub: subscriptionId },
			data: {
				status: SubscriptionStatus.PAUSED,
				updatedAt: new Date(),
			},
		});
		console.log(`✅ Subscription ${subscriptionId} paused`);
	}

	/**
	 * Get active subscription for user
	 */
	static async getActiveSubscription(userId: string) {
		return prisma.subscription.findFirst({
			where: {
				userId,
				status: SubscriptionStatus.ACTIVE,
				endDate: { gte: new Date() },
			},
			orderBy: { createdAt: 'desc' },
		});
	}

	/**
	 * Get all subscriptions for user
	 */
	static async getUserSubscriptions(userId: string) {
		return prisma.subscription.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
		});
	}

	/**
	 * Get subscription by Dodo Payments subscription ID
	 */
	static async getSubscriptionByDodoId(subscriptionId: string) {
		return prisma.subscription.findUnique({
			where: { dodopaymentsSub: subscriptionId },
			include: { user: true },
		});
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
