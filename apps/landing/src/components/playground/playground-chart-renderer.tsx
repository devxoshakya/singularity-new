"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type DistributionItem = {
    status: string;
    count: number;
    percentage: number;
    fill?: string;
};

type AnalysisPayload = {
    intent: string;
    params: Record<string, unknown>;
    data: unknown;
    cached: boolean;
    raw: unknown;
};

// ─── Type Guards ─────────────────────────────────────────────────────────────

function isDistributionData(data: unknown): data is {
    total: number;
    distribution: DistributionItem[];
} {
    if (!data || typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;
    return (
        typeof obj.total === "number" &&
        Array.isArray(obj.distribution) &&
        obj.distribution.every(
            (item) =>
                item &&
                typeof item === "object" &&
                typeof (item as DistributionItem).status === "string" &&
                typeof (item as DistributionItem).count === "number" &&
                typeof (item as DistributionItem).percentage === "number",
        )
    );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
    Pass: "#22c55e",
    PCP: "#fbbf24",
    Fail: "#ef4444",
} as const;

const PIE_COLORS = ["#22c55e", "#fbbf24", "#ef4444"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlaygroundChartRenderer({
    payload,
}: {
    payload: AnalysisPayload;
}) {
    const { data: maybeData, intent, cached, params, raw } = payload;

    // ── get_branch_breakdown → Grouped Bar Chart ──────────────────────────────
    if (intent === "get_branch_breakdown" && Array.isArray(maybeData)) {
        const chartData = (maybeData as any[]).map((item) => ({
            branch: item.branch as string,
            Pass: item.pass as number,
            PCP: item.pcp as number,
            Fail: item.fail as number,
        }));

        const chartConfig: ChartConfig = {
            Pass: { label: "Pass", color: STATUS_COLORS.Pass },
            PCP: { label: "PCP", color: STATUS_COLORS.PCP },
            Fail: { label: "Fail", color: STATUS_COLORS.Fail },
        };

        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{intent}</Badge>
                    {cached && <Badge variant="outline">cached</Badge>}
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Branch-wise Status Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={chartConfig}
                            className="h-72 w-full"
                        >
                            <BarChart data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="branch"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar
                                    dataKey="Pass"
                                    fill="var(--color-Pass)"
                                    radius={4}
                                />
                                <Bar
                                    dataKey="PCP"
                                    fill="var(--color-PCP)"
                                    radius={4}
                                />
                                <Bar
                                    dataKey="Fail"
                                    fill="var(--color-Fail)"
                                    radius={4}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {Object.keys(params).length > 0 && (
                    <>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                            Params: {JSON.stringify(params)}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── get_student_status → Pie Chart ────────────────────────────────────────
    if (intent === "get_student_status" && isDistributionData(maybeData)) {
        const chartConfig: ChartConfig = Object.fromEntries(
            maybeData.distribution.map((item, idx) => [
                item.status,
                {
                    label: item.status,
                    color: item.fill ?? PIE_COLORS[idx % PIE_COLORS.length],
                },
            ]),
        );

        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{intent}</Badge>
                    {cached && <Badge variant="outline">cached</Badge>}
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Student Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={chartConfig}
                            className="h-72 w-full"
                        >
                            <PieChart>
                                <Pie
                                    data={maybeData.distribution}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name, percent }) =>
                                        `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`
                                    }
                                >
                                    {maybeData.distribution.map(
                                        (entry, idx) => (
                                            <Cell
                                                key={`cell-${idx}`}
                                                fill={
                                                    entry.fill ??
                                                    PIE_COLORS[
                                                        idx % PIE_COLORS.length
                                                    ]
                                                }
                                            />
                                        ),
                                    )}
                                </Pie>
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>

                        <div className="mt-4 text-xs text-muted-foreground">
                            Total Students:{" "}
                            <span className="font-semibold">
                                {maybeData.total}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {Object.keys(params).length > 0 && (
                    <>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                            Params: {JSON.stringify(params)}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── Fallback → Raw JSON ───────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{intent}</Badge>
                {cached && <Badge variant="outline">cached</Badge>}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                        Raw Analysis Output
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(raw, null, 2)}
                    </pre>
                </CardContent>
            </Card>

            {Object.keys(params).length > 0 && (
                <>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                        Params: {JSON.stringify(params)}
                    </div>
                </>
            )}
        </div>
    );
}
