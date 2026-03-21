"use client"

import { memo } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import { useAnimatedText } from "@/components/ui/animated-text"

const AnimatedTextComponent = ({ text, className }: { text: string, className?: string }) => {
    const animatedText = useAnimatedText(text);
    return <div className={className}>{animatedText}</div>;
};

// ── Types matching the actual API response shape ──────────────────────────────
// from: https://h.devshakya.xyz/api/result/by-rollno?rollNo=...

interface Subject {
    id:       string
    subject:  string
    code:     string
    type:     "Theory" | "Practical" | "CA"
    internal: string
    external: string
    resultId: string
}

interface ResultData {
    fullName:           string
    rollNo:             string
    enrollmentNo:       string
    course:             string
    branch:             string
    year:               number
    SGPA:               Record<string, number>
    CarryOvers:         string[][]
    cgpa:               string
    totalMarksObtained: number
    Subjects:           Subject[]
    instituteName:      string
    latestResultStatus: string
}

interface Props {
    data: ResultData
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSgpaColor(val: number): string {
    if (val >= 9)   return "text-emerald-400"
    if (val >= 7.5) return "text-blue-400"
    if (val >= 6)   return "text-amber-400"
    return "text-red-400"
}

function getSgpaBarWidth(val: number): string {
    return `${(val / 10) * 100}%`
}

function getSubjectTotal(s: Subject): number {
    const i = parseFloat(s.internal) || 0
    const e = parseFloat(s.external) || 0
    return i + e
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SgpaBar({ sem, val }: { sem: string; val: number }) {
    const label = sem.replace("sem", "Sem ")
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-[#555] w-12 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full bg-[#2a2a2a] transition-all duration-500"
                    style={{ width: getSgpaBarWidth(val) }}
                >
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: "100%",
                            background: val >= 9
                                ? "rgb(52 211 153)"   // emerald
                                : val >= 7.5
                                ? "rgb(96 165 250)"   // blue
                                : val >= 6
                                ? "rgb(251 191 36)"   // amber
                                : "rgb(248 113 113)", // red
                        }}
                    />
                </div>
            </div>
            <span className={`text-sm font-mono font-medium w-10 text-right shrink-0 ${getSgpaColor(val)}`}>
                {val.toFixed(2)}
            </span>
        </div>
    )
}

function SubjectRow({ subject, index }: { subject: Subject; index: number }) {
    const total      = getSubjectTotal(subject)
    const maxMarks   = subject.type === "Practical" ? 100 : 100
    const percentage = Math.round((total / maxMarks) * 100)

    return (
        <div className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0 gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300 truncate">{subject.subject}</p>
                <p className="text-xs text-[#555] mt-0.5">{subject.code} · {subject.type}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-mono text-gray-300">
                    {subject.internal || "—"} + {subject.external || "—"}
                </p>
                <p className="text-xs text-[#555]">{total > 0 ? `${total} total` : "—"}</p>
            </div>
        </div>
    )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export const ResultsRenderer = memo(function ResultsRenderer({ data }: Props) {
    const sgpaEntries = Object.entries(data.SGPA).filter(([, v]) => v > 0)
    const latestSgpa  = sgpaEntries.at(-1)
    const prevSgpa    = sgpaEntries.at(-2)
    const sgpaTrend   = latestSgpa && prevSgpa
        ? latestSgpa[1] - prevSgpa[1]
        : null

    const carryOvers  = data.CarryOvers.flat().filter(c => c !== "No Backlogs" && c.trim() !== "")
    const hasBacklogs = carryOvers.length > 0

    const theorySubjects    = data.Subjects.filter(s => s.type === "Theory")
    const practicalSubjects = data.Subjects.filter(s => s.type === "Practical" || s.type === "CA")

    return (
        <div className="w-full space-y-4">

            {/* Student identity */}
            <div>
                <AnimatedTextComponent
                    text={data.fullName}
                    className="text-lg font-semibold text-white"
                />
                <p className="text-sm text-[#555] mt-0.5">
                    {data.rollNo} · {data.course} · Year {data.year}
                </p>
                <p className="text-xs text-[#444] mt-0.5 truncate">{data.branch}</p>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
                {/* Latest SGPA */}
                <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3">
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">
                        Latest SGPA
                    </p>
                    <div className="flex items-end gap-1.5">
                        <span className={`text-2xl font-bold font-mono ${latestSgpa ? getSgpaColor(latestSgpa[1]) : "text-[#555]"}`}>
                            {latestSgpa ? latestSgpa[1].toFixed(2) : "—"}
                        </span>
                        {sgpaTrend !== null && (
                            <span className={`text-xs mb-1 flex items-center gap-0.5 ${sgpaTrend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {sgpaTrend >= 0
                                    ? <TrendingUp className="w-3 h-3" />
                                    : <TrendingDown className="w-3 h-3" />
                                }
                                {Math.abs(sgpaTrend).toFixed(2)}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-[#444] mt-0.5">
                        {latestSgpa?.[0].replace("sem", "Sem ")}
                    </p>
                </div>

                {/* Total marks */}
                <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3">
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">
                        Total marks
                    </p>
                    <span className="text-2xl font-bold font-mono text-white">
                        {data.totalMarksObtained}
                    </span>
                    <p className="text-[10px] text-[#444] mt-0.5">This semester</p>
                </div>

                {/* Backlogs */}
                <div className={`border rounded-xl p-3 ${hasBacklogs ? "bg-red-500/5 border-red-500/20" : "bg-[#141414] border-[#1f1f1f]"}`}>
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">
                        Backlogs
                    </p>
                    <div className="flex items-center gap-1.5">
                        {hasBacklogs
                            ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                            : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        }
                        <span className={`text-lg font-bold ${hasBacklogs ? "text-red-400" : "text-emerald-400"}`}>
                            {hasBacklogs ? carryOvers.length : "None"}
                        </span>
                    </div>
                    <p className="text-[10px] text-[#444] mt-0.5">
                        {hasBacklogs ? "Carry over" : "Clean slate"}
                    </p>
                </div>
            </div>

            {/* SGPA progression */}
            {sgpaEntries.length > 0 && (
                <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                    <p className="text-xs text-[#555] uppercase tracking-wide mb-3">SGPA progression</p>
                    <div className="space-y-2.5">
                        {sgpaEntries.map(([sem, val]) => (
                            <SgpaBar key={sem} sem={sem} val={val} />
                        ))}
                    </div>
                </div>
            )}

            {/* Backlog details */}
            {hasBacklogs && (
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                    <p className="text-xs text-red-400/70 uppercase tracking-wide mb-2">Carry-over subjects</p>
                    <div className="space-y-1">
                        {carryOvers.map((c, i) => (
                            <p key={i} className="text-sm text-red-300">{c}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Theory subjects */}
            {theorySubjects.length > 0 && (
                <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                    <p className="text-xs text-[#555] uppercase tracking-wide mb-1">
                        Theory · {theorySubjects.length} subjects
                    </p>
                    <div>
                        {theorySubjects.map((s, i) => (
                            <SubjectRow key={s.id} subject={s} index={i} />
                        ))}
                    </div>
                </div>
            )}

            {/* Practical / CA subjects */}
            {practicalSubjects.length > 0 && (
                <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                    <p className="text-xs text-[#555] uppercase tracking-wide mb-1">
                        Practical & CA · {practicalSubjects.length} subjects
                    </p>
                    <div>
                        {practicalSubjects.map((s, i) => (
                            <SubjectRow key={s.id} subject={s} index={i} />
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
})