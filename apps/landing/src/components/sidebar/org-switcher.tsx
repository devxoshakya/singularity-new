"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown } from "lucide-react";

const PLAN_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
    FREE: "secondary",
    BASIC: "secondary",
    PRO: "default",
    PRO_PLUS: "default",
    PREMIUM: "outline",
    PREMIUM_PLUS: "outline",
};

async function fetchOrg() {
    const res = await fetch("/api/orgs/me");
    if (!res.ok) throw new Error("Failed");
    return res.json() as Promise<{ id: string; name: string; plan: string }>;
}

export function OrgSwitcher() {
    const { data, isLoading } = useQuery({
        queryKey: ["org"],
        queryFn: fetchOrg,
        staleTime: Infinity,
    });
    const { open, isMobile } = useSidebar();
    const isCollapsed = !open && !isMobile;

    if (isCollapsed) {
        // Collapsed: just the logo, centered
        return (
            <div className="flex justify-center py-1">
                <Image src="/logo.svg" alt="org" width={26} height={26} priority />
            </div>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="cursor-default hover:bg-sidebar-accent/40 h-auto py-2.5 gap-3"
                >
                    {/* Logo */}
                    <div className="flex aspect-square w-9 items-center justify-center rounded-lg shrink-0">
                        <Image
                            src="/logo.svg"
                            alt="org"
                            width={28}
                            height={28}
                            priority
                        />
                    </div>

                    {/* Org name + plan */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-3.5 w-28" />
                                <Skeleton className="h-3 w-14 mt-1" />
                            </>
                        ) : (
                            <>
                                <span className="truncate text-sm font-semibold leading-tight">
                                    {data?.name ?? "My Organisation"}
                                </span>
                                <Badge
                                    variant={
                                        PLAN_VARIANT[data?.plan ?? "FREE"] ??
                                        "secondary"
                                    }
                                    className="w-fit text-[10px] px-1.5 py-0 h-4"
                                >
                                    {data?.plan ?? "FREE"}
                                </Badge>
                            </>
                        )}
                    </div>

                    <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
