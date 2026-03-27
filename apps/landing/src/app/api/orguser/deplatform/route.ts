import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// POST: Deplatform all users by year
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        // TODO: Add admin check for userId if needed
        const body = await req.json();
        const { year } = body;
        if (!year) {
            return new NextResponse("Missing year", { status: 400 });
        }
        // Find all OrgUsers with this year and not already passout
        const orgUsers = await prisma.orgUser.findMany({
            where: { year, passout: false },
            select: { id: true },
        });
        const userIds = orgUsers.map(u => u.id);

        // Mark as passout
        await prisma.orgUser.updateMany({
            where: { id: { in: userIds } },
            data: { passout: true },
        });

        // Remove from all orgs (delete OrgMemberships)
        const deleteResult = await prisma.orgMembership.deleteMany({
            where: { userId: { in: userIds } },
        });

        return NextResponse.json({ passoutCount: userIds.length, removedMemberships: deleteResult.count });
    } catch (error) {
        console.error("[ORGUSER_DEPLATFORM]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
