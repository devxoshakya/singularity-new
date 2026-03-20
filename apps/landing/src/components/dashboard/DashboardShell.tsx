"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Org, OrgMembership, OrgUser } from "@prisma/client";
import { StatsBar } from "./status-bar";
import { PendingRequests } from "./pending-requests";
import { StudentCache } from "./student-cache";
import { KnowledgeBase } from "./knowledge-base";
import { PlanUpgradeBanner } from "./plan-upgrade-banner";

type MemberWithUser = OrgMembership & { user: Pick<OrgUser, "id" | "email"> };

interface Props {
    org: Org;
    initialPending: MemberWithUser[];
}

export function DashboardShell({ org, initialPending }: Props) {
    const qc = useQueryClient();

    const usedPct =
        org.memberLimit > 0
            ? Math.round((org.memberCount / org.memberLimit) * 100)
            : 0;

    // Invalidate after accept/reject so stats update
    function invalidate() {
        qc.invalidateQueries({ queryKey: ["pending", org.id] });
        qc.invalidateQueries({ queryKey: ["org"] });
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
            {/* Plan upgrade banner — only when >80% */}
            {usedPct >= 80 && (
                <PlanUpgradeBanner
                    used={org.memberCount}
                    limit={org.memberLimit}
                    plan={org.plan}
                    pct={usedPct}
                />
            )}

            {/* Stats */}
            <StatsBar org={org} pendingCount={initialPending.length} />

            {/* Two column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left — pending requests (wider) */}
                <div className="lg:col-span-3">
                    <PendingRequests
                        orgId={org.id}
                        initialPending={initialPending}
                        onAction={invalidate}
                    />
                </div>

                {/* Right — student cache */}
                <div className="lg:col-span-2">
                    <StudentCache />
                </div>
            </div>

            {/* Knowledge base — full width */}
            <KnowledgeBase orgId={org.id} orgName={org.name} />
        </div>
    );
}
