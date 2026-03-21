"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    KeyRound,
    Hash,
    HelpCircle,
    LogOut,
    ChevronUp,
    UserCircle2,
    Pencil,
} from "lucide-react";

import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClerk } from "@clerk/nextjs";

// ── Edit modal for roll no / API key ─────────────────────────────────────────

type EditField = "roll-no" | "auth-token" | null;

function EditModal({
    field,
    onClose,
}: {
    field: EditField;
    onClose: () => void;
}) {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (field) setValue(localStorage.getItem(field) ?? "");
    }, [field]);

    function handleSave() {
        if (!field) return;
        localStorage.setItem(field, value.trim());
        onClose();
        // Force page reload so headers update on next request
        window.dispatchEvent(new Event("storage"));
    }

    const config = {
        "roll-no": {
            title: "Edit roll number",
            label: "Roll number",
            placeholder: "e.g. 22BCE1234",
            type: "text",
            hint: null,
        },
        "auth-token": {
            title: "Edit backend auth token",
            label: "Bearer token",
            placeholder: "eyJhbGciOiJIUzI1NiIs...",
            type: "password",
            hint: "Stored only in your browser and sent as Authorization: Bearer <token>.",
        },
    } as const;

    if (!field) return null;
    const c = config[field];

    return (
        <Dialog open={!!field} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{c.title}</DialogTitle>
                    {c.hint && <DialogDescription>{c.hint}</DialogDescription>}
                </DialogHeader>
                <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">{c.label}</label>
                        <Input
                            type={c.type}
                            placeholder={c.placeholder}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── NavUser ───────────────────────────────────────────────────────────────────

export function NavUser() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { open, isMobile } = useSidebar();
    const isCollapsed = !open && !isMobile;
    const [rollNo, setRollNo] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [editing, setEditing] = useState<EditField>(null);

    // Read from localStorage on mount + listen for updates
    useEffect(() => {
        function sync() {
            setRollNo(localStorage.getItem("roll-no") ?? "Not set");
            setApiKey(
                localStorage.getItem("auth-token") ??
                    localStorage.getItem("gemini-key") ??
                    "",
            );
        }
        sync();
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, []);

    const maskedKey = apiKey
        ? `${apiKey.slice(0, 6)}${"•".repeat(8)}`
        : "Not set";

    const initials =
        user?.firstName?.[0] ??
        user?.emailAddresses?.[0]?.emailAddress?.[0] ??
        "U";

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${isCollapsed ? "justify-center" : ""}`}
                            >
                                <Avatar className="w-8 h-8 rounded-lg shrink-0">
                                    <AvatarImage
                                        src={user?.imageUrl}
                                        alt={user?.firstName ?? ""}
                                    />
                                    <AvatarFallback className="rounded-lg text-xs">
                                        {initials.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <>
                                        <div className="flex flex-col gap-0.5 min-w-0 text-left">
                                            <span className="truncate text-sm font-medium">
                                                {user?.firstName ??
                                                    user?.emailAddresses?.[0]
                                                        ?.emailAddress ??
                                                    "User"}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground font-mono">
                                                {rollNo}
                                            </span>
                                        </div>
                                        <ChevronUp className="ml-auto w-4 h-4 shrink-0" />
                                    </>
                                )}
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            side="top"
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                            align="start"
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5">
                                    <Avatar className="w-8 h-8 rounded-lg">
                                        <AvatarImage src={user?.imageUrl} />
                                        <AvatarFallback className="rounded-lg text-xs">
                                            {initials.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="truncate text-sm font-medium">
                                            {user?.firstName ?? "User"}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {
                                                user?.emailAddresses?.[0]
                                                    ?.emailAddress
                                            }
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            {/* Roll number */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                                    Roll number
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    className="font-mono text-sm justify-between"
                                    onClick={() => setEditing("roll-no")}
                                >
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-muted-foreground" />
                                        {rollNo}
                                    </div>
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            {/* API key */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                                    Backend auth token
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    className="font-mono text-sm justify-between"
                                    onClick={() => setEditing("auth-token")}
                                >
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-muted-foreground" />
                                        {maskedKey}
                                    </div>
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-xs text-muted-foreground"
                                    onClick={() => {
                                        /* open help modal */
                                    }}
                                >
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    How to get a token
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <a href="/account-setting">
                                    <UserCircle2 className="w-4 h-4 mr-2" />
                                    Account settings
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                    signOut({ redirectUrl: "/sign-in" })
                                }
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            {/* Edit modals */}
            <EditModal field={editing} onClose={() => setEditing(null)} />
        </>
    );
}
