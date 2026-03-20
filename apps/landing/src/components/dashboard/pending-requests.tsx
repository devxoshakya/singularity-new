"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Member = {
    id: string;
    userId: string;
    status: string;
    requestedAt: string | Date;
    user: { id: string; email: string };
};

interface Props {
    orgId: string;
    initialPending: Member[];
    onAction: () => void;
}

async function fetchPending(orgId: string): Promise<Member[]> {
    const res = await fetch(`/api/orgs/${orgId}/members?status=PENDING`);
    if (!res.ok) return [];
    return res.json();
}

export function PendingRequests({ orgId, initialPending, onAction }: Props) {
    const qc = useQueryClient();
    const [acting, setActing] = useState<string | null>(null);

    const { data: pending = initialPending } = useQuery({
        queryKey: ["pending", orgId],
        queryFn: () => fetchPending(orgId),
        initialData: initialPending,
        staleTime: 1000 * 30,
    });

    async function handleAction(memberId: string, action: "accept" | "reject") {
        setActing(memberId);
        try {
            const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed");

            toast.success(
                action === "accept" ? "Member accepted" : "Request rejected",
            );
            qc.invalidateQueries({ queryKey: ["pending", orgId] });
            onAction();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActing(null);
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            Pending requests
                            {pending.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {pending.length}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                            Students waiting for approval to join your org
                        </CardDescription>
                    </div>
                    {pending.length > 3 && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/members">
                                View all <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {pending.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Check className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No pending requests
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            You're all caught up
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {pending.slice(0, 5).map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center justify-between py-3 gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {m.user.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(
                                            new Date(m.requestedAt),
                                            { addSuffix: true },
                                        )}
                                    </p>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                                        disabled={acting === m.id}
                                        onClick={() =>
                                            handleAction(m.id, "reject")
                                        }
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        disabled={acting === m.id}
                                        onClick={() =>
                                            handleAction(m.id, "accept")
                                        }
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
