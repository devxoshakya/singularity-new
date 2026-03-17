// app/api/webhook/dodo-payments/route.ts
import { Webhooks } from "@dodopayments/nextjs";
import { prisma } from "@/lib/prisma";
import { getPlanByProductId, PLAN_LIMITS } from "@/lib/plans";
import { clerkClient } from "@clerk/nextjs/server";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,

  onPaymentSucceeded: async (payload) => {
    const productId = payload.data.product_cart?.[0]?.product_id;
    const metadata = payload.data.metadata as {
      userId?: string;
      orgName?: string;
      orgSlug?: string;
      plan?: string;
    } | null;

    // Validate everything we need is present
    if (!productId || !metadata?.userId || !metadata?.orgName || !metadata?.orgSlug) {
      console.error("[dodo] payment.succeeded — missing required fields", {
        productId,
        metadata,
      });
      return;
    }

    const { userId, orgName, orgSlug } = metadata;

    // Resolve plan from the product ID — never trust client-sent plan
    const plan = getPlanByProductId(productId);

    if (!plan || plan === "FREE") {
      console.error("[dodo] payment.succeeded — unknown product id:", productId);
      return;
    }

    const limits = PLAN_LIMITS[plan];

    // Idempotency: if org already exists with this slug, treat as an upgrade
    const existingOrg = await prisma.org.findUnique({ where: { slug: orgSlug } });

    if (existingOrg) {
      // Upgrade — update plan + limits, keep everything else intact
      await prisma.org.update({
        where: { id: existingOrg.id },
        data: {
          plan,
          studentLimit: limits.studentLimit,
          memberLimit: limits.memberLimit,
          dodoCustomerId: payload.data.customer?.customer_id ?? existingOrg.dodoCustomerId,
          planExpiresAt: null, // one-time purchase, no expiry
        },
      });

      console.log(`[dodo] org upgraded: ${orgSlug} → ${plan}`);
      return;
    }

    // Ensure the OrgUser row exists — may not if Clerk webhook is delayed
    await prisma.orgUser.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: payload.data.customer?.email ?? "",
      },
    });

    // Create the org
    const org = await prisma.org.create({
      data: {
        name: orgName,
        slug: orgSlug,
        ownerId: userId,
        plan,
        studentLimit: limits.studentLimit,
        memberLimit: limits.memberLimit,
        memberCount: 0,
        studentCount: 0,
        dodoCustomerId: payload.data.customer?.customer_id ?? null,
        dodoSubscriptionId: null, // digital product — no subscription
        planExpiresAt: null,      // one-time purchase — never expires
      },
    });

    // Create admin membership (admin never counts against student/member limits)
    await prisma.orgMembership.create({
      data: {
        orgId: org.id,
        userId,
        role: "ADMIN",
        status: "ACTIVE",
        acceptedAt: new Date(),
      },
    });

    // Sync org context into Clerk JWT so RAG backend can read it without a DB call
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        active_org_id: org.id,
        org_role: "ADMIN",
      },
    });

    console.log(`[dodo] org created: ${orgSlug} (${plan}) for user ${userId}`);
  },

  onPaymentFailed: async (payload) => {
    const metadata = payload.data.metadata as {
      userId?: string;
      orgName?: string;
      orgSlug?: string;
    } | null;

    console.warn("[dodo] payment.failed", {
      userId: metadata?.userId,
      orgSlug: metadata?.orgSlug,
      paymentId: payload.data.payment_id,
    });

    // Nothing to roll back — org is only created on success
    // Optionally send a failure email here via Resend / Nodemailer
  },

  onPayload: async (payload) => {
    // Catch-all for any event not explicitly handled above
    console.log("[dodo] unhandled webhook event:", (payload as any).type ?? "unknown", payload);
  },
});

export const GET = () => {
    return new Response("Dodo Payments Webhook Endpoint");
}