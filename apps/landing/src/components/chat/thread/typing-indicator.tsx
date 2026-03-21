"use client"

import { LoadingBreadcrumb } from "@/components/ui/animated-loading-svg-text-shimmer"
import type { Mode } from "./chat-thread"

interface Props {
    mode: Mode
}

const MESSAGES: Record<Mode, string> = {
    rag:     "Searching knowledge base...",
    results: "Analysing your results...",
}

export function TypingIndicator({ mode }: Props) {
    return (
        <div className="w-full py-4 pl-4">
            <LoadingBreadcrumb
                text={MESSAGES[mode]}
                className="text-[15px] text-gray-500"
            />
        </div>
    )
}