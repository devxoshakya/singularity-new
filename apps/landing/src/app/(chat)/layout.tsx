import {
    SidebarProvider,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppTopHeader } from "@/components/sidebar/app-top-header";
import { cookies } from "next/headers";
import { requireActiveMembership } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { StudentVerificationDialog } from "@/components/auth/StudentVerificationDialog";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const membership = await requireActiveMembership();

    const orgUser = await prisma.orgUser.findUnique({
        where: { id: membership.userId }
    });
    
    // Check if the user is missing the required rollNo or dob fields
    const needsVerification = !orgUser?.rollNo || !orgUser?.dob;

    const cookieStore = await cookies();
    const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

    return (
        <SidebarProvider defaultOpen={sidebarOpen} className="relative">
            <AppSidebar role={membership.role} />
            <SidebarInset className="flex flex-col h-svh overflow-hidden">
                <AppTopHeader />

                {children}

                {needsVerification && (
                    <StudentVerificationDialog isOpen={true} />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
