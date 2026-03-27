import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? "PENDING"

    // Verify requester is admin of this org
    const admin = await prisma.orgMembership.findUnique({
        where: { orgId_userId: { orgId, userId } },
    })
    if (!admin || admin.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const members = await prisma.orgMembership.findMany({
        where: { orgId, status: status as any },
        include: {
            user: { select: { id: true, email: true } },
        },
        orderBy: { requestedAt: "asc" },
    })

    // Fetch OrgUser year for each member
    const userIds = members.map((m) => m.userId);
    const orgUsers = await prisma.orgUser.findMany({
        where: { id: { in: userIds } },
        select: { id: true, year: true },
    });
    const yearMap = new Map(orgUsers.map(u => [u.id, u.year ?? null]));

    const result = members.map((m) => ({
        ...m,
        year: yearMap.has(m.userId) ? yearMap.get(m.userId) : null,
    }));

    return NextResponse.json(result)
}