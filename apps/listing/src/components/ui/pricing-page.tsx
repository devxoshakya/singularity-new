"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { CheckIcon, Sparkles, Zap, Crown } from "lucide-react";
import { Spinner } from "./spinner";

const plans = [
    {
        name: "Free",
        price: "₹0",
        period: "forever",
        description: "Perfect for trying out Singularity",
        icon: Sparkles,
        features: [
            "Up to 10 result queries per month",
            "Basic result analysis",
            "Email support",
            "Export to CSV",
            "7-day data retention",
        ],
        limitations: [
            "No bulk operations",
            "No advanced analytics",
            "No API access",
        ],
        popular: false,
        gradient: "from-gray-500 to-gray-600",
    },
    {
        name: "Pro",
        price: "₹999",
        period: "per month",
        description: "For active users and small teams",
        icon: Zap,
        features: [
            "Unlimited result queries",
            "Advanced analytics & insights",
            "Bulk operations support",
            "Priority email support",
            "Export to Excel & PDF",
            "90-day data retention",
            "Custom reports",
            "API access (1000 calls/day)",
        ],
        limitations: [],
        popular: true,
        gradient: "from-blue-500 to-purple-600",
    },
    {
        name: "Premium",
        price: "₹2,499",
        period: "per month",
        description: "For institutions and power users",
        icon: Crown,
        features: [
            "Everything in Pro",
            "Unlimited API access",
            "White-label reports",
            "Dedicated support line",
            "Custom integrations",
            "Unlimited data retention",
            "Multi-user collaboration",
            "Advanced automation",
            "SLA guarantee",
            "Training sessions",
        ],
        limitations: [],
        popular: false,
        gradient: "from-purple-500 to-pink-600",
    },
];

export function PricingPage() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelectPlan = async (planName: string) => {
        setSelectedPlan(planName);
        setIsSubmitting(true);

        try {
            // TODO: Add your API call here to save selected plan
            // await saveUserPlan({ plan: planName });

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Redirect to dashboard/home
            router.push("/dashboard" as any);
        } catch (error) {
            console.error("Plan selection error:", error);
            setIsSubmitting(false);
            setSelectedPlan(null);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
            >
                <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
                <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
                <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
            </div>

            <div className="container mx-auto px-4 py-12 md:py-20">
                <div className="text-center mb-12 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-wide">
                            Choose Your Plan
                        </h1>
                        <p className="text-muted-foreground text-lg mt-2">
                            Select the perfect plan for your needs
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon;
                        const isSelected = selectedPlan === plan.name;
                        const isLoading = isSelected && isSubmitting;

                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={cn(
                                    "relative rounded-2xl border p-6 transition-all duration-300",
                                    plan.popular
                                        ? "border-primary shadow-xl scale-105 md:scale-110"
                                        : "border-border hover:border-primary/50",
                                    isSelected && "ring-2 ring-primary"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "p-2 rounded-lg bg-gradient-to-br",
                                                plan.gradient
                                            )}
                                        >
                                            <Icon className="size-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">
                                                {plan.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">
                                                {plan.price}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                /{plan.period}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        {plan.features.map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-start gap-3"
                                            >
                                                <CheckIcon className="size-5 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-sm">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => handleSelectPlan(plan.name)}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "w-full mt-6",
                                            plan.popular &&
                                                "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                        )}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Spinner className="size-4 me-2" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <span>
                                                {plan.name === "Free"
                                                    ? "Start Free"
                                                    : "Get Started"}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <p className="text-muted-foreground text-sm">
                        All plans include basic features. Cancel anytime.
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                        Need a custom plan?{" "}
                        <a
                            href="#"
                            className="text-primary hover:underline underline-offset-4"
                        >
                            Contact us
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}
