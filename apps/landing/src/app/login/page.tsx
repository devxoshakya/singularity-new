import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { AuthPage } from "@/components/ui/auth-page";

export default async function LoginPage() {
  const { userId } = await auth();

  if (userId) {
    const activeMembership = await prisma.orgMembership.findFirst({
      where: { userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (activeMembership) {
      redirect(`/c/new`);
    }

    redirect("/onboarding");
  }

  return <AuthPage />;
}