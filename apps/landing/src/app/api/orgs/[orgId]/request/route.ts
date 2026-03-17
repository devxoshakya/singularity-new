import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string | null };
  const clientEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const { orgId } = await params;

  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { id: true, isPublic: true, plan: true },
  });

  if (!org || !org.isPublic) {
    return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
  }

  if (org.plan === "FREE") {
    return NextResponse.json({ error: "This organisation cannot accept members yet." }, { status: 403 });
  }

  const existing = await prisma.orgMembership.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });

  if (existing) {
    const messages: Record<string, string> = {
      PENDING: "You already have a pending request for this organisation.",
      ACTIVE: "You are already a member of this organisation.",
      REJECTED: "Your previous request was rejected. Contact the admin.",
    };

    return NextResponse.json({ error: messages[existing.status] ?? "Request already exists." }, { status: 409 });
  }

  await prisma.orgUser.upsert({
    where: { id: userId },
    update: clientEmail ? { email: clientEmail } : {},
    create: {
      id: userId,
      email: clientEmail || `${userId}@placeholder.local`,
    },
  });

  const membership = await prisma.orgMembership.create({
    data: { orgId, userId, role: "MEMBER", status: "PENDING" },
  });

  return NextResponse.json(membership, { status: 201 });
}
