import { Hono } from 'hono';
import type { Context } from 'hono';
import { SubscriptionService } from '@singularity/auth/services/subscription.service';

const subscriptionRouter = new Hono();

/**
 * GET /api/subscriptions/me - Get current user's subscription
 * Requires authentication
 */
subscriptionRouter.get('/me', async (c: Context) => {
	try {
		const user = c.get('user');
		
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		const subscription = await SubscriptionService.getActiveSubscription(user.id);
		const allSubscriptions = await SubscriptionService.getUserSubscriptions(user.id);
		
		return c.json({
			success: true,
			subscription,
			allSubscriptions,
			portalUrl: `https://customer.dodopayments.com/login/${process.env.DODO_PAYMENTS_BUSINESS_ID}`,
		});
	} catch (error) {
		console.error('Error fetching subscription:', error);
		return c.json({ error: 'Failed to fetch subscription' }, 500);
	}
});

/**
 * GET /api/subscriptions/status - Check subscription status
 * Requires authentication
 */
subscriptionRouter.get('/status', async (c: Context) => {
	try {
		const user = c.get('user');
		
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		const subscription = await SubscriptionService.getActiveSubscription(user.id);
		
		return c.json({
			success: true,
			hasActive: !!subscription,
			subscription,
			plan: subscription?.plan || 'FREE',
		});
	} catch (error) {
		console.error('Error checking subscription status:', error);
		return c.json({ error: 'Failed to check subscription status' }, 500);
	}
});

/**
 * GET /api/subscriptions/checkout-info - Get available products
 * Requires authentication
 */
subscriptionRouter.get('/checkout-info', async (c: Context) => {
	try {
		const user = c.get('user');
		
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		// Return available product slugs for checkout
		const products = [
			{ slug: 'pro-6m', plan: 'PRO', duration: '6 months', durationMonths: 6 },
			{ slug: 'pro-12m', plan: 'PRO', duration: '12 months', durationMonths: 12 },
			{ slug: 'premium-6m', plan: 'PREMIUM', duration: '6 months', durationMonths: 6 },
			{ slug: 'premium-12m', plan: 'PREMIUM', duration: '12 months', durationMonths: 12 },
		];

		return c.json({
			success: true,
			products,
			checkoutBaseUrl: '/api/auth/checkout',
			note: 'Use POST to /api/auth/checkout with productSlug to initiate checkout',
		});
	} catch (error) {
		console.error('Error getting checkout info:', error);
		return c.json({ error: 'Failed to get checkout info' }, 500);
	}
});

export default subscriptionRouter;
