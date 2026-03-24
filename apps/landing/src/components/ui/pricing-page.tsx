"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PricingSection, type Plan } from "@/components/ui/pricing";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";
import { cn } from "@/lib/utils";

type PlanGroup = "BASIC_PLANS" | "PLUS_PLANS";

const BASIC_PLAN_KEYS: PlanKey[] = ["BASIC", "PRO", "PREMIUM"];
const PLUS_PLAN_KEYS: PlanKey[] = ["PRO_PLUS", "PREMIUM_PLUS"];

const PLAN_CONTENT: Record<
  PlanKey,
  {
    info: string;
    highlighted?: boolean;
    buttonText: string;
  }
> = {
  FREE: {
    info: "Free plan",
    buttonText: "Start Free",
  },
  BASIC: {
    info: "For individuals and small cohorts",
    buttonText: "Get Basic",
  },
  PRO: {
    info: "For growing organisations and teams",
    buttonText: "Get Pro",
  },
  PRO_PLUS: {
    info: "High-capacity plan for larger teams",
    buttonText: "Get Pro Plus",
  },
  PREMIUM: {
    info: "For institutions with high throughput",
    highlighted: true,
    buttonText: "Get Premium",
  },
  PREMIUM_PLUS: {
    info: "Top-tier plan for large deployments",
    buttonText: "Get Premium Plus",
  },
};

export function PricingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planGroup, setPlanGroup] = useState<PlanGroup>("BASIC_PLANS");

  const buildPlan = (planKey: PlanKey, group: PlanGroup): Plan => {
    const limits = PLAN_LIMITS[planKey];
    const content = PLAN_CONTENT[planKey];
    const isPlusPlan = group === "PLUS_PLANS";

    return {
      name: limits.label,
      info: content.info,
      price: {
        "1 Semester": limits.price,
        "2 Semesters": limits.price,
      },
      features: [
        {
          text: `${limits.studentLimit.toLocaleString()} student records`,
          tooltip: "Maximum student records supported by this plan",
        },
        {
          text: `${limits.memberLimit.toLocaleString()} organisation members`,
          tooltip: "Maximum team members allowed in your organisation",
        },
        {
          text: `Knowledge base limit: ${isPlusPlan ? "5 GB" : "2 GB"}`,
          tooltip: "Total storage available for your knowledge base content",
        },
        {
          text: `SLA: ${isPlusPlan ? "99.9%" : "99%"} uptime`,
          tooltip: "Platform uptime commitment",
        },
        {
          text: isPlusPlan ? "High priority support" : "Standard support",
          tooltip: isPlusPlan
            ? "Fast-track support queue for plus plans"
            : "Regular support response times",
        },
        {
          text: "One-time purchase",
          tooltip: "No recurring subscription fees",
        },
      ],
      btn: {
        text: content.buttonText,
        href: "#",
      },
      highlighted: content.highlighted,
      isOneTime: true,
    };
  };

  const basicPlans: Plan[] = BASIC_PLAN_KEYS.map((planKey) => buildPlan(planKey, "BASIC_PLANS"));
  const plusPlans: Plan[] = [
    ...PLUS_PLAN_KEYS.map((planKey) => buildPlan(planKey, "PLUS_PLANS")),
    {
      name: "Custom Enterprise",
      info: "Need limits above Plus plans?",
      price: {
        "1 Semester": 0,
        "2 Semesters": 0,
      },
      customPriceLabel: "Custom",
      features: [
        {
          text: "Custom pricing for larger deployments",
          tooltip: "Volume-based and institution-specific pricing",
        },
        {
          text: "Knowledge base limit: 5 GB+",
          tooltip: "Higher limits available based on use case",
        },
        {
          text: "SLA: 99.9% uptime",
          tooltip: "Enterprise-grade uptime commitment",
        },
        {
          text: "High priority support",
          tooltip: "Dedicated support path for enterprise accounts",
        },
      ],
      btn: {
        text: "Contact Sales",
        href: "mailto:sales@singularity.app",
      },
      isOneTime: true,
    },
  ];

  const plans = planGroup === "BASIC_PLANS" ? basicPlans : plusPlans;

  const handlePlanSelection = async (planName: string) => {
    setIsLoading(true);
    setSelectedPlan(planName);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${planName} plan selected successfully!`);

      setTimeout(() => {
        router.push("/login");
      }, 300);
    } catch {
      toast.error("Failed to select plan. Please try again.");
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const plansWithHandlers = plans.map((plan) => ({
    ...(plan.customPriceLabel
      ? plan
      : {
          ...plan,
          btn: {
            ...plan.btn,
            href: "#",
            onClick: () => handlePlanSelection(plan.name),
          },
          isLoading: isLoading && selectedPlan === plan.name,
          disabled: isLoading && selectedPlan !== plan.name,
        }),
  }));

  return (
    <main
      className={cn(
        "relative overflow-hidden",
        embedded ? "rounded-2xl " : "min-h-screen"
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 isolate -z-10 contain-strict opacity-60"
      >
        <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
        <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
        <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
      </div>

      <div className={cn("mx-auto px-4 py-12 md:py-20", embedded ? "max-w-300" : "container")}>
        {!embedded ? (
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#ffffff"
                viewBox="0 0 120 120"
                className="size-8 translate-x-[-0.5px]"
              >
                <path
                  fill="#ffffff"
                  fillRule="evenodd"
                  d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-center text-xl font-semibold text-white">Singularity</p>
          </div>
        ) : null}

        <div className="mx-auto mb-4 max-w-2xl space-y-2">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-center text-base md:text-lg">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mb-4 flex justify-center">
          <div className="bg-muted/30 flex w-full max-w-xs rounded-full border p-1">
            <button
              type="button"
              onClick={() => setPlanGroup("BASIC_PLANS")}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                planGroup === "BASIC_PLANS"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Basic Plans
            </button>
            <button
              type="button"
              onClick={() => setPlanGroup("PLUS_PLANS")}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                planGroup === "PLUS_PLANS"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Plus Plans
            </button>
          </div>
        </div>

        <PricingSection
          plans={plansWithHandlers}
          heading="Simple, transparent pricing"
          description="Choose the plan that's right for you"
          showFrequencyToggle={false}
          hideHeader
        />
      </div>
    </main>
  );
}