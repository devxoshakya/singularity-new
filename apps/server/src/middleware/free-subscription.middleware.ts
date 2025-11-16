import { Context, Next } from 'hono';
import { SubscriptionService } from '@singularity/auth/services/subscription.service';
import prisma from '@singularity/db';

/**
 * Middleware to create FREE subscription for new users after successful signup
 * This runs after Better Auth processes sign-up/sign-in requests
 */
export const freeSubscriptionMiddleware = async (c: Context, next: Next) => {
	await next();

	// Only process successful responses
	if (c.res.status !== 200) {
		return;
	}

	// Check if this is a sign-up or social sign-in endpoint
	const path = c.req.path;
	if (!path.includes('/api/auth/sign-up') && !path.includes('/api/auth/sign-in/social')) {
		return;
	}

	try {
		// Parse the response body to get user info
		const responseClone = c.res.clone();
		const body = await responseClone.json();

		if (body && body.user && body.user.id) {
			const userId = body.user.id;
			const userEmail = body.user.email;

			// Check if user already has a subscription
			const existingSubscription = await prisma.subscription.findFirst({
				where: { userId }
			});

			if (!existingSubscription) {
				// Create FREE subscription asynchronously (don't block response)
				SubscriptionService.createFreeSubscription(userId)
					.then(() => {
						console.log(`✅ Created FREE subscription for user ${userEmail}`);
					})
					.catch((error) => {
						console.error("❌ Error creating FREE subscription:", error);
					});
			}
		}
	} catch (error) {
		// Silently fail - don't affect the user experience
		console.error("❌ Error in FREE subscription middleware:", error);
	}
};
