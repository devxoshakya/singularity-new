"use client";

import { useEffect, useState } from "react";
import { OnboardingPage } from "@/components/ui/onboarding-page";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Onboarding() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState("example@gg.com");

    useEffect(() => {
        let isMounted = true;

        const loadSession = async () => {
            try {
                const session = await authClient.getSession();
                if (!isMounted) return;

                if (!session?.data?.user) {
                    router.replace("/login");
                    return;
                }

                setUserEmail(session.data.user.email || "example@gg.com");
            } catch {
                if (isMounted) {
                    router.replace("/login");
                }
            }
        };

        void loadSession();

        return () => {
            isMounted = false;
        };
    }, [router]);

    return <OnboardingPage userEmail={userEmail} />;
}
