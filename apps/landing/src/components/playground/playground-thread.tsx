"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlaygroundChartRenderer } from "@/components/playground/playground-chart-renderer";

type AnalysisResponse = {
    intent: string;
    params: Record<string, unknown>;
    data: unknown;
    cached: boolean;
    raw: unknown;
};

type PlaygroundMessage = {
    id: string;
    userQuery: string;
    analysis?: AnalysisResponse;
    error?: string;
};

export function PlaygroundThread() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = useMemo(
        () => query.trim().length > 0 && !submitting,
        [query, submitting],
    );

    async function runFlow(text: string) {
        const analysisBase = process.env.NEXT_PUBLIC_ANALYSIS_URL?.trim();
        if (!analysisBase) {
            throw new Error(
                "NEXT_PUBLIC_ANALYSIS_URL is not configured for query backend.",
            );
        }

        const draftId = crypto.randomUUID();
        setMessages((prev) => [
            ...prev,
            {
                id: draftId,
                userQuery: text,
            },
        ]);

        const analysisRes = await fetch(
            `${analysisBase}/api/query?text=${encodeURIComponent(text)}`,
            {
                method: "GET",
            },
        );

        const rawAnalysisJson =
            (await analysisRes.json().catch(() => ({} as AnalysisResponse))) ?? {};
        if (!analysisRes.ok) {
            throw new Error(
                (rawAnalysisJson as { error?: string }).error ??
                    "Analysis request failed.",
            );
        }

        const analysisJson: AnalysisResponse = {
            intent:
                typeof (rawAnalysisJson as Record<string, unknown>).intent ===
                "string"
                    ? ((rawAnalysisJson as Record<string, unknown>)
                          .intent as string)
                    : "unknown",
            params:
                ((rawAnalysisJson as Record<string, unknown>).params &&
                typeof (rawAnalysisJson as Record<string, unknown>).params ===
                    "object"
                    ? ((rawAnalysisJson as Record<string, unknown>)
                          .params as Record<string, unknown>)
                    : {}) ?? {},
            data:
                (rawAnalysisJson as Record<string, unknown>).data ??
                rawAnalysisJson,
            cached: Boolean(
                (rawAnalysisJson as Record<string, unknown>).cached,
            ),
            raw: rawAnalysisJson,
        };

        setMessages((prev) =>
            prev.map((message) =>
                message.id === draftId
                    ? {
                          ...message,
                          analysis: analysisJson,
                      }
                    : message,
            ),
        );
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!canSubmit) return;

        const value = query.trim();
        setQuery("");
        setSubmitting(true);

        try {
            await runFlow(value);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Request failed.";
            setMessages((prev) => {
                if (prev.length === 0) return prev;
                const cloned = [...prev];
                const lastIndex = cloned.length - 1;
                cloned[lastIndex] = { ...cloned[lastIndex], error: message };
                return cloned;
            });
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4">
            <div className="flex-1 space-y-4 overflow-y-auto pb-36">
                {messages.length === 0 ? (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Admin Visualization Playground
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Ask in natural language and inspect the analyzed chart
                            output.
                        </CardContent>
                    </Card>
                ) : (
                    messages.map((message) => (
                        <Card key={message.id}>
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-sm">Query</CardTitle>
                                <p className="text-sm">{message.userQuery}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {message.analysis && (
                                    <PlaygroundChartRenderer
                                        payload={message.analysis}
                                    />
                                )}

                                {message.error && (
                                    <p className="text-sm text-destructive">
                                        {message.error}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="fixed bottom-4 left-1/2 w-full max-w-5xl -translate-x-1/2 px-4"
            >
                <div className="flex items-center gap-2 rounded-xl border bg-background p-2 shadow-sm">
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Ask analytics query, e.g. pass percentage of 3rd year CSE"
                        maxLength={500}
                        disabled={submitting}
                    />
                    <Button type="submit" disabled={!canSubmit} className="gap-1.5">
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        Send Query
                    </Button>
                </div>
            </form>
        </div>
    );
}
