"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

function DistributionChart({
    total,
    distribution,
}: {
    total: number;
    distribution: DistributionItem[];
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                    Student Status Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-semibold">{total}</p>
                </div>

                <div className="space-y-3">
                    {distribution.map((item) => (
                        <div key={item.status} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{item.status}</span>
                                <span className="text-muted-foreground">
                                    {item.count} ({item.percentage.toFixed(2)}%)
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, item.percentage))}%`,
                                        background:
                                            item.fill || "hsl(var(--primary))",
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function PlaygroundChartRenderer({ payload }: { payload: AnalysisPayload }) {
    const maybeData = payload.data;
    const canRenderDistribution = isDistributionData(maybeData);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{payload.intent}</Badge>
                {payload.cached && <Badge variant="outline">cached</Badge>}
            </div>

            {canRenderDistribution ? (
                <DistributionChart
                    total={maybeData.total}
                    distribution={maybeData.distribution}
                />
            ) : (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Raw Analysis Output
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
                            {JSON.stringify(payload.raw, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {Object.keys(payload.params).length > 0 && (
                <>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                        Params: {JSON.stringify(payload.params)}
                    </div>
                </>
            )}
        </div>
    );
}
