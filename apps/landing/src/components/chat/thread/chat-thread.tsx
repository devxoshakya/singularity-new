"use client";

import {
    useReducer,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
    useState,
} from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";
import { TypingIndicator } from "./typing-indicator";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import Loader from "@/components/Loader";
import { createFrontendJwtToken, getApiKey } from "@/lib/frontend-auth";
import { LocalStorageService } from "@/lib/local-storage-service";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Mode = "rag" | "results";

export type Source = {
    title: string;
    excerpt: string;
    page?: number;
    url?: string;
    text?: string;
    score?: number;
    source?: string;
};

export type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    mode: Mode;
    createdAt: string;
};

type State = {
    messages: Message[];
    streaming: boolean;
    streamText: string;
    sources: Source[];
    mode: Mode;
};

type Action =
    | { type: "SET_MESSAGES"; payload: Message[] }
    | { type: "ADD_USER_MSG"; payload: Message }
    | { type: "START_STREAM"; mode: Mode }
    | { type: "APPEND_CHUNK"; chunk: string }
    | { type: "SET_SOURCES"; sources: Source[] }
    | { type: "FINISH_STREAM"; id: string }
    | { type: "SET_MODE"; mode: Mode }
    | { type: "ERROR" };

function firstUserPrompt(messages: Message[]): string {
    return (
        messages.find((m) => m.role === "user")?.content?.trim().slice(0, 120) ||
        "New chat"
    );
}

function normalizeSources(input: unknown): Source[] {
    let parsedInput = input;
    if (typeof parsedInput === "string") {
        try {
            parsedInput = JSON.parse(parsedInput);
        } catch {
            parsedInput = [];
        }
    }

    const raw = Array.isArray(input)
        ? input
        : Array.isArray(parsedInput)
          ? parsedInput
          : parsedInput && typeof parsedInput === "object" && Array.isArray((parsedInput as any).context_used)
            ? (parsedInput as any).context_used
          : [];

    const mapped: Array<Source | null> = (raw as unknown[])
        .map((item: unknown) => {
            if (!item || typeof item !== "object") return null;
            const src = item as Record<string, unknown>;
            const text = typeof src.text === "string" ? src.text : "";
            const excerpt =
                typeof src.excerpt === "string"
                    ? src.excerpt
                    : text;

            return {
                title:
                    typeof src.title === "string" && src.title.trim().length > 0
                        ? src.title
                        : typeof src.source === "string"
                          ? src.source
                          : "Source",
                excerpt,
                page: typeof src.page === "number" ? src.page : undefined,
                url: typeof src.url === "string" ? src.url : undefined,
                text: text || undefined,
                score: typeof src.score === "number" ? src.score : undefined,
                source:
                    typeof src.source === "string" ? src.source : undefined,
            } satisfies Source;
        })
        ;

    return mapped.filter((v): v is Source => v !== null);
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SET_MESSAGES":
            return { ...state, messages: action.payload };

        case "ADD_USER_MSG":
            return { ...state, messages: [...state.messages, action.payload] };

        case "START_STREAM":
            return {
                ...state,
                streaming: true,
                streamText: "",
                sources: [],
                mode: action.mode,
            };

        case "APPEND_CHUNK":
            return { ...state, streamText: state.streamText + action.chunk };

        case "SET_SOURCES":
            return { ...state, sources: action.sources };

        case "FINISH_STREAM":
            return {
                ...state,
                streaming: false,
                messages: [
                    ...state.messages,
                    {
                        id: action.id,
                        role: "assistant",
                        content: state.streamText,
                        sources: state.sources,
                        mode: state.mode,
                        createdAt: new Date().toISOString(),
                    },
                ],
                streamText: "",
                sources: [],
            };

        case "SET_MODE":
            return { ...state, mode: action.mode };

        case "ERROR":
            return { ...state, streaming: false, streamText: "" };

        default:
            return state;
    }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    conversationId: string;
    initialMessages: Message[];
    initialMode?: Mode;
    // Exposed so the page can trigger a send from the input box
    onStreamingChange?: (streaming: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatThread({
    conversationId,
    initialMessages,
    initialMode = "rag",
    onStreamingChange,
}: Props) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const [state, dispatch] = useReducer(reducer, {
        messages: initialMessages,
        streaming: false,
        streamText: "",
        sources: [],
        mode: initialMode,
    });
    const streamingRef = useRef(state.streaming);
    streamingRef.current = state.streaming;

    const abortRef = useRef<AbortController | null>(null);
    const autoScroll = useRef(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeIdRef = useRef(conversationId);
    const [historyLoading, setHistoryLoading] = useState(false);
    const historyAbortRef = useRef<AbortController | null>(null);
    const initialMessagesRef = useRef(initialMessages);
    initialMessagesRef.current = initialMessages;
    /** True while URL is still `/c/new` but we already assigned a real session id (first send). */
    const pendingNewToIdRef = useRef(false);

    // Sync route id → thread state before paint (avoids wrong-chat flash and unstable [] refs).
    useLayoutEffect(() => {
        if (activeIdRef.current === conversationId) {
            if (pendingNewToIdRef.current && conversationId !== "new") {
                pendingNewToIdRef.current = false;
            }
            return;
        }

        const prevId = activeIdRef.current;
        const ims = initialMessagesRef.current;

        if (conversationId === "new" && prevId !== "new") {
            if (pendingNewToIdRef.current) {
                return;
            }
            activeIdRef.current = "new";
            dispatch({ type: "SET_MESSAGES", payload: [] });
            dispatch({ type: "SET_MODE", mode: initialMode });
            return;
        }

        if (conversationId !== "new") {
            activeIdRef.current = conversationId;
            if (pendingNewToIdRef.current) {
                pendingNewToIdRef.current = false;
            }
            // Promoting "new" → real id after first send: keep in-memory messages.
            // Switching between two existing ids: reset and load history.
            if (prevId !== "new" && prevId !== conversationId) {
                dispatch({ type: "SET_MESSAGES", payload: ims });
            } else if (ims.length > 0) {
                dispatch({ type: "SET_MESSAGES", payload: ims });
            }
            dispatch({ type: "SET_MODE", mode: initialMode });
            setHistoryLoading(false);
        }
    }, [conversationId, initialMode]);

    // Keep in sync with client-side URL changes (sidebar/router.push to /c/new)
    useEffect(() => {
        if (!pathname) return;
        const m = pathname.match(/^\/c\/(.+)$/);
        if (!m) return;
        const idFromPath = m[1];

        // If the URL already matches active id, nothing to do
        if (idFromPath === activeIdRef.current) return;

        // If navigating to /c/new: reset to empty thread (unless we're already
        // pending a promotion from a just-created id)
        if (idFromPath === "new") {
            if (pendingNewToIdRef.current) {
                // If we are in the middle of promoting new→id, ignore the transient
                return;
            }
            activeIdRef.current = "new";
            dispatch({ type: "SET_MESSAGES", payload: [] });
            dispatch({ type: "SET_MODE", mode: initialMode });
            return;
        }

        // Navigated to a concrete id — update active id and load initial messages
        activeIdRef.current = idFromPath;
        pendingNewToIdRef.current = false;
        dispatch({ type: "SET_MESSAGES", payload: initialMessagesRef.current });
        dispatch({ type: "SET_MODE", mode: initialMode });
        setHistoryLoading(false);
    }, [pathname, initialMode]);

    const handleThreadScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;

        autoScroll.current = distanceFromBottom < 120;
    }, []);

    // Scroll to bottom on new content — only if user is at bottom
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !autoScroll.current) return;

        const behavior = state.streaming ? "auto" : "smooth";
        container.scrollTo({ top: container.scrollHeight, behavior });
    }, [state.streamText, state.messages.length, state.streaming]);

    // Notify parent of streaming state (so input can disable)
    useEffect(() => {
        onStreamingChange?.(state.streaming);
    }, [state.streaming, onStreamingChange]);

    // Load full conversation history in client using frontend-issued JWT + API key.
    useEffect(() => {
        let cancelled = false;
        const hasInitialMessages = initialMessages.length > 0;

        if (!isLoaded || hasInitialMessages || conversationId === "new") {
            return;
        }

        historyAbortRef.current?.abort();
        const ac = new AbortController();
        historyAbortRef.current = ac;

        const API_BASE =
            process.env.NEXT_PUBLIC_JHUNNU_API_URL ??
            "https://jhunnu-backend.devshakya.xyz";

        async function loadHistory() {
            setHistoryLoading(true);
            try {
                const token = await createFrontendJwtToken({
                    userId: user?.id,
                    name: user?.fullName ?? user?.firstName ?? user?.username,
                    email: user?.emailAddresses?.[0]?.emailAddress,
                });
                const apiKey = getApiKey();
                const headers: Record<string, string> = {
                    Authorization: `Bearer ${token}`,
                };
                if (apiKey) {
                    headers["x-api-key"] = apiKey;
                }

                const res = await fetch(
                    `${API_BASE}/history/${conversationId}`,
                    {
                        headers,
                        signal: ac.signal,
                    },
                );

                if (!res.ok) {
                    return;
                }

                const json = (await res.json()) as {
                    messages?: Array<{ role?: string; content?: string }>;
                };

                const mapped: Message[] = (json.messages ?? [])
                    .filter((m) => typeof m.content === "string")
                    .map((m, idx) => ({
                        id: `${conversationId}-${idx}`,
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.content ?? "",
                        mode: "rag",
                        createdAt: new Date().toISOString(),
                    }));

                if (
                    !cancelled &&
                    !ac.signal.aborted &&
                    !streamingRef.current
                ) {
                    dispatch({ type: "SET_MESSAGES", payload: mapped });
                    LocalStorageService.upsertChatHistory(
                        conversationId,
                        firstUserPrompt(mapped),
                    );
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }
                // Keep empty thread if history lookup fails.
            } finally {
                if (!cancelled && !ac.signal.aborted) {
                    setHistoryLoading(false);
                }
            }
        }

        void loadHistory();

        return () => {
            cancelled = true;
            ac.abort();
        };
    }, [conversationId, initialMessages.length, isLoaded, user]);

    // ── Send message ──────────────────────────────────────────────────────────

    const sendMessage = useCallback(
        async (text: string, mode: Mode) => {
            const rollNo = LocalStorageService.getRollNo() ?? "";
            const apiKey = getApiKey();

            if (!isLoaded) {
                toast.error("User session is still loading");
                return;
            }

            const userToken = await createFrontendJwtToken({
                userId: user?.id,
                name: user?.fullName ?? user?.firstName ?? user?.username,
                email: user?.emailAddresses?.[0]?.emailAddress,
            });
            const headers: Record<string, string> = {
                Accept: "text/event-stream",
                "Content-Type": "application/json",
                "x-roll-no": rollNo,
                Authorization: `Bearer ${userToken}`,
            };
            if (apiKey) {
                headers["x-api-key"] = apiKey;
            }

            // Cancel any in-flight request
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            // Optimistic user message
            const optimisticUserMessage: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content: text,
                mode,
                createdAt: new Date().toISOString(),
            };

            dispatch({
                type: "ADD_USER_MSG",
                payload: optimisticUserMessage,
            });

            let activeId = activeIdRef.current;
            if (activeId === "new") {
                activeId = crypto.randomUUID();
                activeIdRef.current = activeId;
                pendingNewToIdRef.current = true;
                // Avoid triggering a full route change (which shows the
                // server-side Loading component) by updating the browser
                // URL via history.replaceState. This keeps the client
                // render intact and prevents the blank/loading flash.
                try {
                    if (typeof window !== "undefined" && window.history && window.location) {
                        const newUrl = `/c/${activeId}`;
                        window.history.replaceState(null, "", newUrl);
                    } else {
                        router.replace(`/c/${activeId}`, { scroll: false });
                    }
                } catch (e) {
                    // Fallback to router.replace if anything goes wrong.
                    router.replace(`/c/${activeId}`, { scroll: false });
                }
            }

            // Keep sidebar history in sync immediately on first send.
            LocalStorageService.upsertChatHistory(activeId, text);

            dispatch({ type: "START_STREAM", mode });
            autoScroll.current = true;

            const API_BASE =
                process.env.NEXT_PUBLIC_JHUNNU_API_URL ??
                "https://jhunnu-backend.devshakya.xyz";

            const endpoint =
                mode === "rag" ? `${API_BASE}/ask` : `${API_BASE}/analyze-result`;

            const body = { question: text, session_id: activeId };

            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                    signal: abortRef.current.signal,
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail ?? `Error ${res.status}`);
                }

                const reader = res.body!.getReader();
                const decoder = new TextDecoder();
                let sseBuffer = "";
                let msgId = crypto.randomUUID();
                let pendingDataLines: string[] = [];
                let sawSseField = false;

                const appendText = (chunk: string) => {
                    if (!chunk) return;
                    dispatch({ type: "APPEND_CHUNK", chunk });
                };

                const splitLeadingJsonObject = (
                    raw: string,
                ): { jsonText: string; rest: string } | null => {
                    const input = raw.trimStart().replace(/^:\s*/, "");
                    if (!input.startsWith("{")) return null;

                    let depth = 0;
                    let inString = false;
                    let escaped = false;

                    for (let i = 0; i < input.length; i++) {
                        const ch = input[i];

                        if (escaped) {
                            escaped = false;
                            continue;
                        }

                        if (ch === "\\") {
                            escaped = true;
                            continue;
                        }

                        if (ch === '"') {
                            inString = !inString;
                            continue;
                        }

                        if (inString) continue;

                        if (ch === "{") depth++;
                        if (ch === "}") depth--;

                        if (depth === 0) {
                            return {
                                jsonText: input.slice(0, i + 1),
                                rest: input.slice(i + 1).trimStart(),
                            };
                        }
                    }

                    return null;
                };

                const appendKnownTextFields = (value: unknown): boolean => {
                    if (!value || typeof value !== "object") return false;

                    const obj = value as Record<string, unknown>;
                    const textLike = [
                        obj.text,
                        obj.delta,
                        obj.message,
                        obj.content,
                        obj.answer,
                        obj.response,
                        obj.final_answer,
                    ].find((v) => typeof v === "string" && v.length > 0);

                    if (typeof textLike === "string") {
                        appendText(textLike);
                        return true;
                    }

                    if (
                        obj.data &&
                        typeof obj.data === "object" &&
                        appendKnownTextFields(obj.data)
                    ) {
                        return true;
                    }

                    return false;
                };

                const handlePayload = (payload: string) => {
                    if (!payload || payload === "[DONE]") {
                        return;
                    }

                    try {
                        const event = JSON.parse(payload);

                        if (
                            Array.isArray(event.context_used) ||
                            Array.isArray(event.sources)
                        ) {
                            dispatch({
                                type: "SET_SOURCES",
                                sources: normalizeSources(
                                    event.sources ?? event.context_used,
                                ),
                            });
                        }

                        if (typeof event.id === "string") {
                            msgId = event.id;
                        }

                        if (
                            event.type === "result_data" &&
                            event.data !== undefined &&
                            typeof event.data !== "string"
                        ) {
                            appendText(JSON.stringify(event.data));
                            return;
                        }

                        if (appendKnownTextFields(event)) {
                            return;
                        }
                    } catch {
                        const mixed = splitLeadingJsonObject(payload);
                        if (mixed) {
                            try {
                                const parsed = JSON.parse(mixed.jsonText) as {
                                    context_used?: unknown;
                                    sources?: unknown;
                                };

                                if (
                                    parsed &&
                                    (Array.isArray(parsed.context_used) ||
                                        Array.isArray(parsed.sources))
                                ) {
                                    dispatch({
                                        type: "SET_SOURCES",
                                        sources: normalizeSources(
                                            parsed.sources ?? parsed.context_used,
                                        ),
                                    });
                                }
                            } catch {
                                // Fall through to raw text handling below.
                            }

                            if (mixed.rest) {
                                appendText(mixed.rest);
                            }
                            return;
                        }

                        const maybeJson = payload.trimStart();
                        const looksLikeJson =
                            maybeJson.startsWith("{") || maybeJson.startsWith("[");

                        if (
                            looksLikeJson &&
                            /context_used|\"sources\"|\"source\"|\"score\"/i.test(
                                payload,
                            )
                        ) {
                            return;
                        }

                        appendText(payload);
                    }
                };

                const flushPendingData = () => {
                    if (pendingDataLines.length === 0) return;
                    handlePayload(pendingDataLines.join("\n"));
                    pendingDataLines = [];
                };

                const processSseLine = (rawLine: string, hadNewline: boolean) => {
                    const line = rawLine.replace(/\r$/, "");

                    if (line === "") {
                        if (pendingDataLines.length > 0) {
                            flushPendingData();
                            return;
                        }

                        if (!sawSseField && hadNewline) {
                            appendText("\n");
                        }

                        return;
                    }

                    if (line.startsWith("data:")) {
                        sawSseField = true;
                        pendingDataLines.push(
                            line.startsWith("data: ") ? line.slice(6) : line.slice(5),
                        );
                        return;
                    }

                    if (
                        line.startsWith(":") ||
                        line.startsWith("event:") ||
                        line.startsWith("id:") ||
                        line.startsWith("retry:")
                    ) {
                        sawSseField = true;
                        return;
                    }

                    flushPendingData();
                    handlePayload(hadNewline ? `${line}\n` : line);
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    sseBuffer += decoder.decode(value, { stream: true });
                    const lines = sseBuffer.split("\n");
                    sseBuffer = lines.pop() ?? "";

                    lines.forEach((line) => processSseLine(line, true));
                }

                const remaining = sseBuffer;
                if (remaining) {
                    processSseLine(remaining, false);
                }

                flushPendingData();

                reader.releaseLock();
                dispatch({ type: "FINISH_STREAM", id: msgId });
            } catch (err: any) {
                if (err.name === "AbortError") return;
                dispatch({ type: "ERROR" });
                toast.error("Response failed", {
                    description: err.message.includes("401")
                        ? "Invalid auth token — update it in the sidebar."
                        : (err.message ?? "Something went wrong."),
                });
            }
        },
        [conversationId, user, isLoaded],
    );

    const stopStream = useCallback(() => {
        abortRef.current?.abort();
        dispatch({ type: "ERROR" });
    }, []);

    // Expose sendMessage and stopStream via ref for parent page
    // (parent wires input box → this function)
    useEffect(() => {
        (window as any).__chatSend = sendMessage;
        (window as any).__chatStop = stopStream;
    }, [sendMessage, stopStream]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleThreadScroll}
            className="flex flex-col w-full h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
            {/* Empty / new chat: empty state (never block on history). */}
            {conversationId === "new" && state.messages.length === 0 && !state.streaming ? (
                <div className="w-full h-full max-w-187.5 mx-auto px-4 py-6">
                    <ChatEmptyState
                        onSelect={(prompt) => {
                            void sendMessage(prompt, state.mode);
                        }}
                    />
                </div>
            ) : state.messages.length === 0 &&
              !state.streaming &&
              historyLoading &&
              conversationId !== "new" ? (
                // Full-screen loader only when we have nothing to show yet
                <div className="flex items-center justify-center w-full h-full">
                    <Loader />
                </div>
            ) : (
                <div className="flex flex-col w-full max-w-187.5 mx-auto px-4 py-6 gap-1">
                    {state.messages.map((msg) =>
                        msg.role === "user" ? (
                            <UserMessage key={msg.id} content={msg.content} />
                        ) : (
                            <AssistantMessage
                                key={msg.id}
                                content={msg.content}
                                sources={msg.sources}
                                mode={msg.mode}
                                isStreaming={false}
                            />
                        ),
                    )}

                    {state.streaming && (
                        <>
                            {state.streamText === "" ? (
                                <TypingIndicator mode={state.mode} />
                            ) : (
                                <AssistantMessage
                                    content={state.streamText}
                                    sources={state.sources}
                                    mode={state.mode}
                                    isStreaming
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// Export sendMessage so page can call it from the input
export type { Props as ChatThreadProps };
