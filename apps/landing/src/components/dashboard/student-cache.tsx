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
import { Search, GraduationCap, ChevronRight, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    CarryOvers: string[][];
    totalMarksObtained: number;
    Subjects: Subject[];
};

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
    return json.data;
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

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
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
                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-3">
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
                                            className="rounded-md bg-muted px-2.5 py-1.5 text-center min-w-[52px]"
                                        >
                                            <p className="text-sm font-semibold">
                                                {val.toFixed(2)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground capitalize">
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
                            <div className="space-y-1.5">
                                {data.Subjects.map((s, index) => (
                                    <div
                                        key={`${s.code}-${index}`}
                                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                                    >
                                        <div className="min-w-0 mr-3">
                                            <p className="font-medium truncate">
                                                {s.subject}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.code} · {s.type}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-muted-foreground">
                                                {s.internal || "—"} +{" "}
                                                {s.external || "—"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Carry overs */}
                        <div>
                            <p className="text-sm font-medium mb-1">Backlogs</p>
                            <p className="text-sm text-muted-foreground">
                                {data.CarryOvers.flat().join(", ") || "None"}
                            </p>
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

    return (
        <>
            <Card className="h-full flex flex-col">
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
                    <div className="relative mt-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, roll no, branch..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1 min-h-0">
                    <ScrollArea className="h-[380px] pr-1">
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-12 w-full rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No students found
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {filtered.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelected(s.rollNo)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {s.fullName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.rollNo} · Year {s.year}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 ml-2 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
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
