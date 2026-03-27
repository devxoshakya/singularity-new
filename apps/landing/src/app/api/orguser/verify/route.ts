import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { rollNo, dob, year } = body;

        if (!rollNo || !dob) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const orgUser = await prisma.orgUser.findUnique({
            where: { id: userId },
        });

        if (!orgUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        const updatedUser = await prisma.orgUser.update({
            where: { id: userId },
            data: { rollNo, dob, year },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[ORGUSER_VERIFY]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
