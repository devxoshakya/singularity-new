"use client";

import React, { useState } from "react";
import { Button } from "./button";
import { PricingSection } from "./pricing";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const plans = [
    {
        name: "Basic",
        info: "Perfect for trying out Singularity",
        price: {
            "1 Semester": 0,
            "2 Semesters": 0,
        },
        features: [
            { text: "Access to ranking of all students", tooltip: "View complete student rankings" },
            { text: "List of all 5700+ student database", tooltip: "Full access to student directory" },
            { text: "5 free result views per semester", tooltip: "View up to 5 results each semester" },
            { text: "Semester-wise SGPA only", tooltip: "Basic SGPA information" },
        ],
        btn: {
            text: "Start Free",
            href: "#",
            onClick: "basic",
        },
        isFree: true,
    },
    {
        name: "Premium",
        info: "For institutions and power users",
        price: {
            "1 Semester": 199,
            "2 Semesters": 339, // 15% discount (199*2 = 398, with 15% off = 338.3 ≈ 339)
        },
        features: [
            { text: "Access to ranking of all students", tooltip: "View complete student rankings" },
            { text: "List of all 5700+ student database", tooltip: "Full access to student directory" },
            { text: "100 result views per semester", tooltip: "View up to 100 results each semester" },
            { text: "Detailed result view", tooltip: "Complete result breakdown with all details" },
            { text: "Latest semester marks", tooltip: "Access to most recent semester marks" },
            { text: "Semester-wise SGPA", tooltip: "Detailed SGPA for each semester" },
            { text: "Profile view tracking", tooltip: "See who has viewed your result" },
            { text: "Advanced analytics", tooltip: "Detailed insights and trends" },
            { text: "Priority support", tooltip: "Get help when you need it" },
        ],
        btn: {
            text: "Get Started",
            href: "#",
            onClick: "premium",
        },
        highlighted: true,
    },
    {
        name: "Pro",
        info: "For active users and small teams",
        price: {
            "1 Semester": 99,
            "2 Semesters": 179, // 10% discount (99*2 = 198, with 10% off = 178.2 ≈ 179)
        },
        features: [
            { text: "Access to ranking of all students", tooltip: "View complete student rankings" },
            { text: "List of all 5700+ student database", tooltip: "Full access to student directory" },
            { text: "50 result views per semester", tooltip: "View up to 50 results each semester" },
            { text: "Detailed result view", tooltip: "Complete result breakdown with all details" },
            { text: "Latest semester marks", tooltip: "Access to most recent semester marks" },
            { text: "Semester-wise SGPA", tooltip: "Detailed SGPA for each semester" },
        ],
        btn: {
            text: "Get Started",
            href: "#",
            onClick: "pro",
        },
    },
];

export function PricingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const handlePlanSelection = async (planName: string) => {
        setIsLoading(true);
        setSelectedPlan(planName);
        
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            
            toast.success(`${planName} plan selected successfully!`);
            
            // Redirect to home page
            setTimeout(() => {
                router.push("/dashboard");
            }, 500);
        } catch (error) {
            toast.error("Failed to select plan. Please try again.");
            setIsLoading(false);
            setSelectedPlan(null);
        }
    };

    // Update plans with onClick handlers
    const plansWithHandlers = plans.map(plan => ({
        ...plan,
        btn: {
            ...plan.btn,
            href: "#",
            onClick: () => handlePlanSelection(plan.name),
        },
        isLoading: isLoading && selectedPlan === plan.name,
        disabled: isLoading && selectedPlan !== plan.name,
    }));

    return (
        <main className="relative bg-black min-h-screen overflow-hidden">
           
            <div
                aria-hidden
                className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
            >
                <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
                <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
                <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
            </div>

            <div className="container mx-auto px-4 py-12 md:py-20">
                <PricingSection
                    plans={plansWithHandlers as any}
                    heading="Choose Your Plan"
                    description="Select the perfect plan for your needs. Start for free and upgrade as you grow."
                />
            </div>
        </main>
    );
}
