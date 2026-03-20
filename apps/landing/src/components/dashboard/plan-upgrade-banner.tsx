"use client";

import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const NEXT_PLAN: Record<string, string> = {
    FREE: "BASIC",
    BASIC: "PRO",
    PRO: "PRO_PLUS",
    PRO_PLUS: "PREMIUM",
    PREMIUM: "PREMIUM_PLUS",
};

const NEXT_LIMIT: Record<string, number> = {
    FREE: 1000,
    BASIC: 2500,
    PRO: 4000,
    PRO_PLUS: 6000,
    PREMIUM: 8000,
};

interface Props {
    used: number;
    limit: number;
    plan: string;
    pct: number;
}

export function PlanUpgradeBanner({ used, limit, plan, pct }: Props) {
    const nextPlan = NEXT_PLAN[plan];
    const nextLimit = NEXT_LIMIT[plan];

    if (!nextPlan) return null; // already on highest plan

    return (
        <div
            className={cn(
                "rounded-xl border p-4 flex items-center gap-4",
                pct >= 95
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-amber-500/5 border-amber-500/30",
            )}
        >
            <div
                className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    pct >= 95 ? "bg-destructive/10" : "bg-amber-500/10",
                )}
            >
                <Zap
                    className={cn(
                        "w-5 h-5",
                        pct >= 95 ? "text-destructive" : "text-amber-500",
                    )}
                />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                    {pct >= 95
                        ? "You're almost out of capacity"
                        : "You're approaching your plan limit"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {used} of {limit} members used ({pct}%)
                    {nextLimit &&
                        ` · Upgrade to ${nextPlan} for ${nextLimit.toLocaleString()} members`}
                </p>
                <Progress
                    value={pct}
                    className={cn(
                        "h-1 mt-2",
                        pct >= 95
                            ? "[&>div]:bg-destructive"
                            : "[&>div]:bg-amber-500",
                    )}
                />
            </div>

            <Button size="sm" variant="outline" className="shrink-0" asChild>
                <a href="/settings/org#plan">Upgrade plan</a>
            </Button>
        </div>
    );
}
