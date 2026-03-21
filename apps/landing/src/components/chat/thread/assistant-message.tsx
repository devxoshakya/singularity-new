"use client"

import { memo, useMemo }  from "react"
import { Streamdown }      from "streamdown"
import { code }            from "@streamdown/code"
import { math }            from "@streamdown/math"
import { SourcesUsed }     from "./sources-used"
import { ResultsRenderer } from "./result-renderer"
import { useAnimatedText } from "@/components/ui/animated-text"
import type { Source, Mode } from "./chat-thread"

// Plugins defined outside component — stable reference, no recreation on render
const RAG_PLUGINS     = { code, math }
const RESULTS_PLUGINS = { code }       // math not needed for result data

interface Props {
    content:     string
    sources?:    Source[]
    mode:        Mode
    isStreaming: boolean
}

export const AssistantMessage = memo(function AssistantMessage({
    content,
    sources = [],
    mode,
    isStreaming,
}: Props) {
    const animatedContent = useAnimatedText(content)
    const renderedContent = isStreaming ? animatedContent : content

    // For results mode, try to parse as JSON
    const parsedResult = useMemo(() => {
        if (mode !== "results" || isStreaming) return null
        try {
            return JSON.parse(content)
        } catch {
            return null
        }
    }, [content, mode, isStreaming])

    return (
        // No bubble — content sits directly on the background
        <div className="w-full py-4">

            {mode === "results" && parsedResult ? (
                // Structured result data — visual renderer
                <ResultsRenderer data={parsedResult} />
            ) : (
                // RAG response OR results mode still streaming as text
                <Streamdown
                    plugins={mode === "rag" ? RAG_PLUGINS : RESULTS_PLUGINS}
                    isAnimating={false}
                    className={[
                        "chat-markdown",
                        "prose prose-invert max-w-none text-[15px]",
                        // Paragraph spacing
                        "prose-p:leading-[1.75] prose-p:my-3",
                        // Headings
                        "prose-headings:text-white prose-headings:font-semibold",
                        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
                        // Code blocks
                        "prose-pre:bg-[#161616] prose-pre:border prose-pre:border-[#2a2a2a]",
                        "prose-pre:rounded-xl prose-pre:text-sm",
                        "prose-pre:prose-code:text-inherit prose-pre:prose-code:bg-transparent",
                        "prose-pre:prose-code:p-0 prose-pre:prose-code:rounded-none",
                        "prose-pre:prose-code:before:content-none prose-pre:prose-code:after:content-none",
                        // Inline code
                        "prose-code:text-[#e2b96b] prose-code:bg-[#1e1a10]",
                        "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
                        "prose-code:before:content-none prose-code:after:content-none",
                        // Lists
                        "prose-ul:my-3 prose-li:my-1",
                        "prose-ol:my-3",
                        // Blockquotes
                        "prose-blockquote:border-l-[#444] prose-blockquote:text-gray-400",
                        // Tables
                        "prose-table:text-sm",
                        "prose-th:text-gray-300 prose-th:bg-[#1a1a1a]",
                        "prose-td:border-[#2a2a2a]",
                        // Links
                        "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
                    ].join(" ")}
                >
                    {renderedContent}
                </Streamdown>
            )}

            {/* Sources — only render after stream is done and sources exist */}
            {!isStreaming && sources.length > 0 && (
                <SourcesUsed sources={sources} />
            )}

        </div>
    )
})