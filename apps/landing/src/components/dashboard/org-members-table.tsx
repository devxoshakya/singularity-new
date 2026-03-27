"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue
} from "@/components/ui/select";
import { Search, Trash2, Users, AlertTriangle } from "lucide-react";
// Helper to extract unique years from members (ignore missing year)
function getUniqueYears(members: Member[]): string[] {
    const years = new Set<string>();
    for (const m of members) {
        if (m.year !== null && m.year !== undefined) {
            const y = String(m.year).trim();
            if (y) years.add(y);
        }
    }
    return Array.from(years).sort();
}
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PendingRequests } from "./pending-requests";

type Member = {
    id: string;
    userId: string;
    role: "ADMIN" | "MEMBER";
    status: "ACTIVE" | "PENDING" | "REJECTED";
    requestedAt: string | Date;
    acceptedAt: string | Date | null;
    user: { id: string; email: string };
};

interface Props {
    orgId: string;
    initialActive: Member[];
    initialPending: Member[];
    onAction: () => void;
}

const ROW_HEIGHT = 48;
const ROWS_PER_PAGE = 12;

async function fetchActiveMembers(orgId: string): Promise<Member[]> {
    const res = await fetch(`/api/orgs/${orgId}/members?status=ACTIVE`);
    if (!res.ok) return [];
    return res.json();
}

export function OrgMembersTable({
    orgId,
    initialActive,
    initialPending,
    onAction,
}: Props) {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [removing, setRemoving] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<string>("__all__");
    const [deplatforming, setDeplatforming] = useState(false);

    const { data: members = initialActive } = useQuery({
        queryKey: ["active-members", orgId],
        queryFn: () => fetchActiveMembers(orgId),
        initialData: initialActive,
        staleTime: 1000 * 60,
    });

    // Filter by year and search
    const filtered = useMemo(() => {
        let result = members;
        if (yearFilter !== "__all__") {
            result = result.filter((m) => m.year === yearFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter((m) => m.user.email.toLowerCase().includes(q));
        }
        return result;
    }, [members, search, yearFilter]);
    // Unique years for dropdown (ignore missing year)
    const uniqueYears = useMemo(() => getUniqueYears(members), [members]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);

    const pageRows = useMemo(() => {
        const from = (currentPage - 1) * ROWS_PER_PAGE;
        return filtered.slice(from, from + ROWS_PER_PAGE);
    }, [filtered, currentPage]);

    const removeMutation = useMutation({
        mutationFn: async (memberId: string) => {
            const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to remove member");
            return data;
        },
        onSuccess: () => {
            toast.success("Member removed");
            qc.invalidateQueries({ queryKey: ["active-members", orgId] });
            qc.invalidateQueries({ queryKey: ["org"] });
            onAction();
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
        onSettled: () => {
            setRemoving(null);
        },
    });

    function goToPage(nextPage: number) {
        const bounded = Math.max(1, Math.min(totalPages, nextPage));
        setPage(bounded);
    }

    const pageButtons = useMemo(() => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = new Set<number>([1, totalPages, currentPage]);
        if (currentPage > 1) pages.add(currentPage - 1);
        if (currentPage < totalPages) pages.add(currentPage + 1);
        return Array.from(pages).sort((a, b) => a - b);
    }, [currentPage, totalPages]);

    async function onRemove(memberId: string) {
        setRemoving(memberId);
        await removeMutation.mutateAsync(memberId);
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            Organisation members
                            <Badge variant="secondary" className="text-xs">
                                {members.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Active members currently in your organisation
                        </CardDescription>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                        {/* Year filter and Deplatform All */}
                                        <div className="flex gap-2 items-center">
                                            {uniqueYears.length > 0 ? (
                                                <Select value={yearFilter} onValueChange={setYearFilter}>
                                                    <SelectTrigger className="w-32 h-8">
                                                        <SelectValue placeholder="All Years" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__all__">All Years</SelectItem>
                                                        {uniqueYears.map((y) => (
                                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="w-32 h-8 flex items-center border rounded px-3 text-muted-foreground text-sm bg-muted">All Years</div>
                                            )}
                                            {yearFilter !== "__all__" && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 px-3 flex items-center gap-1"
                                                    disabled={deplatforming}
                                                    onClick={async () => {
                                                        setDeplatforming(true);
                                                        try {
                                                            const res = await fetch("/api/orguser/deplatform", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ year: yearFilter }),
                                                            });
                                                            if (!res.ok) {
                                                                const data = await res.json().catch(() => ({}));
                                                                throw new Error(data.error || "Failed to deplatform users");
                                                            }
                                                            toast.success(`All users from year ${yearFilter} have been deplatformed.`);
                                                            qc.invalidateQueries({ queryKey: ["active-members", orgId] });
                                                            setYearFilter("__all__");
                                                        } catch (err: any) {
                                                            toast.error(err.message || "Failed to deplatform users");
                                                        } finally {
                                                            setDeplatforming(false);
                                                        }
                                                    }}
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Deplatform All
                                                </Button>
                                            )}
                                        </div>
                    <div className="relative w-full sm:max-w-xl">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search member by email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>

                    <div className="w-full sm:w-60 sm:shrink-0">
                        <PendingRequests
                            orgId={orgId}
                            initialPending={initialPending}
                            onAction={onAction}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No members found
                    </p>
                ) : (
                    <>
                        <div className="max-h-100 overflow-auto no-scrollbar rounded-lg border w-full">
                            <Table className="min-w-160">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Role</TableHead>
                                        <TableHead className="text-right">Joined</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageRows.map((m) => {
                                        const joinedAt = m.acceptedAt ?? m.requestedAt;

                                        return (
                                            <TableRow key={m.id} style={{ height: `${ROW_HEIGHT}px` }}>
                                                <TableCell className="font-medium whitespace-normal break-all">
                                                    {m.user.email}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className="ml-auto w-fit">
                                                        {m.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatDistanceToNow(new Date(joinedAt), {
                                                        addSuffix: true,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                                                        disabled={removing === m.id}
                                                        onClick={() => onRemove(m.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            goToPage(currentPage - 1);
                                        }}
                                    />
                                </PaginationItem>
                                {pageButtons.map((p, idx) => {
                                    const prev = pageButtons[idx - 1];
                                    const showEllipsis = prev && p - prev > 1;
                                    return (
                                        <div key={`member-page-${p}`} className="contents">
                                            {showEllipsis && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={p === currentPage}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        goToPage(p);
                                                    }}
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </div>
                                    );
                                })}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            goToPage(currentPage + 1);
                                        }}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
