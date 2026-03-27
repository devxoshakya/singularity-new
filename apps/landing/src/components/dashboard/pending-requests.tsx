"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

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
    const [actingAll, setActingAll] = useState<boolean>(false);
    const [open, setOpen] = useState(false);

    const { data: pending = initialPending } = useQuery({
        queryKey: ["pending", orgId],
        queryFn: () => fetchPending(orgId),
        initialData: initialPending,
        staleTime: 1000 * 30,
    });

    const actionMutation = useMutation({
        mutationFn: async ({
            memberId,
            action,
        }: {
            memberId: string;
            action: "accept" | "reject";
        }) => {
            const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed");
            return data;
        },
        onSuccess: (_data, variables) => {
            toast.success(
                variables.action === "accept"
                    ? "Member accepted"
                    : "Request rejected",
            );
            qc.invalidateQueries({ queryKey: ["pending", orgId] });
            qc.invalidateQueries({ queryKey: ["active-members", orgId] });
            qc.invalidateQueries({ queryKey: ["org"] });
            onAction();
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
        onSettled: () => {
            setActing(null);
        },
    });

    async function handleAction(memberId: string, action: "accept" | "reject") {
        setActing(memberId);
        await actionMutation.mutateAsync({ memberId, action });
    }

    async function handleAcceptAll() {
        setActingAll(true);
        try {
            await Promise.all(
                pending.map((m) =>
                    actionMutation.mutateAsync({ memberId: m.id, action: "accept" })
                )
            );
        } catch (err) {
            // errors handled individually in the mutation
        } finally {
            setActingAll(false);
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    className="h-auto w-full rounded-lg bg-muted/30 px-3 py-1 hover:bg-muted/50"
                >
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 text-left">
                            <p className="text-sm font-medium">
                                {pending.length} pending request
                                {pending.length === 1 ? "" : "s"}
                            </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                            Check them
                        </Badge>
                    </div>
                </Button>
            </DrawerTrigger>

            <DrawerContent>
                <div className="mx-auto w-full max-w-2xl">
                    <DrawerHeader>
                        <DrawerTitle>Pending membership requests</DrawerTitle>
                        <DrawerDescription>
                            Review and process requests waiting for admin
                            approval.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="max-h-[58vh] overflow-y-auto no-scrollbar px-4 pb-2">
                        {pending.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Inbox className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    No pending requests
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    You are all caught up.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y rounded-lg border bg-background">
                                {pending.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between gap-3 p-3"
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

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                                                disabled={acting === m.id || actingAll}
                                                onClick={() =>
                                                    handleAction(m.id, "reject")
                                                }
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                disabled={acting === m.id || actingAll}
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
                    </div>

                    <DrawerFooter className="flex-row">
                        {pending.length > 0 && (
                            <Button
                                className="flex-1"
                                disabled={actingAll}
                                onClick={handleAcceptAll}
                            >
                                {actingAll ? "Accepting..." : "Accept All"}
                            </Button>
                        )}
                        <DrawerClose asChild>
                            <Button variant="outline" className="flex-1">
                                Close
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
