"use client";

import { useEffect, useMemo, useState } from "react";
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
    code: string;
    name: string;
    type: string;
    internal: string;
    external: string;
    backPaper?: string;
    grade?: string;
    semester?: string;
};

type CarryOver = {
    sem?: string;
    cop?: string;
    name?: string;
};

type SemesterResult = {
    semester: string;
    evenOdd?: string;
    totalMarksObtained?: number;
    resultStatus?: string;
    SGPA?: number;
    dateOfDeclaration?: string;
    subjects: Subject[];
    CarryOvers: CarryOver[];
};

type StudentResult = {
    id?: string;
    rollNo: string;
    fullName: string;
    fatherName?: string;
    course: string;
    branch: string;
    instituteName?: string;
    blocked?: boolean;
    year: number;
    cgpa: string;
    divison?: string;
    division?: string;
    totalMarksObtained: number;
    latestResultStatus?: string;
    latestCOP?: string;
    semester?: string;
    evenOdd?: string;
    resultStatus?: string;
    SGPA: Record<string, number>;
    CarryOvers: CarryOver[];
    Subjects: Subject[];
    semesters: SemesterResult[];
};

type YearFilter = "all" | "1" | "2" | "3" | "4" | "2024";

const ROW_HEIGHT = 54;
const ROWS_PER_PAGE = 5;
const STUDENT_CACHE_LS_KEY = "dashboard-student-cache-v1";
const STUDENT_RESULT_LS_PREFIX = "dashboard-student-result-v1:";

function readLocalStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeLocalStorage<T>(key: string, value: T) {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage write failures (quota/private mode).
    }
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchCache(): Promise<CacheStudent[]> {
    const res = await fetch("https://h.devxoshakya.xyz/api/result/cache");
    if (!res.ok) throw new Error("Failed to load student cache");
    const json = await res.json();
    return json.data ?? [];
}

function normalizeSubject(subject: unknown): Subject | null {
    if (!subject || typeof subject !== "object") return null;

    const raw = subject as Record<string, unknown>;
    const code = String(raw.code ?? "").trim();
    const name = String(raw.name ?? raw.subject ?? "").trim();

    if (!code && !name) return null;

    return {
        code,
        name,
        type: String(raw.type ?? "").trim(),
        internal: String(raw.internal ?? "").trim(),
        external: String(raw.external ?? "").trim(),
        backPaper: raw.backPaper != null ? String(raw.backPaper).trim() : undefined,
        grade: raw.grade != null ? String(raw.grade).trim() : undefined,
        semester: raw.semester != null ? String(raw.semester).trim() : undefined,
    };
}

function normalizeSubjects(subjects: unknown, semester?: string): Subject[] {
    if (!Array.isArray(subjects)) return [];

    return subjects
        .map(normalizeSubject)
        .filter((subject): subject is Subject => subject !== null)
        .map((subject) => ({
            ...subject,
            semester: subject.semester ?? semester,
        }));
}

function normalizeCarryOvers(value: unknown): CarryOver[] {
    if (!Array.isArray(value)) return [];

    const carryOvers: CarryOver[] = [];

    value.forEach((entry) => {
        if (typeof entry === "string") {
            const cop = entry.trim();
            if (cop) carryOvers.push({ cop });
            return;
        }

        if (Array.isArray(entry)) {
            entry.forEach((item) => {
                if (typeof item !== "string") return;
                const cop = item.trim();
                if (cop) carryOvers.push({ cop });
            });
            return;
        }

        if (entry && typeof entry === "object") {
            const raw = entry as Record<string, unknown>;
            const sem = raw.sem != null ? String(raw.sem).trim() : "";
            const cop = raw.cop != null ? String(raw.cop).trim() : "";
            const name = raw.name != null ? String(raw.name).trim() : "";

            if (sem || cop || name) {
                carryOvers.push({
                    sem: sem || undefined,
                    cop: cop || undefined,
                    name: name || undefined,
                });
            }
        }
    });

    return carryOvers;
}

function normalizeSemesterResult(value: unknown): SemesterResult | null {
    if (!value || typeof value !== "object") return null;

    const raw = value as Record<string, unknown>;
    const semester = String(raw.semester ?? raw.sem ?? "").trim();

    if (!semester) return null;

    return {
        semester,
        evenOdd: raw.evenOdd != null ? String(raw.evenOdd).trim() : undefined,
        totalMarksObtained:
            raw.totalMarksObtained != null
                ? Number(raw.totalMarksObtained)
                : undefined,
        resultStatus:
            raw.resultStatus != null ? String(raw.resultStatus).trim() : undefined,
        SGPA: raw.SGPA != null ? Number(raw.SGPA) : undefined,
        dateOfDeclaration:
            raw.dateOfDeclaration != null
                ? String(raw.dateOfDeclaration).trim()
                : undefined,
        subjects: normalizeSubjects(raw.subjects ?? raw.Subjects, semester),
        CarryOvers: normalizeCarryOvers(raw.CarryOvers),
    };
}

function normalizeSgpaRecord(semesters: SemesterResult[], rawSgpa: unknown) {
    if (rawSgpa && typeof rawSgpa === "object" && !Array.isArray(rawSgpa)) {
        return Object.fromEntries(
            Object.entries(rawSgpa)
                .map(([key, value]) => [key, Number(value)] as const)
                .filter(([, value]) => Number.isFinite(value) && value > 0),
        ) as Record<string, number>;
    }

    return Object.fromEntries(
        semesters
            .map((semester) => [
                `sem${semester.semester}`,
                Number(semester.SGPA ?? 0),
            ] as const)
            .filter(([, value]) => Number.isFinite(value) && value > 0),
    ) as Record<string, number>;
}

async function fetchStudentResult(rollNo: string): Promise<StudentResult> {
    const res = await fetch(
        `https://h.devxoshakya.xyz/api/result/by-rollno?rollNo=${rollNo}`,
    );
    if (!res.ok) throw new Error("Failed to load result");
    const json = await res.json();

    const envelope = Array.isArray(json) ? json[0] : json;
    const raw = envelope?.data ?? envelope;

    const semesters = Array.isArray(raw?.semesters)
        ? (raw.semesters as unknown[])
              .map((semester: unknown) => normalizeSemesterResult(semester))
              .filter((semester): semester is SemesterResult => semester !== null)
        : [];
    const latestSemester = semesters.at(-1);
    const latestSubjects = normalizeSubjects(
        raw?.subjects ?? raw?.Subjects ?? latestSemester?.subjects,
        raw?.semester != null ? String(raw.semester) : latestSemester?.semester,
    );
    const carryOvers = normalizeCarryOvers(
        raw?.CarryOvers ?? latestSemester?.CarryOvers,
    );
    const sgpaRecord = normalizeSgpaRecord(semesters, raw?.SGPA);

    return {
        id: raw?.id,
        rollNo: String(raw?.rollNo ?? rollNo),
        fullName: raw?.fullName ?? "Unknown",
        fatherName: raw?.fatherName,
        course: raw?.course ?? "",
        branch: raw?.branch ?? "",
        instituteName: raw?.instituteName,
        blocked: Boolean(raw?.blocked ?? false),
        year: Number(raw?.year ?? 0),
        cgpa: String(raw?.cgpa ?? "0"),
        divison: raw?.divison,
        division: raw?.division,
        totalMarksObtained: Number(raw?.totalMarksObtained ?? 0),
        latestResultStatus: raw?.latestResultStatus,
        latestCOP: raw?.latestCOP,
        semester:
            raw?.semester != null
                ? String(raw.semester)
                : latestSemester?.semester,
        evenOdd: raw?.evenOdd ?? latestSemester?.evenOdd,
        resultStatus: raw?.resultStatus ?? latestSemester?.resultStatus,
        SGPA: sgpaRecord,
        CarryOvers: carryOvers,
        Subjects: latestSubjects,
        semesters,
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

function extractCarryOverCodes(carryOvers: CarryOver[]): string[] {
    return Array.from(
        new Set(
            carryOvers
                .flatMap((carryOver) => {
                    if (carryOver.cop) {
                        return carryOver.cop
                            .replace(/^COP\s*:\s*/i, "")
                            .split(",")
                            .map((code) => code.trim().toUpperCase());
                    }

                    if (carryOver.name) {
                        return carryOver.name
                            .split(",")
                            .map((code) => code.trim().toUpperCase());
                    }

                    return [];
                })
                .filter(Boolean),
        ),
    );
}

function getSemesterNumber(semester: string) {
    const parsed = Number.parseInt(semester, 10);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function getSemesterLabel(semester: string) {
    return `Sem ${semester}`;
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
    const cachedResult = useMemo(
        () =>
            rollNo
                ? readLocalStorage<StudentResult | null>(
                      `${STUDENT_RESULT_LS_PREFIX}${rollNo}`,
                      null,
                  )
                : null,
        [rollNo],
    );

    const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["student-result", rollNo],
        queryFn: async () => {
            const result = await fetchStudentResult(rollNo!);
            writeLocalStorage(`${STUDENT_RESULT_LS_PREFIX}${rollNo}`, result);
            return result;
        },
        enabled: !!rollNo && open,
        staleTime: 1000 * 60 * 10, // 10 min
        initialData: cachedResult ?? undefined,
        refetchOnMount: true,
    });

    const availableSemesters = useMemo(
        () =>
            [...(data?.semesters ?? [])].sort(
                (a, b) =>
                    getSemesterNumber(a.semester) - getSemesterNumber(b.semester),
            ),
        [data?.semesters],
    );

    useEffect(() => {
        if (!availableSemesters.length) {
            setSelectedSemester(null);
            return;
        }

        setSelectedSemester((current) => {
            if (
                current &&
                availableSemesters.some((entry) => entry.semester === current)
            ) {
                return current;
            }

            return availableSemesters.at(-1)?.semester ?? availableSemesters[0].semester;
        });
    }, [availableSemesters, rollNo]);

    const selectedSemesterEntries = useMemo(() => {
        if (!availableSemesters.length) return [];

        const selected = availableSemesters.find(
            (semester) => semester.semester === selectedSemester,
        );

        return selected ? [selected] : [availableSemesters.at(-1)!];
    }, [availableSemesters, selectedSemester]);

    const sgpaEntries = useMemo(
        () =>
            availableSemesters
                .map((semester) => [semester.semester, Number(semester.SGPA ?? 0)] as const)
                .filter(([, value]) => value > 0),
        [availableSemesters],
    );

    const latestSgpa = sgpaEntries.length > 0 ? sgpaEntries.at(-1) : null;
    const carryOverCodes = useMemo(
        () => extractCarryOverCodes(data?.CarryOvers ?? []),
        [data?.CarryOvers],
    );
    const status = data
        ? getResultStatusBadge(
              carryOverCodes.length === 0
                  ? "PASS"
                  : carryOverCodes.length <= 3
                    ? "PCP"
                    : "FAIL",
          )
        : null;
    const subjectsToDisplay = useMemo(() => {
        if (!data) return [];

        if (selectedSemesterEntries.length > 0) {
            return selectedSemesterEntries.flatMap((semester) =>
                semester.subjects.map((subject) => ({
                    ...subject,
                    semester: semester.semester,
                })),
            );
        }

        return data.Subjects;
    }, [data, selectedSemesterEntries]);
    const selectedSemesterLabel =
        selectedSemester ? getSemesterLabel(selectedSemester) : "Select semester";

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
                        <div className="flex flex-col gap-3 rounded-lg border p-3 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-medium whitespace-nowrap">
                                    Result status
                                </p>
                                {status && (
                                    <Badge
                                        variant="outline"
                                        className={`gap-1.5 ${status.className}`}
                                    >
                                        <status.icon className="w-3.5 h-3.5" />
                                        {status.label}
                                    </Badge>
                                )}
                                <p className="hidden sm:block text-xs text-muted-foreground truncate">
                                    {data.resultStatus ?? data.latestResultStatus ?? "Result summary"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 min-w-0 sm:justify-end">
                                <p className="text-sm font-medium whitespace-nowrap">Semester</p>
                                <Select
                                    value={selectedSemester ?? undefined}
                                    onValueChange={(value) => setSelectedSemester(value)}
                                >
                                    <SelectTrigger className="h-8 w-40 sm:w-44">
                                        <SelectValue placeholder={selectedSemesterLabel} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSemesters.map((semester) => (
                                            <SelectItem
                                                key={semester.semester}
                                                value={semester.semester}
                                            >
                                                {getSemesterLabel(semester.semester)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">{data.year}</p>
                                <p className="text-xs text-muted-foreground">
                                    Year
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">
                                    {latestSgpa ? latestSgpa[1].toFixed(2) : "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {latestSgpa
                                        ? `Semester ${latestSgpa[0].replace("sem", "Sem ")}`
                                        : "Semester"}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">
                                    {selectedSemesterEntries.at(-1)?.totalMarksObtained ?? data.totalMarksObtained}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total marks
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-lg font-bold">
                                    {carryOverCodes.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Carry overs
                                </p>
                            </div>
                        </div>

                        {sgpaEntries.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                    SGPA progression
                                </p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {sgpaEntries.map(([sem, val]) => (
                                        <div
                                            key={sem}
                                            className={`rounded-md px-2.5 py-2 text-center ${getSgpaTextClass(val)}`}
                                        >
                                            <p className="text-sm font-semibold">
                                                {val.toFixed(2)}
                                            </p>
                                            <p className="text-[10px] capitalize opacity-90">
                                                Semester {sem.toUpperCase()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                        {subjectsToDisplay.map((s, index) => {
                                            const code = s.code.toUpperCase();
                                            const hasCop =
                                                carryOverCodes.includes(code);

                                            return (
                                                <TableRow
                                                    key={`${s.semester ?? "latest"}-${s.code}-${index}`}
                                                    className={
                                                        hasCop
                                                            ? "bg-red-500/10 hover:bg-red-500/15"
                                                            : ""
                                                    }
                                                >
                                                    <TableCell className="max-w-70 truncate font-medium">
                                                        {s.name}
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

                        <div>
                            <p className="text-sm font-medium mb-1">Backlogs</p>
                            {data.CarryOvers.length > 0 ? (
                                <div className="space-y-2">
                                    {data.CarryOvers.map((co, index) => (
                                        <div
                                            key={`${co.sem ?? "semester"}-${co.cop ?? co.name ?? index}`}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {co.name ?? co.cop ?? "-"}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="shrink-0 font-normal text-red-400">
                                                {co.cop ?? "Code N/A"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No backlogs found
                                </p>
                            )}
                            {data.latestCOP && (
                                <p className="text-xs text-muted-foreground my-2">
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

    const cachedStudents = useMemo(
        () => readLocalStorage<CacheStudent[]>(STUDENT_CACHE_LS_KEY, []),
        [],
    );

    const { data: students = [], isLoading } = useQuery({
        queryKey: ["student-cache"],
        queryFn: async () => {
            const fresh = await fetchCache();
            writeLocalStorage(STUDENT_CACHE_LS_KEY, fresh);
            return fresh;
        },
        staleTime: 1000 * 60 * 60, // 1 hour — this data rarely changes
        gcTime: 1000 * 60 * 120,
        initialData: cachedStudents.length > 0 ? cachedStudents : undefined,
        refetchOnMount: true,
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
