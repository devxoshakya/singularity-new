"use client";

import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function fallbackTitleFromPath(pathname: string) {
    const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
    if (!firstSegment) return "Overview";

    return firstSegment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getPageTitle(pathname: string) {
    if (pathname === "/c" || pathname.startsWith("/c/")) {
        return "RAG based Chat";
    }

    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
        return "Student Dashboard";
    }

    if (pathname === "/setting" || pathname.startsWith("/setting/")) {
        return "Admin Settings";
    }

    if (
        pathname === "/account-setting" ||
        pathname.startsWith("/account-setting/")
    ) {
        return "Account Settings";
    }

    return fallbackTitleFromPath(pathname);
}

export function AppTopHeader() {
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <SidebarTrigger className="h-8 w-8" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium truncate">{title}</span>
        </header>
    );
}
