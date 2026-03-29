"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { UserMessage } from "@/components/chat/thread/user-message";
import { PlaygroundChartRenderer } from "@/components/playground/playground-chart-renderer";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const analysisBase = process.env.NEXT_PUBLIC_ANALYSIS_BASE_URL ?? "";
const GRAPHS = Array.from({ length: 7 }, (_, i) => `/assets/graphs/${i + 1}.png`);

const imageVariants = {
    whileHover: {
        scale: 1.1,
        rotate: 0,
        zIndex: 100,
    },
    whileTap: {
        scale: 1.1,
        rotate: 0,
        zIndex: 100,
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
    const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
    const [input, setInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, submitting]);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 240) + "px";
    }, [input]);

    async function runFlow(text: string) {
        const draftId = crypto.randomUUID();

        setMessages((prev) => [
            ...prev,
            {
                id: draftId,
                userQuery: text,
            },
        ]);

        try {
            const analysisRes = await fetch(
                `${analysisBase}/api/query?text=${encodeURIComponent(text)}`,
                { method: "GET" },
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
                    typeof (rawAnalysisJson as Record<string, unknown>).intent === "string"
                        ? ((rawAnalysisJson as Record<string, unknown>).intent as string)
                        : "unknown",
                params:
                    ((rawAnalysisJson as Record<string, unknown>).params &&
                    typeof (rawAnalysisJson as Record<string, unknown>).params === "object"
                        ? ((rawAnalysisJson as Record<string, unknown>).params as Record<
                              string,
                              unknown
                          >)
                        : {}) ?? {},
                data:
                    (rawAnalysisJson as Record<string, unknown>).data ?? rawAnalysisJson,
                cached: Boolean((rawAnalysisJson as Record<string, unknown>).cached),
                raw: rawAnalysisJson,
            };

            setMessages((prev) =>
                prev.map((message) =>
                    message.id === draftId
                        ? { ...message, analysis: analysisJson }
                        : message,
                ),
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : "Request failed.";
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === draftId ? { ...m, error: message } : m
                )
            );
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    const handleSubmit = () => {
        const text = input.trim();
        if (!text || submitting) return;
        setInput("");
        setSubmitting(true);
        runFlow(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="relative flex flex-col h-full w-full bg-[#0a0a0a]">
            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 md:px-6 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="mx-auto max-w-4xl w-full space-y-8 pb-32">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-center space-y-10">
                            <div className="space-y-4 max-w-2xl">
                                <motion.h1 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-5xl font-bold tracking-tight text-white"
                                >
                                    Visualize and Analyse the results of students
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-gray-400 text-lg"
                                >
                                    Ask in natural language and inspect the analyzed chart output. 
                                    Get real-time insights from your institutional data.
                                </motion.p>
                            </div>

                            {/* Static Graphs Showcase (SkeletonTwo style) */}
                            <div className="relative mt-8 flex flex-col items-center gap-4 overflow-hidden p-4 w-full opacity-60 hover:opacity-100 transition-opacity duration-700">
                                <div className="flex flex-row justify-center w-full">
                                    {GRAPHS.map((src, idx) => (
                                        <motion.div
                                            key={"images-first-" + idx}
                                            style={{
                                                rotate: Math.random() * 20 - 10,
                                            }}
                                            variants={imageVariants}
                                            whileHover="whileHover"
                                            whileTap="whileTap"
                                            className="mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm group-hover:border-primary/40 transition-colors duration-300"
                                        >
                                            <div className="relative h-16 w-16 sm:h-24 sm:w-24 overflow-hidden rounded-lg">
                                                <Image
                                                    src={src}
                                                    alt={`Graph ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 64px, 96px"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="flex flex-row justify-center w-full ml-8">
                                    {GRAPHS.slice().reverse().map((src, idx) => (
                                        <motion.div
                                            key={"images-second-" + idx}
                                            style={{
                                                rotate: Math.random() * 20 - 10,
                                            }}
                                            variants={imageVariants}
                                            whileHover="whileHover"
                                            whileTap="whileTap"
                                            className="mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm group-hover:border-primary/40 transition-colors duration-300"
                                        >
                                            <div className="relative h-16 w-16 sm:h-24 sm:w-24 overflow-hidden rounded-lg">
                                                <Image
                                                    src={src}
                                                    alt={`Graph ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 64px, 96px"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Side gradients for fading effect */}
                                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 h-full w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
                                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 h-full w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((message) => (
                                <motion.div 
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* User Message */}
                                    <UserMessage content={message.userQuery} />

                                    {/* Analysis Response */}
                                    <div className="w-full py-4">
                                        {message.analysis ? (
                                            <div className="w-full">
                                                <PlaygroundChartRenderer
                                                    payload={message.analysis}
                                                />
                                            </div>
                                        ) : message.error ? (
                                            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                                {message.error}
                                            </div>
                                        ) : (
                                            /* Loading State for Analysis */
                                            <div className="flex items-center gap-3 text-sm text-gray-500 animate-pulse">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                Analyzing data...
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Simple Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pointer-events-none">
                <div className="mx-auto max-w-4xl w-full pointer-events-auto">
                    <div className="relative group rounded-[22px] bg-primary/10 p-[2px] transition-all duration-300">
                        <div className="flex items-center gap-2 rounded-[20px] bg-[#1f1f1f] border border-white/5 p-2 pr-2 shadow-2xl">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={submitting}
                                placeholder="Ask an analytics query..."
                                rows={1}
                                className="flex-1 bg-transparent px-4 py-3 text-[15px] text-gray-100 placeholder:text-gray-500 resize-none outline-none border-none max-h-[240px] leading-relaxed"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !input.trim()}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-gray-600 transition-all shrink-0"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArrowUp className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
