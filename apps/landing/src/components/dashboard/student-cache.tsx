"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Search,
    GraduationCap,
    ChevronRight,
    TrendingUp,
    CircleCheck,
    AlertTriangle,
    CircleX,
} from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type CacheStudent = {
    id: string;
    fullName: string;
    rollNo: string;
    branch: string;
    year: number;
};

type Subject = {
    subject: string;
    code: string;
    type: string;
    internal: string;
    external: string;
};

type StudentResult = {
    rollNo: string;
    fullName: string;
    course: string;
    branch: string;
    year: number;
    cgpa: string;
    SGPA: Record<string, number>;
    CarryOvers: Array<{ session?: string; sem?: string; cop?: string }>;
    backlogSubjects: string[];
    backlogCount: number;
    computedStatus: "PASS" | "PCP" | "FAIL";
    latestResultStatus?: string;
    latestCOP?: string;
    division?: string;
    totalMarksObtained: number;
    Subjects: Subject[];
};

type YearFilter = "all" | "1" | "2" | "3" | "4" | "2024";

const ROW_HEIGHT = 54;
const ROWS_PER_PAGE = 5;

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchCache(): Promise<CacheStudent[]> {
    const res = await fetch("https://h.devshakya.xyz/api/result/cache");
    if (!res.ok) throw new Error("Failed to load student cache");
    const json = await res.json();
    return json.data ?? [];
}

async function fetchStudentResult(rollNo: string): Promise<StudentResult> {
    const res = await fetch(
        `https://h.devshakya.xyz/api/result/by-rollno?rollNo=${rollNo}`,
    );
    if (!res.ok) throw new Error("Failed to load result");
    const json = await res.json();

    const envelope = Array.isArray(json) ? json[0] : json;
    const raw = envelope?.data ?? envelope;

    const carryOvers = Array.isArray(raw?.CarryOvers) ? raw.CarryOvers : [];
    const backlogSubjects = Array.from(
        new Set(
            carryOvers
                .flatMap((entry: any) => {
                    if (Array.isArray(entry)) {
                        return entry;
                    }
                    if (typeof entry?.cop === "string") {
                        return entry.cop
                            .replace(/^COP\s*:\s*/i, "")
                            .split(",")
                            .map((s: string) => s.trim());
                    }
                    return [];
                })
                .map((s: string) => s.trim())
                .filter(
                    (s: string) =>
                        !!s &&
                        s.toLowerCase() !== "no backlogs" &&
                        s.toLowerCase() !== "none",
                ),
        ),
    );

    const backlogCount = backlogSubjects.length;
    const computedStatus =
        backlogCount === 0 ? "PASS" : backlogCount <= 3 ? "PCP" : "FAIL";

    return {
        rollNo: raw?.rollNo ?? rollNo,
        fullName: raw?.fullName ?? "Unknown",
        course: raw?.course ?? "",
        branch: raw?.branch ?? "",
        year: Number(raw?.year ?? 0),
        cgpa: String(raw?.cgpa ?? "0"),
        SGPA: raw?.SGPA ?? {},
        CarryOvers: carryOvers,
        backlogSubjects,
        backlogCount,
        computedStatus,
        latestResultStatus: raw?.latestResultStatus,
        latestCOP: raw?.latestCOP,
        division: raw?.divison ?? raw?.division,
        totalMarksObtained: Number(raw?.totalMarksObtained ?? 0),
        Subjects: Array.isArray(raw?.Subjects) ? raw.Subjects : [],
    };
}

function getBatchFromRollNo(rollNo: string): number | null {
    const yy = Number.parseInt(rollNo.slice(0, 2), 10);
    if (Number.isNaN(yy)) return null;
    return 2000 + yy;
}

function getResultStatusBadge(status: "PASS" | "PCP" | "FAIL") {
    if (status === "PASS") {
        return {
            label: "PASS",
            icon: CircleCheck,
            className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
        };
    }
    if (status === "PCP") {
        return {
            label: "PCP",
            icon: AlertTriangle,
            className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        };
    }
    return {
        label: "FAIL",
        icon: CircleX,
        className: "bg-red-500/10 text-red-700 border-red-500/20",
    };
}

function getSgpaTextClass(value: number) {
    if (value >= 8) return "bg-emerald-500/15 text-emerald-300";
    if (value >= 7) return "bg-lime-500/15 text-lime-300";
    if (value >= 6) return "bg-amber-500/15 text-amber-300";
    if (value >= 5) return "bg-orange-500/15 text-orange-300";
    return "bg-red-500/15 text-red-300";
}

function extractCopCodes(copText?: string): string[] {
    if (!copText) return [];
    return copText
        .replace(/^COP\s*:\s*/i, "")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
}

// ── Student result sheet ──────────────────────────────────────────────────────

function StudentSheet({
    rollNo,
    open,
    onClose,
}: {
    rollNo: string | null;
    open: boolean;
    onClose: () => void;
}) {
    const { data, isLoading } = useQuery({
        queryKey: ["student-result", rollNo],
        queryFn: () => fetchStudentResult(rollNo!),
        enabled: !!rollNo && open,
        staleTime: 1000 * 60 * 10, // 10 min
    });

    const sgpaEntries = data
        ? Object.entries(data.SGPA).filter(([, v]) => v > 0)
        : [];
    const latestSgpa =
        sgpaEntries.length > 0 ? sgpaEntries[sgpaEntries.length - 1] : null;
    const status = data ? getResultStatusBadge(data.computedStatus) : null;
    const latestCopCodes = useMemo(
        () => new Set(extractCopCodes(data?.latestCOP)),
        [data?.latestCOP],
    );
    const backlogCodeSet = useMemo(
        () =>
            new Set(
                (data?.backlogSubjects ?? []).map((code) =>
                    String(code).trim().toUpperCase(),
                ),
            ),
        [data?.backlogSubjects],
    );

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto no-scrollbar px-4 sm:px-6">
                <SheetHeader className="pb-4">
                    <SheetTitle>
                        {isLoading ? (
                            <Skeleton className="h-5 w-40" />
                        ) : (
                            data?.fullName
                        )}
                    </SheetTitle>
                    <SheetDescription>
                        {isLoading ? (
                            <Skeleton className="h-4 w-56 mt-1" />
                        ) : (
                            `${data?.course} · ${data?.branch}`
                        )}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {status && (
                            <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30">
                                <div>
                                    <p className="text-sm font-medium">
                                        Result status
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Rule: PASS = 0 carry over, PCP = up to 3, FAIL = above 3
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`gap-1.5 ${status.className}`}
                                >
                                    <status.icon className="w-3.5 h-3.5" />
                                    {status.label}
                                </Badge>
                            </div>
                        )}

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">{data.year}</p>
                                <p className="text-xs text-muted-foreground">
                                    Year
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">
                                    {latestSgpa
                                        ? latestSgpa[1].toFixed(2)
                                        : "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {latestSgpa
                                        ? `SGPA ${latestSgpa[0].replace("sem", "Sem ")}`
                                        : "SGPA"}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">
                                    {data.totalMarksObtained}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total marks
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">
                                    {data.backlogCount}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Carry overs
                                </p>
                            </div>
                        </div>

                        {/* SGPA trend */}
                        {sgpaEntries.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                    SGPA progression
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {sgpaEntries.map(([sem, val]) => (
                                        <div
                                            key={sem}
                                            className={`rounded-md px-2.5 py-1.5 text-center min-w-13 ${getSgpaTextClass(val)}`}
                                        >
                                            <p className="text-sm font-semibold">
                                                {val.toFixed(2)}
                                            </p>
                                            <p className="text-[10px] capitalize opacity-90">
                                                {sem.replace("sem", "Sem ")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subjects */}
                        <div>
                            <p className="text-sm font-medium mb-2">Subjects</p>
                            <div className="max-h-95 overflow-auto no-scrollbar rounded-lg border">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">
                                                Internal
                                            </TableHead>
                                            <TableHead className="text-right">
                                                External
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.Subjects.map((s, index) => {
                                            const code = s.code.toUpperCase();
                                            const hasCop =
                                                latestCopCodes.has(code) ||
                                                backlogCodeSet.has(code);

                                            return (
                                            <TableRow
                                                key={`${s.code}-${index}`}
                                                className={
                                                    hasCop
                                                        ? "bg-red-500/10 hover:bg-red-500/15"
                                                        : ""
                                                }
                                            >
                                                <TableCell className="max-w-70 truncate font-medium">
                                                    {s.subject}
                                                </TableCell>
                                                <TableCell
                                                    className={
                                                        hasCop
                                                            ? "text-red-400 font-semibold"
                                                            : ""
                                                    }
                                                >
                                                    {s.code}
                                                </TableCell>
                                                <TableCell>{s.type}</TableCell>
                                                <TableCell className="text-right">
                                                    {s.internal || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {s.external || "-"}
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Carry overs */}
                        <div>
                            <p className="text-sm font-medium mb-1">Backlogs</p>
                            {data.CarryOvers.length > 0 ? (
                                <div className="space-y-2">
                                    {data.CarryOvers.map((co, index) => (
                                        <div
                                            key={`${co.session ?? "session"}-${index}`}
                                            className="rounded-lg border p-3"
                                        >
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                                                {co.session && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="font-normal"
                                                    >
                                                        {co.session}
                                                    </Badge>
                                                )}
                                                {co.sem && (
                                                    <span>
                                                        Semester: {co.sem}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm">
                                                {co.cop ?? "-"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No backlogs found
                                </p>
                            )}
                            {data.latestCOP && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Latest COP: {data.latestCOP}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Could not load result.
                    </p>
                )}
            </SheetContent>
        </Sheet>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StudentCache() {
    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState<YearFilter>("2");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<string | null>(null);

    const { data: students = [], isLoading } = useQuery({
        queryKey: ["student-cache"],
        queryFn: fetchCache,
        staleTime: 1000 * 60 * 60, // 1 hour — this data rarely changes
        gcTime: 1000 * 60 * 120,
    });

    const filtered = useMemo(() => {
        if (!search) return students;
        const q = search.toLowerCase();
        return students.filter(
            (s) =>
                s.fullName.toLowerCase().includes(q) ||
                s.rollNo.includes(q) ||
                s.branch.toLowerCase().includes(q),
        );
    }, [students, search]);

    const yearFiltered = useMemo(() => {
        if (yearFilter === "all") return filtered;
        if (yearFilter === "2024") {
            return filtered.filter((s) => getBatchFromRollNo(s.rollNo) === 2024);
        }
        const year = Number.parseInt(yearFilter, 10);
        return filtered.filter((s) => s.year === year);
    }, [filtered, yearFilter]);

    const totalPages = Math.max(1, Math.ceil(yearFiltered.length / ROWS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = useMemo(() => {
        const from = (currentPage - 1) * ROWS_PER_PAGE;
        return yearFiltered.slice(from, from + ROWS_PER_PAGE);
    }, [yearFiltered, currentPage]);

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

    return (
        <>
            <Card className="h-full w-full flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        Student results cache
                        {!isLoading && (
                            <Badge
                                variant="secondary"
                                className="text-xs ml-auto font-normal"
                            >
                                {students.length} students
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Cached results from the university portal
                    </CardDescription>
                    <div className="mt-1 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, roll no, branch..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>

                        <Select
                            value={yearFilter}
                            onValueChange={(v) => {
                                setYearFilter(v as YearFilter);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-36.25 text-xs">
                                <SelectValue placeholder="Filter year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                <SelectItem value="1">Year 1</SelectItem>
                                <SelectItem value="2">Year 2</SelectItem>
                                <SelectItem value="3">Year 3</SelectItem>
                                <SelectItem value="4">Year 4</SelectItem>
                                <SelectItem value="2024">2024 batch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1 min-h-0">
                    <div className="flex h-full min-h-107.5 flex-col gap-3">
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-12 w-full rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : yearFiltered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No students found
                            </p>
                        ) : (
                            <>
                                <div className="max-h-95 overflow-auto no-scrollbar rounded-lg border w-full">
                                    <Table className="min-w-160">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Roll No</TableHead>
                                                <TableHead>Branch</TableHead>
                                                <TableHead>Year</TableHead>
                                                <TableHead className="w-12.5" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pageRows.map((s) => (
                                                <TableRow
                                                    key={s.id}
                                                    className="cursor-pointer"
                                                    style={{ height: `${ROW_HEIGHT}px` }}
                                                    onClick={() => setSelected(s.rollNo)}
                                                >
                                                    <TableCell className="font-medium truncate max-w-0">
                                                        {s.fullName}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {s.rollNo}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground truncate max-w-0">
                                                        {s.branch}
                                                    </TableCell>
                                                    <TableCell>{s.year}</TableCell>
                                                    <TableCell>
                                                        <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground/50" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
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
                                                <div
                                                    key={`student-page-${p}`}
                                                    className="contents"
                                                >
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
                    </div>
                </CardContent>
            </Card>

            <StudentSheet
                rollNo={selected}
                open={!!selected}
                onClose={() => setSelected(null)}
            />
        </>
    );
}
