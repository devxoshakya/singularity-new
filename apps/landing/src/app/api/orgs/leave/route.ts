import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeMembership = await prisma.orgMembership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      orgId: true,
      role: true,
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  if (!activeMembership) {
    return NextResponse.json(
      { error: "Active organisation membership not found." },
      { status: 404 },
    );
  }

  if (activeMembership.role === "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Admins cannot leave organisation from this screen. Transfer ownership or use admin member controls.",
      },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.orgMembership.delete({
        where: { id: activeMembership.id },
      });

      await tx.org.update({
        where: { id: activeMembership.orgId },
        data: {
          memberCount: { decrement: 1 },
          studentCount: { decrement: 1 },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to leave organisation." },
      { status: 500 },
    );
  }
}
