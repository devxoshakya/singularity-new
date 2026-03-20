import {
    SidebarProvider,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppTopHeader } from "@/components/sidebar/app-top-header";
import { cookies } from "next/headers";
import { requireActiveMembership } from "@/lib/rbac";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const membership = await requireActiveMembership();

    const cookieStore = await cookies();
    const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

    return (
        // `relative` is required so the absolutely-positioned SidebarTrigger
        // can anchor itself to the sidebar/content boundary
        <SidebarProvider defaultOpen={sidebarOpen} className="relative">
            <AppSidebar role={membership.role} />
            <SidebarInset className="flex flex-col h-svh overflow-hidden">
                <AppTopHeader />

                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
