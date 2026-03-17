import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";

const DODO_BASE_URL =
  process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    orgName: string;
    orgSlug: string;
    plan: PlanKey;
  };

  const orgName = body.orgName?.trim();
  const orgSlug = body.orgSlug?.trim();
  const plan = body.plan;

  if (!orgName || !orgSlug) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  if (!plan || plan === "FREE" || !PLAN_LIMITS[plan]?.dodoProductId) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const slugTaken = await prisma.org.findUnique({ where: { slug: orgSlug } });
  if (slugTaken) {
    return NextResponse.json({ error: "This slug is already taken." }, { status: 409 });
  }

  const selectedPlan = PLAN_LIMITS[plan];
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL;

  if (!apiKey) {
    return NextResponse.json({ error: "Server payment config is incomplete." }, { status: 500 });
  }

  const res = await fetch(`${DODO_BASE_URL}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      product_cart: [{ product_id: selectedPlan.dodoProductId, quantity: 1 }],
      return_url: returnUrl,
      metadata: { userId, orgName, orgSlug, plan },
    }),
  });

  const data = (await res.json()) as { checkout_url?: string };

  if (!res.ok || !data.checkout_url) {
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: data.checkout_url });
}
