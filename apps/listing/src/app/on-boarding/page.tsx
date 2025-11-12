
import { OnboardingPage } from "@/components/ui/onboarding-page";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Onboarding() {
    const session = await authClient.getSession({
            fetchOptions: {
                headers: await headers(),
                throw: true,
            },
        });
    
        if (!session?.user) {
            redirect("/login");
        }
    return <OnboardingPage userEmail={session.user.email} />;
}