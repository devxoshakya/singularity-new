"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import AvatarHairpin from "@/components/ui/AvatarPin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LocalStorageService } from "@/lib/local-storage-service";

type OrgInfo = {
    id: string;
    name: string;
    plan: string;
    role: "ADMIN" | "MEMBER";
    rollNo?: string | null;
};

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

function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function AccountSettingPage() {
    const { user } = useUser();
    const router = useRouter();
    const [org, setOrg] = useState<OrgInfo | null>(null);
    const [loadingOrg, setLoadingOrg] = useState(true);
    const [rollNo, setRollNo] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [errors, setErrors] = useState<{ rollNo?: string; apiKey?: string }>({});
    const [saving, setSaving] = useState(false);
    const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        // Fallback for API key; rollNo is fetched from org API
        setApiKey(LocalStorageService.getApiKey());
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadOrg() {
            setLoadingOrg(true);
            try {
                const res = await fetch("/api/orgs/me");
                if (!res.ok) {
                    if (!cancelled) setOrg(null);
                    return;
                }

                const data = (await res.json()) as OrgInfo;
                if (!cancelled) {
                    setOrg(data);
                    if (data.rollNo) {
                        setRollNo(data.rollNo);
                        LocalStorageService.setRollNo(data.rollNo);
                    } else {
                        setRollNo(LocalStorageService.getRollNo());
                    }
                }
            } catch {
                if (!cancelled) setOrg(null);
            } finally {
                if (!cancelled) setLoadingOrg(false);
            }
        }

        void loadOrg();
        return () => {
            cancelled = true;
        };
    }, []);

    const rawName =
        user?.fullName?.trim() ||
        user?.firstName?.trim() ||
        user?.username?.trim() ||
        "User";
    const name = toTitleCase(rawName);

    const email = user?.emailAddresses?.[0]?.emailAddress || "Not available";
    const role = org?.role || "MEMBER";

    const maskedApiKey = useMemo(() => {
        if (!apiKey) return "Not set";
        if (apiKey.length <= 8) return `${apiKey.slice(0, 2)}••••`;
        return `${apiKey.slice(0, 6)}••••••••`;
    }, [apiKey]);

    function validateAll() {
        const nextErrors: { rollNo?: string; apiKey?: string } = {};

        const rollParsed = rollNoSchema.safeParse(rollNo.trim());
        if (!rollParsed.success) {
            nextErrors.rollNo = rollParsed.error.issues[0]?.message;
        }

        const keyParsed = geminiApiKeySchema.safeParse(apiKey.trim());
        if (!keyParsed.success) {
            nextErrors.apiKey = keyParsed.error.issues[0]?.message;
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function saveEditableFields() {
        if (!validateAll()) return;

        setSaving(true);
        try {
            // rollNo is no longer editable, only save API key
            LocalStorageService.setApiKey(apiKey.trim());
            window.dispatchEvent(new Event("storage"));
            toast.success("Account preferences updated.");
        } finally {
            setSaving(false);
        }
    }

    async function leaveOrg() {
        setLeaving(true);
        try {
            const res = await fetch("/api/orgs/leave", {
                method: "POST",
            });

            const data = (await res.json().catch(() => ({}))) as {
                error?: string;
            };

            if (!res.ok) {
                toast.error(data.error || "Failed to leave organisation.");
                return;
            }

            toast.success("You left the organisation.");
            setConfirmLeaveOpen(false);
            router.push("/onboarding");
            router.refresh();
        } catch {
            toast.error("Something went wrong while leaving organisation.");
        } finally {
            setLeaving(false);
        }
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
                <section className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
                        <p className="text-lg text-muted-foreground sm:text-2xl">
                            {role === "ADMIN" ? "Organization Admin" : "Member"}
                        </p>
                    </div>

                    <div className="flex justify-start md:justify-end">
                        <AvatarHairpin />
                    </div>
                </section>

                <Card className="border-0 bg-transparent py-0 shadow-none">
                    <CardContent className="space-y-6 px-0">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Full name</p>
                                <Input value={name} readOnly />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Role</p>
                                <div className="flex h-10 items-center rounded-md border px-3">
                                    <Badge variant="secondary" className="uppercase">
                                        {role}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <p className="text-sm font-medium">Email</p>
                                <Input value={email} readOnly />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Organisation</p>
                                <Input
                                    value={
                                        loadingOrg
                                            ? "Loading..."
                                            : (org?.name ?? "Not in an organisation")
                                    }
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Plan</p>
                                <Input
                                    value={
                                        loadingOrg ? "Loading..." : (org?.plan ?? "N/A")
                                    }
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <div>
                                <p className="text-sm font-medium">Roll number</p>
                                <p className="text-xs text-muted-foreground">
                                    This value is sent as `x-roll-no` for chat requests.
                                </p>
                            </div>
                            <Input
                                value={rollNo}
                                readOnly
                                disabled
                                placeholder={ROLL_NO_PLACEHOLDER}
                                className="bg-muted text-muted-foreground"
                            />
                            {errors.rollNo ? (
                                <p className="text-xs text-destructive">{errors.rollNo}</p>
                            ) : null}
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <div>
                                <p className="text-sm font-medium">Backend API key</p>
                                <p className="text-xs text-muted-foreground">
                                    Stored in local browser storage and used as `x-api-key`.
                                </p>
                            </div>
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    if (errors.apiKey) {
                                        setErrors((prev) => ({ ...prev, apiKey: undefined }));
                                    }
                                }}
                                placeholder="AIza..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Current: {maskedApiKey}
                            </p>
                            {errors.apiKey ? (
                                <p className="text-xs text-destructive">{errors.apiKey}</p>
                            ) : null}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 px-0 sm:flex-row sm:justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => setConfirmLeaveOpen(true)}
                            disabled={!org || leaving}
                            className="w-full sm:w-auto"
                        >
                            Leave organisation
                        </Button>

                        <Button onClick={saveEditableFields} disabled={saving} className="w-full sm:w-auto">
                            {saving ? "Saving..." : "Save changes"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave organisation?</DialogTitle>
                        <DialogDescription>
                            You will lose access to this organisation's chat and data until you join again.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmLeaveOpen(false)}
                            disabled={leaving}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={leaveOrg} disabled={leaving}>
                            {leaving ? "Leaving..." : "Leave organisation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
