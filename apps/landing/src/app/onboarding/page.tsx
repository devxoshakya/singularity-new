import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Already has active membership → skip onboarding
  const active = await prisma.orgMembership.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (active) redirect("/dashboard");

  // Check if they already sent a pending request
  const pending = await prisma.orgMembership.findFirst({
    where: { userId, status: "PENDING" },
    include: { org: { select: { name: true } } },
  });

  return (
    <OnboardingShell
      initialStep={pending ? "pending" : "choose"}
      pendingOrgName={pending?.org.name ?? null}
    />
  );
}