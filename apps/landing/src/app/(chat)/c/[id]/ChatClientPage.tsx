"use client";

import { useState, useCallback, useRef, use, useEffect } from "react";
import { PromptInputBox } from "@/components/ui/demo-ai-box";
import { ChatThread } from "@/components/chat/thread/chat-thread";
import type { Mode, Message } from "@/components/chat/thread/chat-thread";

// Messages are loaded server-side and passed as a promise — use() unwraps it
interface Props {
    conversationId: string;
    messagesPromise: Promise<Message[]>;
}

export default function ChatPageClient({
    conversationId,
    messagesPromise,
}: Props) {
    // use() unwraps the promise — Suspense in the server page handles loading
    const initialMessages = use(messagesPromise);

    const [inputValue, setInputValue] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [mode, setMode] = useState<Mode>("rag");

    const sendRef = useRef<((text: string, mode: Mode) => void) | null>(null);
    const stopRef = useRef<(() => void) | null>(null);

    const handleSend = useCallback(
        (message: string) => {
            const send =
                sendRef.current ??
                ((window as any).__chatSend as
                    | ((text: string, mode: Mode) => void)
                    | undefined);

            send?.(message, mode);
            setInputValue("");
        },
        [inputValue, mode],
    );

    const handleStop = useCallback(() => {
        const stop =
            stopRef.current ??
            ((window as any).__chatStop as (() => void) | undefined);

        stop?.();
    }, []);

    const syncRefs = useCallback(() => {
        sendRef.current = (window as any).__chatSend ?? null;
        stopRef.current = (window as any).__chatStop ?? null;
    }, []);

    useEffect(() => {
        syncRefs();
    }, [syncRefs, inputValue]);

    return (
        <div className="flex flex-col rounded-t-4xl w-full h-full min-h-0 bg-background">
            <div className="flex-1 min-h-0 overflow-hidden">
                <ChatThread
                    conversationId={conversationId}
                    initialMessages={initialMessages}
                    initialMode={mode}
                    onStreamingChange={setIsStreaming}
                />
            </div>

            <div className="flex shrink-0 justify-center pb-0 px-4">
                <div className="w-[500px] md:w-[750px]">
                    <PromptInputBox
                        onSend={handleSend}
                        onModeChange={setMode}
                        onStop={handleStop}
                        isStreaming={isStreaming}
                        value={inputValue}
                        onValueChange={(v) => {
                            setInputValue(v);
                            syncRefs();
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
