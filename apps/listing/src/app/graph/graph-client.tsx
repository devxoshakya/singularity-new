"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"

const FIXED_YEAR = 2
const FIXED_BRANCH = "CSE"

type MetricVariant = "avgSgpa" | "passRate" | "avgMarks"
type GroupByVariant = "semester" | "subject" | "branch"
type TopMetricVariant = "sgpa" | "marks"
type SgpaSemesterVariant = "latest" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"

type StatusDistributionEntry = {
  status: "Pass" | "PCP" | "Fail"
  count: number
  percentage: number
  fill: string
}

type StudentStatusDistributionData = {
  total: number
  distribution: StatusDistributionEntry[]
}

type BranchStatusBreakdownEntry = {
  branch: string
  pass: number
  pcp: number
  fail: number
  total: number
  passRate: number
}

type YearBranchDataPoint = {
  year: number
  [branch: string]: number | null
}

type YearBranchComparisonData = {
  years: YearBranchDataPoint[]
  branches: string[]
}

type PerformanceSnapshot = {
  year: number | null
  avgSgpa: number
  avgMarks: number
  passRate: number
  totalStudents: number
  topPerformers: number
  withBacklogs: number
  statusDistribution: {
    Pass: number
    PCP: number
    Fail: number
  }
}

type PerformanceMetricsData = {
  current: PerformanceSnapshot
  compare: PerformanceSnapshot
  comparison: {
    baseYear: number
    compareYear: number
    metrics: {
      avgSgpa: string
      passRate: string
      trend: "up" | "down" | "stable"
    }
  }
  insights: string[]
}

type SemesterProgressionData = {
  semesters: {
    semester: number
    avgSgpa: number
    maxSgpa: number
    minSgpa: number
    students: number
    passRate: number
  }[]
  improvement: string | null
}

type SgpaRangeDistributionData = {
  ranges: {
    range: string
    count: number
    label: string
    fill: string
  }[]
  median: number | null
  mode: string | null
}

type BacklogAnalysisEntry = {
  category: string
  activeBacklogs: number
  clearedBacklogs: number
  totalBacklogs: number
  clearanceRate: number
}

type BacklogAnalysisData = {
  data: BacklogAnalysisEntry[]
  meta: {
    year: number
    groupBy: GroupByVariant
    students: number
    studentsWithBacklogs: number
    activeBacklogs: number
    clearedBacklogs: number
    totalBacklogs: number
    clearanceRate: number
  }
}

type BranchPerformanceRadarEntry = {
  branch: string
  passRate: number
  academicPerformance: number
  backlogManagement: number
  totalStudents: number
  avgSgpa: number
  avgMarks: number
}

type TopPerformer = {
  rank: number
  rollNo: string
  enrollmentNo: string
  name: string
  branch: string
  year: number
  avgSgpa: number
  latestSgpa: number
  totalMarks: number
  status: "Pass" | "PCP" | "Fail"
  backlogCount: number
  performanceScore: number
  chartValue: number
}

type TopPerformersData = {
  topPerformers: TopPerformer[]
  metric: TopMetricVariant
  totalStudents: number
}

type ApiEnvelope<T> = {
  success: boolean
  data: T
  error?: string
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
]

async function fetchAnalytics<T>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T> {
  const response = await api.get<ApiEnvelope<T>>(endpoint, { params })

  if (!response.data.success) {
    throw new Error(response.data.error || `Request failed for ${endpoint}`)
  }

  return response.data.data
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {message}
    </div>
  )
}

export default function GraphPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [yearComparisonMetric, setYearComparisonMetric] =
    React.useState<MetricVariant>("avgSgpa")
  const [sgpaSemester, setSgpaSemester] = React.useState<SgpaSemesterVariant>("latest")
  const [backlogGroupBy, setBacklogGroupBy] = React.useState<GroupByVariant>("semester")
  const [topMetric, setTopMetric] = React.useState<TopMetricVariant>("sgpa")
  const [radarBranch, setRadarBranch] = React.useState<string>("")

  const [studentStatusDistribution, setStudentStatusDistribution] =
    React.useState<StudentStatusDistributionData | null>(null)
  const [branchStatusBreakdown, setBranchStatusBreakdown] = React.useState<
    BranchStatusBreakdownEntry[]
  >([])
  const [yearBranchComparisons, setYearBranchComparisons] = React.useState<
    Record<MetricVariant, YearBranchComparisonData>
  >({
    avgSgpa: { years: [], branches: [] },
    passRate: { years: [], branches: [] },
    avgMarks: { years: [], branches: [] },
  })
  const [performanceMetrics, setPerformanceMetrics] =
    React.useState<PerformanceMetricsData | null>(null)
  const [semesterProgression, setSemesterProgression] =
    React.useState<SemesterProgressionData | null>(null)
  const [sgpaRangeBySemester, setSgpaRangeBySemester] = React.useState<
    Record<SgpaSemesterVariant, SgpaRangeDistributionData>
  >({
    latest: { ranges: [], median: null, mode: null },
    "1": { ranges: [], median: null, mode: null },
    "2": { ranges: [], median: null, mode: null },
    "3": { ranges: [], median: null, mode: null },
    "4": { ranges: [], median: null, mode: null },
    "5": { ranges: [], median: null, mode: null },
    "6": { ranges: [], median: null, mode: null },
    "7": { ranges: [], median: null, mode: null },
    "8": { ranges: [], median: null, mode: null },
  })
  const [backlogByGroup, setBacklogByGroup] = React.useState<
    Record<GroupByVariant, BacklogAnalysisData>
  >({
    semester: {
      data: [],
      meta: {
        year: FIXED_YEAR,
        groupBy: "semester",
        students: 0,
        studentsWithBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        totalBacklogs: 0,
        clearanceRate: 0,
      },
    },
    subject: {
      data: [],
      meta: {
        year: FIXED_YEAR,
        groupBy: "subject",
        students: 0,
        studentsWithBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        totalBacklogs: 0,
        clearanceRate: 0,
      },
    },
    branch: {
      data: [],
      meta: {
        year: FIXED_YEAR,
        groupBy: "branch",
        students: 0,
        studentsWithBacklogs: 0,
        activeBacklogs: 0,
        clearedBacklogs: 0,
        totalBacklogs: 0,
        clearanceRate: 0,
      },
    },
  })
  const [branchPerformanceRadar, setBranchPerformanceRadar] = React.useState<
    BranchPerformanceRadarEntry[]
  >([])
  const [topPerformersByMetric, setTopPerformersByMetric] = React.useState<
    Record<TopMetricVariant, TopPerformersData>
  >({
    sgpa: { topPerformers: [], metric: "sgpa", totalStudents: 0 },
    marks: { topPerformers: [], metric: "marks", totalStudents: 0 },
  })

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const statusPromise = fetchAnalytics<StudentStatusDistributionData>(
          "/api/analytics/student-status-distribution",
          { year: FIXED_YEAR, branch: FIXED_BRANCH }
        )

        const branchBreakdownPromise = fetchAnalytics<BranchStatusBreakdownEntry[]>(
          "/api/analytics/branch-status-breakdown",
          { year: FIXED_YEAR, branch: FIXED_BRANCH }
        )

        const yearComparisonPromises = Promise.all([
          fetchAnalytics<YearBranchComparisonData>(
            "/api/analytics/year-branch-comparison",
            {
              years: "1,2,3,4",
              branches: FIXED_BRANCH,
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              metric: "avgSgpa",
            }
          ),
          fetchAnalytics<YearBranchComparisonData>(
            "/api/analytics/year-branch-comparison",
            {
              years: "1,2,3,4",
              branches: FIXED_BRANCH,
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              metric: "passRate",
            }
          ),
          fetchAnalytics<YearBranchComparisonData>(
            "/api/analytics/year-branch-comparison",
            {
              years: "1,2,3,4",
              branches: FIXED_BRANCH,
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              metric: "avgMarks",
            }
          ),
        ])

        const performancePromise = fetchAnalytics<PerformanceMetricsData>(
          "/api/analytics/performance-metrics",
          {
            years: "2,1",
            year: FIXED_YEAR,
            branch: FIXED_BRANCH,
          }
        )

        const semesterProgressionPromise = fetchAnalytics<SemesterProgressionData>(
          "/api/analytics/semester-progression",
          {
            year: FIXED_YEAR,
            branch: FIXED_BRANCH,
          }
        )

        const sgpaSemesterPromises = Promise.all([
          fetchAnalytics<SgpaRangeDistributionData>(
            "/api/analytics/sgpa-range-distribution",
            {
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              semester: "latest",
            }
          ),
          ...(["1", "2", "3", "4", "5", "6", "7", "8"] as const).map(
            (semester) =>
              fetchAnalytics<SgpaRangeDistributionData>(
                "/api/analytics/sgpa-range-distribution",
                {
                  year: FIXED_YEAR,
                  branch: FIXED_BRANCH,
                  semester,
                }
              )
          ),
        ])

        const backlogPromises = Promise.all([
          fetchAnalytics<{ data: BacklogAnalysisEntry[]; meta: BacklogAnalysisData["meta"] }>(
            "/api/analytics/backlog-analysis",
            {
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              groupBy: "semester",
            }
          ),
          fetchAnalytics<{ data: BacklogAnalysisEntry[]; meta: BacklogAnalysisData["meta"] }>(
            "/api/analytics/backlog-analysis",
            {
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              groupBy: "subject",
            }
          ),
          fetchAnalytics<{ data: BacklogAnalysisEntry[]; meta: BacklogAnalysisData["meta"] }>(
            "/api/analytics/backlog-analysis",
            {
              year: FIXED_YEAR,
              branch: FIXED_BRANCH,
              groupBy: "branch",
            }
          ),
        ])

        const radarPromise = fetchAnalytics<BranchPerformanceRadarEntry[]>(
          "/api/analytics/branch-performance-radar",
          {
            year: FIXED_YEAR,
            branch: FIXED_BRANCH,
          }
        )

        const topPerformersPromises = Promise.all([
          fetchAnalytics<TopPerformersData>("/api/analytics/top-performers", {
            year: FIXED_YEAR,
            branch: FIXED_BRANCH,
            metric: "sgpa",
            limit: 10,
          }),
          fetchAnalytics<TopPerformersData>("/api/analytics/top-performers", {
            year: FIXED_YEAR,
            branch: FIXED_BRANCH,
            metric: "marks",
            limit: 10,
          }),
        ])

        const [
          status,
          branchBreakdown,
          yearComparisonResults,
          performance,
          semesterData,
          sgpaSemesterResults,
          backlogResults,
          radarData,
          topPerformersResults,
        ] = await Promise.all([
          statusPromise,
          branchBreakdownPromise,
          yearComparisonPromises,
          performancePromise,
          semesterProgressionPromise,
          sgpaSemesterPromises,
          backlogPromises,
          radarPromise,
          topPerformersPromises,
        ])

        if (!isMounted) {
          return
        }

        setStudentStatusDistribution(status)
        setBranchStatusBreakdown(branchBreakdown)

        setYearBranchComparisons({
          avgSgpa: yearComparisonResults[0],
          passRate: yearComparisonResults[1],
          avgMarks: yearComparisonResults[2],
        })

        setPerformanceMetrics(performance)
        setSemesterProgression(semesterData)

        const semesterKeys: SgpaSemesterVariant[] = [
          "latest",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
        ]

        const sgpaNextState = semesterKeys.reduce(
          (acc, key, index) => {
            acc[key] = sgpaSemesterResults[index]
            return acc
          },
          {
            latest: { ranges: [], median: null, mode: null },
            "1": { ranges: [], median: null, mode: null },
            "2": { ranges: [], median: null, mode: null },
            "3": { ranges: [], median: null, mode: null },
            "4": { ranges: [], median: null, mode: null },
            "5": { ranges: [], median: null, mode: null },
            "6": { ranges: [], median: null, mode: null },
            "7": { ranges: [], median: null, mode: null },
            "8": { ranges: [], median: null, mode: null },
          } as Record<SgpaSemesterVariant, SgpaRangeDistributionData>
        )

        setSgpaRangeBySemester(sgpaNextState)

        setBacklogByGroup({
          semester: {
            data: backlogResults[0].data,
            meta: { ...backlogResults[0].meta, groupBy: "semester" },
          },
          subject: {
            data: backlogResults[1].data,
            meta: { ...backlogResults[1].meta, groupBy: "subject" },
          },
          branch: {
            data: backlogResults[2].data,
            meta: { ...backlogResults[2].meta, groupBy: "branch" },
          },
        })

        setBranchPerformanceRadar(radarData)

        setTopPerformersByMetric({
          sgpa: topPerformersResults[0],
          marks: topPerformersResults[1],
        })

        if (radarData.length > 0) {
          setRadarBranch((prev) => prev || radarData[0].branch)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load analytics")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedYearMetricData = yearBranchComparisons[yearComparisonMetric]
  const selectedSgpaDistribution = sgpaRangeBySemester[sgpaSemester]
  const selectedBacklog = backlogByGroup[backlogGroupBy]
  const selectedTopPerformers = topPerformersByMetric[topMetric]

  const selectedRadarData = React.useMemo(() => {
    const found = branchPerformanceRadar.find((item) => item.branch === radarBranch)
    if (!found) {
      return [] as { metric: string; value: number }[]
    }

    return [
      { metric: "Pass Rate", value: found.passRate },
      { metric: "Academic", value: found.academicPerformance },
      { metric: "Backlog Mgmt", value: found.backlogManagement },
    ]
  }, [branchPerformanceRadar, radarBranch])

  const performanceComparisonRows = React.useMemo(() => {
    if (!performanceMetrics) {
      return [] as { status: string; current: number; compare: number }[]
    }

    return [
      {
        status: "Pass",
        current: performanceMetrics.current.statusDistribution.Pass,
        compare: performanceMetrics.compare.statusDistribution.Pass,
      },
      {
        status: "PCP",
        current: performanceMetrics.current.statusDistribution.PCP,
        compare: performanceMetrics.compare.statusDistribution.PCP,
      },
      {
        status: "Fail",
        current: performanceMetrics.current.statusDistribution.Fail,
        compare: performanceMetrics.compare.statusDistribution.Fail,
      },
    ]
  }, [performanceMetrics])

  const yearComparisonConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      value: {
        label:
          yearComparisonMetric === "avgSgpa"
            ? "Average SGPA"
            : yearComparisonMetric === "passRate"
              ? "Pass Rate"
              : "Average Marks",
        color: "var(--chart-1)",
      },
    }

    selectedYearMetricData.branches.forEach((branch, index) => {
      cfg[branch] = {
        label: branch,
        color: chartColors[index % chartColors.length],
      }
    })

    return cfg
  }, [selectedYearMetricData.branches, yearComparisonMetric])

  const statusConfig = {
    count: {
      label: "Students",
    },
    Pass: { label: "Pass", color: "var(--chart-1)" },
    PCP: { label: "PCP", color: "var(--chart-2)" },
    Fail: { label: "Fail", color: "var(--chart-3)" },
  } satisfies ChartConfig

  const branchBreakdownConfig = {
    pass: { label: "Pass", color: "var(--chart-1)" },
    pcp: { label: "PCP", color: "var(--chart-2)" },
    fail: { label: "Fail", color: "var(--chart-3)" },
  } satisfies ChartConfig

  const semesterConfig = {
    avgSgpa: { label: "Average SGPA", color: "var(--chart-1)" },
    maxSgpa: { label: "Max SGPA", color: "var(--chart-2)" },
    minSgpa: { label: "Min SGPA", color: "var(--chart-3)" },
  } satisfies ChartConfig

  const sgpaRangeConfig = {
    count: { label: "Students", color: "var(--chart-4)" },
  } satisfies ChartConfig

  const backlogConfig = {
    activeBacklogs: { label: "Active", color: "var(--chart-5)" },
    clearedBacklogs: { label: "Cleared", color: "var(--chart-2)" },
  } satisfies ChartConfig

  const performanceStatusConfig = {
    current: { label: `Year ${FIXED_YEAR}`, color: "var(--chart-1)" },
    compare: { label: "Year 1", color: "var(--chart-3)" },
  } satisfies ChartConfig

  const topPerformerConfig = {
    chartValue: {
      label: topMetric === "sgpa" ? "SGPA Score" : "Marks Score",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const radarConfig = {
    value: { label: "Score", color: "var(--chart-2)" },
  } satisfies ChartConfig

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold">Analytics Graphs</h1>
        <Badge variant="secondary">year=2</Badge>
        <Badge variant="secondary">branch=cse</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Visualized from analysis APIs with endpoint-specific chart mappings and query variations.
      </p>

      {loading ? <div className="text-sm text-muted-foreground">Loading analytics charts...</div> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Status Distribution</CardTitle>
              <CardDescription>
                `GET /api/analytics/student-status-distribution` filtered by year and branch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusConfig} className="mx-auto h-[260px] w-full max-w-[360px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                  <Pie
                    data={studentStatusDistribution?.distribution ?? []}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={60}
                    outerRadius={100}
                  >
                    {(studentStatusDistribution?.distribution ?? []).map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Status Breakdown</CardTitle>
              <CardDescription>
                `GET /api/analytics/branch-status-breakdown` shown as grouped bars.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={branchBreakdownConfig} className="h-[260px] w-full">
                <BarChart data={branchStatusBreakdown} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="branch" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pass" fill="var(--color-pass)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pcp" fill="var(--color-pcp)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fail" fill="var(--color-fail)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Year Branch Comparison</CardTitle>
                  <CardDescription>
                    `GET /api/analytics/year-branch-comparison` with metric variations.
                  </CardDescription>
                </div>
                <Select value={yearComparisonMetric} onValueChange={(value) => setYearComparisonMetric(value as MetricVariant)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avgSgpa">avgSgpa</SelectItem>
                    <SelectItem value="passRate">passRate</SelectItem>
                    <SelectItem value="avgMarks">avgMarks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={yearComparisonConfig} className="h-[260px] w-full">
                <AreaChart data={selectedYearMetricData.years} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {selectedYearMetricData.branches.map((branch) => (
                    <Area
                      key={branch}
                      dataKey={branch}
                      type="monotone"
                      stroke={`var(--color-${branch})`}
                      fill={`var(--color-${branch})`}
                      fillOpacity={0.2}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics (Year 2 vs Year 1)</CardTitle>
              <CardDescription>
                `GET /api/analytics/performance-metrics` using `years=2,1` and fixed branch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Year 2 Avg SGPA</div>
                  <div className="text-xl font-semibold">{performanceMetrics?.current.avgSgpa ?? "-"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Year 1 Avg SGPA</div>
                  <div className="text-xl font-semibold">{performanceMetrics?.compare.avgSgpa ?? "-"}</div>
                </div>
              </div>
              <ChartContainer config={performanceStatusConfig} className="h-[220px] w-full">
                <BarChart data={performanceComparisonRows} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compare" fill="var(--color-compare)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semester Progression</CardTitle>
              <CardDescription>
                `GET /api/analytics/semester-progression` rendered as SGPA trend lines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={semesterConfig} className="h-[260px] w-full">
                <LineChart data={semesterProgression?.semesters ?? []} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="semester" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="avgSgpa" stroke="var(--color-avgSgpa)" strokeWidth={2} dot={false} />
                  <Line dataKey="maxSgpa" stroke="var(--color-maxSgpa)" strokeWidth={2} dot={false} />
                  <Line dataKey="minSgpa" stroke="var(--color-minSgpa)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>SGPA Range Distribution</CardTitle>
                  <CardDescription>
                    `GET /api/analytics/sgpa-range-distribution` across semester variations.
                  </CardDescription>
                </div>
                <Select value={sgpaSemester} onValueChange={(value) => setSgpaSemester(value as SgpaSemesterVariant)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">latest</SelectItem>
                    <SelectItem value="1">semester 1</SelectItem>
                    <SelectItem value="2">semester 2</SelectItem>
                    <SelectItem value="3">semester 3</SelectItem>
                    <SelectItem value="4">semester 4</SelectItem>
                    <SelectItem value="5">semester 5</SelectItem>
                    <SelectItem value="6">semester 6</SelectItem>
                    <SelectItem value="7">semester 7</SelectItem>
                    <SelectItem value="8">semester 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={sgpaRangeConfig} className="h-[260px] w-full">
                <BarChart data={selectedSgpaDistribution.ranges} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Backlog Analysis</CardTitle>
                  <CardDescription>
                    `GET /api/analytics/backlog-analysis` using all `groupBy` variants.
                  </CardDescription>
                </div>
                <Select value={backlogGroupBy} onValueChange={(value) => setBacklogGroupBy(value as GroupByVariant)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">semester</SelectItem>
                    <SelectItem value="subject">subject</SelectItem>
                    <SelectItem value="branch">branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Students with Backlogs</div>
                  <div className="text-lg font-semibold">{selectedBacklog.meta.studentsWithBacklogs}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Clearance Rate</div>
                  <div className="text-lg font-semibold">{selectedBacklog.meta.clearanceRate}%</div>
                </div>
              </div>
              <ChartContainer config={backlogConfig} className="h-[220px] w-full">
                <BarChart data={selectedBacklog.data} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="activeBacklogs" stackId="a" fill="var(--color-activeBacklogs)" />
                  <Bar dataKey="clearedBacklogs" stackId="a" fill="var(--color-clearedBacklogs)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Branch Performance Radar</CardTitle>
                  <CardDescription>
                    `GET /api/analytics/branch-performance-radar` displayed per branch.
                  </CardDescription>
                </div>
                <Select value={radarBranch} onValueChange={setRadarBranch}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchPerformanceRadar.map((entry) => (
                      <SelectItem key={entry.branch} value={entry.branch}>
                        {entry.branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={radarConfig} className="mx-auto h-[260px] w-full max-w-[360px]">
                <RadarChart data={selectedRadarData}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <Radar dataKey="value" fill="var(--color-value)" stroke="var(--color-value)" fillOpacity={0.35} />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>
                    `GET /api/analytics/top-performers` with `metric=sgpa|marks`.
                  </CardDescription>
                </div>
                <Select value={topMetric} onValueChange={(value) => setTopMetric(value as TopMetricVariant)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sgpa">sgpa</SelectItem>
                    <SelectItem value="marks">marks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartContainer config={topPerformerConfig} className="h-80 w-full">
                <RadialBarChart
                  data={selectedTopPerformers.topPerformers}
                  innerRadius={28}
                  outerRadius={140}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarGrid gridType="circle" />
                  <PolarAngleAxis dataKey="name" tick={false} />
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <RadialBar dataKey="chartValue" background fill="var(--color-chartValue)" />
                </RadialBarChart>
              </ChartContainer>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTopPerformers.topPerformers.map((student) => (
                    <TableRow key={`${student.rollNo}-${student.rank}`}>
                      <TableCell>{student.rank}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.branch}</TableCell>
                      <TableCell>
                        {topMetric === "sgpa" ? student.avgSgpa.toFixed(2) : student.totalMarks}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "Pass"
                              ? "default"
                              : student.status === "PCP"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
