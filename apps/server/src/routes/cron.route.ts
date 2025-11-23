import { Hono } from "hono";
import { SubscriptionService } from "@singularity/auth/services/subscription.service";

const cronRoutes = new Hono();

cronRoutes.get("/check-subscriptions", async (c) => {
    try {
        console.log("Running subscription expiry check...");
        
        const result = await SubscriptionService.checkAndExpireSubscriptions();
        
        return c.json({
            success: true,
            message: `Downgraded ${result.expiredCount} expired subscriptions to FREE tier`,
            expiredCount: result.expiredCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cron job error:", error);
        return c.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            500
        );
    }
});

export default cronRoutes;
