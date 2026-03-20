import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeMembership = await prisma.orgMembership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      ...(orgId ? { orgId } : {}),
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          plan: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  if (!activeMembership?.org) {
    return NextResponse.json({ error: "Active organisation not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...activeMembership.org,
    role: activeMembership.role,
  });
}
