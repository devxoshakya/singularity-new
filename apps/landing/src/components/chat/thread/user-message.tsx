"use client"

import { memo } from "react"

interface Props {
    content: string
}

export const UserMessage = memo(function UserMessage({ content }: Props) {
    return (
        <div className="flex justify-end w-full py-2">
            <div className="max-w-[80%] bg-[#1f1f1f] border border-[#2e2e2e] rounded-2xl rounded-tr-sm px-4 py-3">
                <div className="text-[15px] text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {content}
                </div>
            </div>
        </div>
    )
})