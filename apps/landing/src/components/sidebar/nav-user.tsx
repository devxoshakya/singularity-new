"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { z } from "zod";
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
import { LocalStorageService } from "@/lib/local-storage-service";

// ── Edit modal for roll no / API key ─────────────────────────────────────────

type EditField = "roll-no" | "api-key" | null;

const ROLL_NO_PLACEHOLDER = "2300680100104";

const rollNoSchema = z
    .string()
    .length(
        ROLL_NO_PLACEHOLDER.length,
        `Roll number must be exactly ${ROLL_NO_PLACEHOLDER.length} characters.`,
    );

const geminiApiKeySchema = z
    .string()
    .startsWith("AIza", "Gemini API key must start with AIza.");

function ApiKeyHelpDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>How to get a Gemini API key</DialogTitle>
                    <DialogDescription>
                        The full process is written in{" "}
                        <Link
                            href="/docs/gemini-api-key"
                            className="underline underline-offset-4"
                        >
                            documentation
                        </Link>
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-hidden rounded-md border">
                    <iframe
                        title="How to get Gemini API key from Google AI Studio"
                        src="https://www.youtube.com/embed/sLxW6oIS4cM"
                        className="h-55 w-full sm:h-90"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditModal({
    field,
    onClose,
}: {
    field: EditField;
    onClose: () => void;
}) {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!field) return;
        setError(null);

        if (field === "api-key") {
            setValue(LocalStorageService.getApiKey());
            return;
        }

        setValue(
            field === "roll-no" ? LocalStorageService.getRollNo() : "",
        );
    }, [field]);

    function handleSave() {
        if (!field) return;
        const nextValue = value.trim();

        const validation =
            field === "api-key"
                ? geminiApiKeySchema.safeParse(nextValue)
                : rollNoSchema.safeParse(nextValue);

        if (!validation.success) {
            setError(validation.error.issues[0]?.message ?? "Invalid value.");
            return;
        }

        if (field === "api-key") {
            LocalStorageService.setApiKey(nextValue);
        } else {
            LocalStorageService.setRollNo(nextValue);
        }

        onClose();
        // Force page reload so headers update on next request
        window.dispatchEvent(new Event("storage"));
    }

    const config = {
        "roll-no": {
            title: "Edit roll number",
            label: "Roll number",
            placeholder: ROLL_NO_PLACEHOLDER,
            type: "text",
            hint: null,
        },
        "api-key": {
            title: "Edit backend API key",
            label: "API key",
            placeholder: "AIza...",
            type: "password",
            hint: "Stored only in your browser and sent as x-api-key header.",
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
                            onChange={(e) => {
                                setValue(e.target.value);
                                if (error) setError(null);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
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
    const [isApiHelpOpen, setIsApiHelpOpen] = useState(false);

    // Read from localStorage on mount + listen for updates
    useEffect(() => {
        function sync() {
            setRollNo(LocalStorageService.getRollNo() || "Not set");
            setApiKey(LocalStorageService.getApiKey());

            const name =
                user?.fullName ??
                user?.firstName ??
                user?.username ??
                "";
            const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

            LocalStorageService.setUserIdentity(name, email);
        }
        sync();
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, [user]);

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
                                    Backend API key
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    className="font-mono text-sm justify-between"
                                    onClick={() => setEditing("api-key")}
                                >
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-muted-foreground" />
                                        {maskedKey}
                                    </div>
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-xs text-muted-foreground"
                                    onClick={() => setIsApiHelpOpen(true)}
                                >
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    How to get an API key
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
                                    signOut({ redirectUrl: "/login" })
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
            <ApiKeyHelpDialog
                open={isApiHelpOpen}
                onClose={() => setIsApiHelpOpen(false)}
            />
        </>
    );
}
