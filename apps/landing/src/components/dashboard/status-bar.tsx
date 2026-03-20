"use client";

import { useQuery } from "@tanstack/react-query";
import type { Org } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, GraduationCap, Clock, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    org: Org;
    pendingCount: number;
}

async function fetchCacheCount(): Promise<number> {
    const res = await fetch("https://h.devshakya.xyz/api/result/cache");
    if (!res.ok) return 0;
    const json = await res.json();
    return Array.isArray(json.data) ? json.data.length : 0;
}

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    progress,
    danger,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    progress?: number;
    danger?: boolean;
}) {
    return (
        <Card className={cn(danger && "border-destructive/40")}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {label}
                        </p>
                        <p
                            className={cn(
                                "text-2xl font-bold mt-0.5 tracking-tight",
                                danger && "text-destructive",
                            )}
                        >
                            {value}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            danger ? "bg-destructive/10" : "bg-muted",
                        )}
                    >
                        <Icon
                            className={cn(
                                "w-4 h-4",
                                danger
                                    ? "text-destructive"
                                    : "text-muted-foreground",
                            )}
                        />
                    </div>
                </div>

                {progress !== undefined && (
                    <Progress value={progress} className="h-1.5 mb-1.5" />
                )}

                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
        </Card>
    );
}

export function StatsBar({ org, pendingCount }: Props) {
    const memberPct =
        org.memberLimit > 0
            ? Math.round((org.memberCount / org.memberLimit) * 100)
            : 0;

    const { data: cacheCount = 0 } = useQuery({
        queryKey: ["cache-count"],
        queryFn: fetchCacheCount,
        staleTime: 1000 * 60 * 60, // 1 hour — cache data changes rarely
    });

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Members"
                value={`${org.memberCount} / ${org.memberLimit}`}
                sub={`${memberPct}% of plan used`}
                icon={Users}
                progress={memberPct}
                danger={memberPct >= 90}
            />
            <StatCard
                label="Students in system"
                value={cacheCount.toString()}
                sub="Across all years"
                icon={GraduationCap}
            />
            <StatCard
                label="Pending requests"
                value={pendingCount.toString()}
                sub={
                    pendingCount > 0
                        ? "Awaiting your approval"
                        : "All caught up"
                }
                icon={Clock}
                danger={pendingCount > 0}
            />
            <StatCard
                label="Plan"
                value={org.plan}
                sub={`${org.memberLimit - org.memberCount} slots remaining`}
                icon={Layers}
            />
        </div>
    );
}
