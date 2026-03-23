import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PatchBody = {
    action?: "accept" | "reject";
};

export async function PATCH(
    req: Request,
    {
        params,
    }: {
        params: Promise<{ orgId: string; memberId: string }>;
    },
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, memberId } = await params;
    const body = (await req.json().catch(() => ({}))) as PatchBody;
    const action = body.action;

    if (action !== "accept" && action !== "reject") {
        return NextResponse.json(
            { error: "Invalid action. Use 'accept' or 'reject'." },
            { status: 400 },
        );
    }

    const admin = await prisma.orgMembership.findUnique({
        where: { orgId_userId: { orgId, userId } },
        select: { role: true, status: true },
    });

    if (!admin || admin.role !== "ADMIN" || admin.status !== "ACTIVE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const updatedMembership = await prisma.$transaction(async (tx) => {
            const membership = await tx.orgMembership.findFirst({
                where: { id: memberId, orgId },
                include: { user: { select: { id: true, email: true } } },
            });

            if (!membership) {
                throw new Error("NOT_FOUND");
            }

            if (membership.status !== "PENDING") {
                throw new Error("ALREADY_PROCESSED");
            }

            if (action === "accept") {
                if (membership.role === "MEMBER") {
                    const org = await tx.org.findUnique({
                        where: { id: orgId },
                        select: {
                            memberLimit: true,
                            memberCount: true,
                            studentLimit: true,
                            studentCount: true,
                        },
                    });

                    if (!org) {
                        throw new Error("ORG_NOT_FOUND");
                    }

                    if (
                        org.memberLimit > 0 &&
                        org.memberCount >= org.memberLimit
                    ) {
                        throw new Error("MEMBER_LIMIT_REACHED");
                    }

                    if (
                        org.studentLimit > 0 &&
                        org.studentCount >= org.studentLimit
                    ) {
                        throw new Error("STUDENT_LIMIT_REACHED");
                    }

                    await tx.org.update({
                        where: { id: orgId },
                        data: {
                            memberCount: { increment: 1 },
                            studentCount: { increment: 1 },
                        },
                    });
                }

                return tx.orgMembership.update({
                    where: { id: memberId },
                    data: {
                        status: "ACTIVE",
                        acceptedAt: new Date(),
                    },
                    include: { user: { select: { id: true, email: true } } },
                });
            }

            return tx.orgMembership.update({
                where: { id: memberId },
                data: {
                    status: "REJECTED",
                },
                include: { user: { select: { id: true, email: true } } },
            });
        });

        return NextResponse.json(updatedMembership);
    } catch (error) {
        const message = error instanceof Error ? error.message : "UNKNOWN";

        if (message === "NOT_FOUND") {
            return NextResponse.json(
                { error: "Membership request not found." },
                { status: 404 },
            );
        }

        if (message === "ALREADY_PROCESSED") {
            return NextResponse.json(
                { error: "This request has already been processed." },
                { status: 409 },
            );
        }

        if (message === "MEMBER_LIMIT_REACHED") {
            return NextResponse.json(
                { error: "Member limit reached for this plan." },
                { status: 409 },
            );
        }

        if (message === "STUDENT_LIMIT_REACHED") {
            return NextResponse.json(
                { error: "Student limit reached for this plan." },
                { status: 409 },
            );
        }

        if (message === "ORG_NOT_FOUND") {
            return NextResponse.json(
                { error: "Organisation not found." },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { error: "Failed to process membership request." },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _req: Request,
    {
        params,
    }: {
        params: Promise<{ orgId: string; memberId: string }>;
    },
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, memberId } = await params;

    const admin = await prisma.orgMembership.findUnique({
        where: { orgId_userId: { orgId, userId } },
        select: { id: true, role: true, status: true },
    });

    if (!admin || admin.role !== "ADMIN" || admin.status !== "ACTIVE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const removed = await prisma.$transaction(async (tx) => {
            const membership = await tx.orgMembership.findFirst({
                where: { id: memberId, orgId },
                select: { id: true, role: true, status: true, userId: true },
            });

            if (!membership) {
                throw new Error("NOT_FOUND");
            }

            if (membership.status !== "ACTIVE") {
                throw new Error("NOT_ACTIVE");
            }

            if (membership.role === "ADMIN") {
                throw new Error("ADMIN_REMOVE_BLOCKED");
            }

            if (membership.userId === userId) {
                throw new Error("SELF_REMOVE_BLOCKED");
            }

            await tx.orgMembership.delete({ where: { id: memberId } });

            await tx.org.update({
                where: { id: orgId },
                data: {
                    memberCount: { decrement: 1 },
                    studentCount: { decrement: 1 },
                },
            });

            return { id: memberId };
        });

        return NextResponse.json({ success: true, data: removed });
    } catch (error) {
        const message = error instanceof Error ? error.message : "UNKNOWN";

        if (message === "NOT_FOUND") {
            return NextResponse.json({ error: "Member not found." }, { status: 404 });
        }

        if (message === "NOT_ACTIVE") {
            return NextResponse.json(
                { error: "Only active members can be removed." },
                { status: 409 },
            );
        }

        if (message === "ADMIN_REMOVE_BLOCKED") {
            return NextResponse.json(
                { error: "Admins cannot be removed from this endpoint." },
                { status: 409 },
            );
        }

        if (message === "SELF_REMOVE_BLOCKED") {
            return NextResponse.json(
                { error: "You cannot remove yourself." },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: "Failed to remove member." },
            { status: 500 },
        );
    }
}
