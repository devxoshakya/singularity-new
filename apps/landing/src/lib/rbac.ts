import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export type OrgRole = "ADMIN" | "MEMBER";

type ActiveMembership = {
    id: string;
    orgId: string;
    userId: string;
    role: OrgRole;
    status: "ACTIVE";
};

export async function requireActiveMembership(): Promise<ActiveMembership> {
    const { userId } = await auth();
    if (!userId) {
        redirect("/login");
    }

    const membership = await prisma.orgMembership.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { requestedAt: "desc" },
    });

    if (!membership) {
        redirect("/onboarding");
    }

    return membership as ActiveMembership;
}

export async function requireRole(role: OrgRole): Promise<ActiveMembership> {
    const membership = await requireActiveMembership();

    if (membership.role !== role) {
        redirect("/c");
    }

    return membership;
}
