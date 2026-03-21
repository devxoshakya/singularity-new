"use client"

import { useMemo, useState } from "react"
import { ChevronDown, BookOpen } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Source } from "./chat-thread"

interface Props {
    sources: Source[]
}

export function SourcesUsed({ sources }: Props) {
    const [expanded, setExpanded] = useState(false)
    const normalized = useMemo(() => {
        return [...sources]
            .map((source) => {
                const rawText = (source.text ?? source.excerpt ?? "").trim()
                const preview = rawText.replace(/\s+/g, " ").slice(0, 260)
                return {
                    sourceLabel: source.source ?? source.title ?? "Source",
                    score: source.score,
                    preview,
                    url: source.url,
                }
            })
            .filter((s) => s.preview.length > 0)
            .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    }, [sources])

    return (
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">

            {/* Toggle */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-2 text-xs text-[#555] hover:text-[#888] transition-colors"
            >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{normalized.length} source{normalized.length !== 1 ? "s" : ""} used</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>

            {/* Source cards */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 space-y-2">
                            {normalized.map((source, i) => (
                                <div
                                    key={`${source.sourceLabel}-${i}`}
                                    className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3"
                                >
                                    <div className="mb-1.5 flex items-center gap-2 text-xs text-[#7c7c7c]">
                                        <span className="rounded-full border border-[#333] px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                            {source.sourceLabel}
                                        </span>
                                        {typeof source.score === "number" && (
                                            <span>
                                                Relevance {(source.score * 100).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>

                                    {source.url ? (
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm leading-relaxed text-[#b8b8b8] hover:text-white"
                                        >
                                            {source.preview}
                                            {source.preview.length >= 260 ? "..." : ""}
                                        </a>
                                    ) : (
                                        <p className="text-sm leading-relaxed text-[#b8b8b8]">
                                            {source.preview}
                                            {source.preview.length >= 260 ? "..." : ""}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}