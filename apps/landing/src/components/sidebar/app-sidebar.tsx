"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, Plus, Search } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";

import { NavHistory } from "@/components/sidebar/nav-history";
import { NavUser } from "@/components/sidebar/nav-user";
import { OrgSwitcher } from "@/components/sidebar/org-switcher";
import { SearchCommand } from "@/components/chat/SearchCommand";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/lib/rbac";
import { LocalStorageService } from "@/lib/local-storage-service";

const TOP_NAV = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        adminOnly: true,
    },
    {
        label: "Settings",
        href: "/setting",
        icon: Settings,
        adminOnly: true,
    },
];

type CachedConversation = {
    id: string;
};

function isCurrentChatAlreadyNew(pathname: string) {
    if (typeof window === "undefined") return false;
    if (pathname === "/c") return true;
    if (!pathname.startsWith("/c/")) return false;

    const conversationId = pathname.slice(3).trim();
    if (!conversationId) return true;

    try {
        const parsed = LocalStorageService.getChatHistory();

        const existsInHistory = parsed.some(
            (item): item is CachedConversation =>
                !!item &&
                typeof item === "object" &&
                typeof (item as any).id === "string" &&
                (item as any).id === conversationId,
        );

        return !existsInHistory;
    } catch {
        return true;
    }
}

function buildNewChatPath() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `/c/${crypto.randomUUID()}`;
    }

    const fallback = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `/c/${fallback}`;
}

// ── Collapsed icon strip ──────────────────────────────────────────────────────

function CollapsedControls({ onNewChat }: { onNewChat: () => void }) {
    const { setOpen } = useSidebar();

    return (
        <div className="flex flex-col items-center gap-1 w-full pt-0 pb-1">
            <img
                src="/logo.svg"
                alt="org"
                width={26}
                height={26}
                className="mb-1 bg-purple-600 rounded-md p-1 h-8 w-8"
            />

            {/* New chat */}
            <button
                type="button"
                onClick={onNewChat}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                title="New chat"
            >
                <Plus className="w-5 h-5" />
            </button>

            {/* Search */}
            <button
                onClick={() => {
                    setOpen(true);
                    setTimeout(() => {
                        document.dispatchEvent(
                            new KeyboardEvent("keydown", {
                                key: "k",
                                ctrlKey: true,
                                metaKey: true,
                                bubbles: true,
                            }),
                        );
                    }, 160);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                title="Search"
            >
                <Search className="w-5 h-5" />
            </button>
        </div>
    );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export function AppSidebar({ role }: { role: OrgRole }) {
    const pathname = usePathname();
    const router = useRouter();
    const { open, isMobile } = useSidebar();
    const isCollapsed = !open && !isMobile;
    const visibleTopNav = TOP_NAV.filter((item) => !item.adminOnly || role === "ADMIN");
    const openNewChat = () => {
        if (isCurrentChatAlreadyNew(pathname)) return;
        router.push(buildNewChatPath());
    };

    return (
        <Sidebar collapsible="icon">
                {/* ── Header ── */}
                <SidebarHeader
                    className={cn(
                        "overflow-x-hidden",
                        isCollapsed ? "px-1.5 pt-3 pb-1" : "px-3 pt-4 pb-2",
                    )}
                >
                    {!isCollapsed ? (
                        <div className="flex flex-col gap-3">
                            {/* Org switcher — logo + name + plan at top */}
                            <OrgSwitcher />

                            {/* New chat */}
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        type="button"
                                        onClick={openNewChat}
                                        className="h-9 text-[13px] font-medium bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                                    >
                                        <>
                                            <Plus className="w-4 h-4 shrink-0" />
                                            <span>New chat</span>
                                        </>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>

                            {/* Search */}
                            <SearchCommand />
                        </div>
                    ) : (
                        /* Collapsed: only search + new chat icons */
                        <CollapsedControls onNewChat={openNewChat} />
                    )}

                    {isCollapsed && <SearchCommand hideTrigger />}
                </SidebarHeader>

                {/* ── Content ── */}
                <SidebarContent
                    className={cn(
                        "overflow-x-hidden",
                        isCollapsed ? "px-1.5 pt-1" : "px-3 pt-2",
                    )}
                >
                    {/* Dashboard + Settings — only when expanded */}
                    {!isCollapsed && (
                        <>
                            <SidebarMenu>
                                {visibleTopNav.map(({ label, href, icon: Icon }) => (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname.startsWith(href)}
                                            tooltip={label}
                                            className="h-9 text-[13px]"
                                        >
                                            <Link href={href}>
                                                <Icon className="w-[17px] h-[17px] shrink-0" />
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>

                            <SidebarSeparator className="my-3" />
                            <NavHistory />
                        </>
                    )}

                    {/* Dashboard + Settings icons — collapsed only */}
                    {isCollapsed && (
                        <SidebarMenu className="mt-2">
                            {visibleTopNav.map(({ label, href, icon: Icon }) => (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname.startsWith(href)}
                                        tooltip={label}
                                        className="h-10 justify-center px-0"
                                    >
                                        <Link href={href}>
                                            <Icon className="w-5 h-5 shrink-0" />
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarSeparator className="my-2" />
                        </SidebarMenu>
                    )}

                    {/* Chat history */}
                </SidebarContent>

                {/* ── Footer ── */}
                <SidebarFooter
                    className={cn(
                        "overflow-x-hidden",
                        open ? "px-1.5 pb-3" : "px-1.5 pb-3",
                    )}
                >
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
    );
}
