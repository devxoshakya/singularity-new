"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Org, OrgMembership, OrgUser } from "@prisma/client";
import { StatsBar } from "./status-bar";
import { StudentCache } from "./student-cache";
import { KnowledgeBase } from "./knowledge-base";
import { PlanUpgradeBanner } from "./plan-upgrade-banner";
import { OrgMembersTable } from "./org-members-table";

type MemberWithUser = OrgMembership & { user: Pick<OrgUser, "id" | "email"> };

interface Props {
    org: Org;
    initialPending: MemberWithUser[];
    initialActive: MemberWithUser[];
}

export function DashboardShell({ org, initialPending, initialActive }: Props) {
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
        <div className="w-full max-w-5xl mx-auto px-6 py-8 space-y-6">
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

            <div className="space-y-6">
                <OrgMembersTable
                    orgId={org.id}
                    initialActive={initialActive}
                    initialPending={initialPending}
                    onAction={invalidate}
                />

                <StudentCache />
            </div>

            {/* Knowledge base — full width */}
            <KnowledgeBase orgId={org.id} orgName={org.name} />
        </div>
    );
}
