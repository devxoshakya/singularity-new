"use client"

import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Landmark,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react"
import type { StudentResult } from "@/components/dashboard/student-accordian"

interface StudentResultsDialogProps {
  results: StudentResult
}

export function StudentResultsDialog({ results }: StudentResultsDialogProps) {
  // Check for backlogs - handle both formats of CarryOvers
  const hasBacklogs = results.CarryOvers.some((c) => {
    if (Array.isArray(c)) {
      return c[0] !== "No Backlogs"
    }
    // If it's an object with session, sem, cop properties
    return true
  })

  // Calculate average SGPA
  const sgpaValues = Object.values(results.SGPA).filter((v) => v !== undefined) as number[]
  const avgSGPA = sgpaValues.length > 0
    ? (sgpaValues.reduce((a, b) => a + b, 0) / sgpaValues.length).toFixed(2)
    : "N/A"

  // Extract failed subject codes from latest carryover
  const getFailedSubjectCodes = (): string[] => {
    const failedCodes: string[] = []

    results.CarryOvers.forEach((carryOver) => {
      if (Array.isArray(carryOver)) {
        // Skip "No Backlogs" entries
        if (carryOver[0] === "No Backlogs") return
      } else if (typeof carryOver === "object" && "cop" in carryOver) {
        // Extract codes from "COP : BAS302,BCE301,BCE302"
        const copString = carryOver.cop
        const match = copString.match(/COP\s*:\s*(.+)/)
        if (match && match[1]) {
          const codes = match[1].split(",").map((code) => code.trim()).filter(Boolean)
          failedCodes.push(...codes)
        }
      }
    })

    return [...new Set(failedCodes)] // Remove duplicates
  }

  const failedSubjectCodes = getFailedSubjectCodes()
  
  // Check if a subject has failed
  const isSubjectFailed = (subjectCode: string): boolean => {
    return failedSubjectCodes.includes(subjectCode)
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "theory":
        return "bg-sky-100 text-sky-800 border-sky-200"
      case "practical":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "ca":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const parseMarks = (value: string): number | null => {
    const parsed = Number.parseInt(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  const getTotal = (internal: string, external: string): string => {
    const internalValue = parseMarks(internal)
    const externalValue = parseMarks(external)

    if (internalValue === null && externalValue === null) return "-"
    return String((internalValue ?? 0) + (externalValue ?? 0))
  }

  const carryOverEntries = results.CarryOvers.filter((entry) => {
    if (Array.isArray(entry)) {
      return entry[0] !== "No Backlogs"
    }
    return true
  })

  const statusPillClass = hasBacklogs
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200"

  const latestCopList = results.latestCOP
    ? results.latestCOP.replace("COP :", "").split(",").map((item) => item.trim()).filter(Boolean)
    : []

  const sgpaChartData = Object.entries(results.SGPA)
    .filter(([, sgpa]) => sgpa !== undefined)
    .map(([, sgpa], index) => ({
      month: `Semester ${index + 1}`,
      desktop: sgpa as number,
      mobile: sgpa as number,
    }))

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-2)",
    },
    mobile: {
      label: "Mobile",
      color: "var(--chart-2)",
    },
    label: {
      color: "var(--background)",
    },
  } satisfies ChartConfig

  return (
    <DialogContent className="w-[96dvw] h-[92dvh] sm:w-[92dvw] sm:max-w-3xl md:max-h-[92dvh] flex flex-col p-0 overflow-hidden">
      <DialogHeader className="px-4 md:px-6 pt-4 md:pt-5 pb-4 border-b bg-linear-to-r from-primary/10 via-primary/5 to-transparent shrink-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <GraduationCap className="size-5 text-primary" />
            Student Academic Record
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-medium">Year {results.year}</Badge>
            <Badge variant="outline" className={statusPillClass}>
              {hasBacklogs ? "Backlogs" : "Clear"}
            </Badge>
            <Badge variant="outline" className="font-medium">
              {results.blocked ? (
                <span className="inline-flex items-center gap-1"><XCircle className="size-3" />Blocked</span>
              ) : (
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" />Active</span>
              )}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{results.fullName}</p>
      </DialogHeader>

      <div className="overflow-y-auto px-4 md:px-6 py-4 md:py-5 flex-1 scrollbar-thin">
        <div className="space-y-5 md:space-y-6 pb-4">
          {/* Identity & Core Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <User className="size-4 text-primary" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{results.rollNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enrollment No</p>
                  <p className="font-medium break-all">{results.enrollmentNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Course</p>
                  <p className="font-medium">{results.course}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium">{results.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{results.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Division</p>
                  <p className="font-medium">{results.divison || "Not Awarded"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-linear-to-b from-primary/10 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Award className="size-3.5" />
                  Total Marks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{results.totalMarksObtained}</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-b from-emerald-100/50 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  Avg SGPA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{avgSGPA}</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-b from-sky-100/50 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">CGPA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{results.cgpa || "-"}</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-b from-amber-100/50 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Latest Result</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className={statusPillClass}>
                  {results.latestResultStatus || (hasBacklogs ? "Backlogs" : "Clear")}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* SGPA per Semester */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                Semester-wise SGPA
              </CardTitle>
              <CardDescription>Performance trend across completed semesters</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="max-h-80 w-full">
                <BarChart
                  accessibilityLayer
                  data={sgpaChartData}
                  layout="vertical"
                  margin={{ right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="month"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <XAxis dataKey="desktop" type="number" hide domain={[0, 10]} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="desktop"
                    layout="vertical"
                    fill="var(--color-desktop)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="month"
                      position="insideLeft"
                      offset={8}
                      className="fill-(--color-label)"
                      fontSize={12}
                    />
                    <LabelList
                      dataKey="desktop"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                SGPA trend overview <TrendingUp className="h-4 w-4" />
              </div>
              <div className="leading-none text-muted-foreground">
                Showing semester performance for available results
              </div>
            </CardFooter>
          </Card>

          {/* Carry Over Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <AlertTriangle className="size-4 text-primary" />
                Carry Over Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestCopList.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Current Active Backlogs</p>
                  <div className="flex flex-wrap gap-2">
                    {latestCopList.map((code) => (
                      <Badge key={code} variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {carryOverEntries.length === 0 ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">No Backlogs</Badge>
              ) : (
                <div className="space-y-2">
                  {carryOverEntries.map((entry, index) => {
                    if (Array.isArray(entry)) {
                      return (
                        <div key={`array-${index}`} className="rounded-lg border p-3 text-sm text-muted-foreground">
                          {entry.join(", ")}
                        </div>
                      )
                    }

                    return (
                      <div key={`${entry.session}-${index}`} className="rounded-lg border p-3 space-y-1.5">
                        <p className="text-sm font-semibold">{entry.session}</p>
                        <p className="text-xs font-extrabold text-muted-foreground">Semester: {entry.sem}</p>
                        <p className="text-sm font-extrabold text-red-600">{entry.cop}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <BookOpen className="size-4 text-primary" />
                Subject Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Subject</th>
                        <th className="px-4 py-2 text-center font-medium">Code</th>
                        <th className="px-4 py-2 text-center font-medium">Type</th>
                        <th className="px-4 py-2 text-center font-medium">Internal</th>
                        <th className="px-4 py-2 text-center font-medium">External</th>
                        <th className="px-4 py-2 text-center font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.Subjects.map((subject) => {
                        const failed = isSubjectFailed(subject.code)
                        return (
                          <tr key={subject.id} className={failed ? "border-t bg-red-50/40" : "border-t hover:bg-muted/30"}>
                            <td className={`px-4 py-2 ${failed ? "text-red-700 font-semibold" : "font-medium"}`}>
                              {subject.subject}
                            </td>
                            <td className={`px-4 py-2 text-center ${failed ? "text-red-700 font-semibold" : "text-muted-foreground"}`}>
                              {subject.code}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className={`text-xs ${getTypeColor(subject.type)}`}>
                                {subject.type}
                              </Badge>
                            </td>
                            <td className={`px-4 py-2 text-center font-medium ${failed ? "text-red-700" : ""}`}>
                              {subject.internal || "-"}
                            </td>
                            <td className={`px-4 py-2 text-center font-medium ${failed ? "text-red-700" : ""}`}>
                              {subject.external || "-"}
                            </td>
                            <td className={`px-4 py-2 text-center font-bold ${failed ? "text-red-700" : ""}`}>
                              {getTotal(subject.internal, subject.external)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 max-h-[430px] overflow-y-auto scrollbar-thin">
                {results.Subjects.map((subject) => {
                  const failed = isSubjectFailed(subject.code)
                  return (
                    <Card key={subject.id} className={failed ? "border-red-200 bg-red-50/30" : "border-border/80"}>
                      <CardContent className="p-3.5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${failed ? "text-red-700" : ""}`}>{subject.subject}</p>
                            <p className={`text-xs mt-0.5 ${failed ? "text-red-600" : "text-muted-foreground"}`}>{subject.code}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs shrink-0 ${getTypeColor(subject.type)}`}>
                            {subject.type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                          <div>
                            <p className="text-[11px] text-muted-foreground">Internal</p>
                            <p className={`font-semibold ${failed ? "text-red-700" : ""}`}>{subject.internal || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">External</p>
                            <p className={`font-semibold ${failed ? "text-red-700" : ""}`}>{subject.external || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">Total</p>
                            <p className={`font-bold ${failed ? "text-red-700" : ""}`}>{getTotal(subject.internal, subject.external)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Institute */}
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Institute</p>
              <p className="font-medium text-sm md:text-base flex items-start gap-2">
                <Landmark className="size-4 mt-0.5 text-primary shrink-0" />
                <span>{results.instituteName}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DialogContent>
  )
}
