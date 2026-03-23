import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/login");

    // Admin-only guard
    const membership = await prisma.orgMembership.findFirst({
        where: { userId, status: "ACTIVE", role: "ADMIN" },
        include: { org: true },
    });

    if (!membership) redirect("/c");

    const { org } = membership;

    // Pending requests — fetched server-side for instant paint
    const pending = await prisma.orgMembership.findMany({
        where: { orgId: org.id, status: "PENDING" },
        include: { user: { select: { id: true, email: true } } },
        orderBy: { requestedAt: "asc" },
        take: 10,
    });

    const active = await prisma.orgMembership.findMany({
        where: { orgId: org.id, status: "ACTIVE" },
        include: { user: { select: { id: true, email: true } } },
        orderBy: { acceptedAt: "desc" },
        take: 200,
    });

    return (
        <>
            <main className="flex-1 overflow-y-auto no-scrollbar">
                <DashboardShell
                    org={org}
                    initialPending={pending}
                    initialActive={active}
                />
            </main>
        </>
    );
}
