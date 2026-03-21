"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
    ArrowUp,
    Square,
    Mic,
    MicOff,
    BookOpen,
    BarChart2,
    StopCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── SpeechRecognition type declarations (not in default TS lib) ───────────────

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition?: new () => ISpeechRecognition;
        webkitSpeechRecognition?: new () => ISpeechRecognition;
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Mode = "rag" | "results";

interface Props {
    onSend: (message: string, mode: Mode) => void;
    onStop?: () => void;
    isStreaming?: boolean;
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    className?: string;
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
    return <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />;
}

// ── Voice hook ────────────────────────────────────────────────────────────────

function useVoiceToText(onTranscript: (text: string) => void) {
    const [listening, setListening] = useState(false);
    const [supported, setSupported] = useState(false);
    const recRef = useRef<ISpeechRecognition | null>(null);

    useEffect(() => {
        const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        if (!SR) return;
        setSupported(true);

        const r = new SR();
        r.continuous = false;
        r.interimResults = true;
        r.lang = "en-IN";

        r.onresult = (e: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += t;
                else interim += t;
            }
            onTranscript(final || interim);
        };

        r.onerror = (e: SpeechRecognitionErrorEvent) => {
            if (e.error === "not-allowed") {
                toast.error("Microphone access denied", {
                    description: "Allow microphone in your browser settings.",
                });
            } else if (e.error !== "aborted") {
                toast.error("Voice recognition failed", {
                    description: e.error,
                });
            }
            setListening(false);
        };

        r.onend = () => setListening(false);
        recRef.current = r;
    }, [onTranscript]);

    const toggle = useCallback(() => {
        if (!supported) {
            toast.error("Voice not supported", {
                description: "Use Chrome or Edge for voice input.",
            });
            return;
        }
        if (listening) {
            recRef.current?.stop();
            setListening(false);
        } else {
            try {
                recRef.current?.start();
                setListening(true);
            } catch {}
        }
    }, [listening, supported]);

    const stop = useCallback(() => {
        recRef.current?.stop();
        setListening(false);
    }, []);

    return { listening, supported, toggle, stop };
}

// ── Voice-to-send timer bar ───────────────────────────────────────────────────

function VoiceTimer({ onSend }: { onSend: (duration: number) => void }) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const fmt = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="flex items-center gap-3 px-1 pb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div className="flex items-center gap-0.5 h-5 flex-1">
                {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-0.5 rounded-full bg-red-400/70"
                        animate={{ scaleY: [1, Math.random() * 2.5 + 1, 1] }}
                        transition={{
                            repeat: Infinity,
                            duration: 0.4 + Math.random() * 0.4,
                            delay: i * 0.04,
                            ease: "easeInOut",
                        }}
                        style={{ height: 14, transformOrigin: "center" }}
                    />
                ))}
            </div>
            <span className="font-mono text-sm text-white/60 shrink-0">
                {fmt(seconds)}
            </span>
            <button
                onClick={() => onSend(seconds)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
            >
                <StopCircle className="w-4 h-4" />
                Send
            </button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatInputBox({
    onSend,
    onStop,
    isStreaming = false,
    mode,
    onModeChange,
    className,
}: Props) {
    const [input, setInput] = useState("");
    const [voiceSending, setVoiceSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasContent = input.trim().length > 0;

    const handleTranscript = useCallback((text: string) => {
        setInput((prev) => {
            const base = prev.trimEnd();
            return base ? `${base} ${text}` : text;
        });
    }, []);

    const {
        listening,
        supported,
        toggle: toggleVoice,
        stop: stopVoice,
    } = useVoiceToText(handleTranscript);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 240) + "px";
    }, [input]);

    useEffect(() => {
        if (!isStreaming) textareaRef.current?.focus();
    }, [isStreaming]);

    const handleSubmit = useCallback(() => {
        const text = input.trim();
        if (!text || isStreaming) return;
        if (listening) stopVoice();
        onSend(text, mode);
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    }, [input, isStreaming, mode, onSend, listening, stopVoice]);

    function handleVoiceSend(duration: number) {
        setVoiceSending(false);
        stopVoice();
        onSend(`[Voice message — ${duration}s]`, mode);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Safe mode change — guards against prop not being a function
    const handleModeChange = useCallback(
        (m: Mode) => {
            if (typeof onModeChange === "function") onModeChange(m);
        },
        [onModeChange],
    );

    const isRag = mode === "rag";
    const isResults = mode === "results";

    const placeholder = listening
        ? "Listening... speak now"
        : voiceSending
          ? "Recording voice message..."
          : isRag
            ? "Ask anything from your course material..."
            : "Ask about your grades, attendance, or standing...";

    // ── Outer glow color reacts to mode / state ───────────────────────────────
    const outerGlow =
        listening || voiceSending
            ? "bg-red-500/25"
            : isStreaming
              ? "bg-primary/20"
              : isRag
                ? "bg-blue-500/20"
                : "bg-emerald-500/20";

    const innerBorderColor =
        listening || voiceSending
            ? "border-red-500/40"
            : isStreaming
              ? "border-primary/30"
              : isRag
                ? "border-blue-500/25"
                : "border-emerald-500/25";

    return (
        // ── Outer div — 3px padding all sides acts as a colored border glow ──────
        <div
            className={cn(
                "rounded-[22px] p-[3px] transition-all duration-500",
                outerGlow,
                className,
            )}
        >
            {/* Inner box */}
            <div
                className={cn(
                    "rounded-[19px] border bg-[#1f1f1f] p-2 md:p-3",
                    "shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
                    "transition-all duration-300",
                    innerBorderColor,
                )}
            >
                {/* Voice-to-send recording UI */}
                <AnimatePresence>
                    {voiceSending && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <VoiceTimer onSend={handleVoiceSend} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Voice-to-text listening indicator */}
                <AnimatePresence>
                    {listening && !voiceSending && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 px-1 pb-2 overflow-hidden"
                        >
                            <div className="flex items-center gap-0.5 h-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-0.5 rounded-full bg-red-400"
                                        animate={{ scaleY: [1, 2.5, 1] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 0.6,
                                            delay: i * 0.1,
                                            ease: "easeInOut",
                                        }}
                                        style={{
                                            height: 12,
                                            transformOrigin: "center",
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-red-400 font-medium">
                                Listening
                            </span>
                            <span className="text-xs text-gray-500">
                                · tap mic to stop
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Textarea */}
                {!voiceSending && (
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isStreaming}
                        placeholder={placeholder}
                        rows={1}
                        className={cn(
                            "w-full bg-transparent px-1 py-1 text-[15px] text-gray-100",
                            "placeholder:text-gray-500 resize-none outline-none border-none",
                            "min-h-[44px] max-h-[240px] overflow-y-auto leading-relaxed",
                            "disabled:opacity-60 disabled:cursor-not-allowed",
                            "[&::-webkit-scrollbar]:w-1.5",
                            "[&::-webkit-scrollbar-thumb]:rounded-full",
                            "[&::-webkit-scrollbar-thumb]:bg-white/10",
                            "[&::-webkit-scrollbar-track]:bg-transparent",
                            listening && "placeholder:text-red-400/50",
                        )}
                    />
                )}

                {/* Bottom bar */}
                <div className="flex items-center justify-between pt-2 px-1">
                    {/* Mode toggles */}
                    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        {/* RAG Search */}
                        <button
                            type="button"
                            onClick={() => handleModeChange("rag")}
                            disabled={isStreaming}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                                "transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
                                isRag
                                    ? "bg-blue-500/20 text-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.35)]"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
                            )}
                        >
                            <motion.div
                                animate={{
                                    rotate: isRag ? 360 : 0,
                                    scale: isRag ? 1.1 : 1,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 25,
                                }}
                            >
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            </motion.div>

                            {isRag ? (
                                <motion.span
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "auto", opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    RAG search
                                </motion.span>
                            ) : (
                                <span>RAG search</span>
                            )}
                        </button>

                        <Divider />

                        {/* Result Analyze */}
                        <button
                            type="button"
                            onClick={() => handleModeChange("results")}
                            disabled={isStreaming}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                                "transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
                                isResults
                                    ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
                            )}
                        >
                            <motion.div
                                animate={{
                                    rotate: isResults ? 360 : 0,
                                    scale: isResults ? 1.1 : 1,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 25,
                                }}
                            >
                                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                            </motion.div>

                            {isResults ? (
                                <motion.span
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "auto", opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    Result analyze
                                </motion.span>
                            ) : (
                                <span>Result analyze</span>
                            )}
                        </button>
                    </div>

                    {/* Right: mic + send/stop */}
                    <div className="flex items-center gap-1.5">
                        {/* Mic */}
                        {supported && !isStreaming && (
                            <motion.button
                                type="button"
                                onClick={() => {
                                    if (voiceSending) {
                                        setVoiceSending(false);
                                        stopVoice();
                                    } else if (hasContent) {
                                        toggleVoice();
                                    } else {
                                        setVoiceSending(true);
                                    }
                                }}
                                whileTap={{ scale: 0.88 }}
                                title={
                                    voiceSending
                                        ? "Cancel voice message"
                                        : listening
                                          ? "Stop listening"
                                          : hasContent
                                            ? "Voice to text"
                                            : "Send voice message"
                                }
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                                    listening || voiceSending
                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200",
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {listening || voiceSending ? (
                                        <motion.div
                                            key="active"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.12 }}
                                        >
                                            <MicOff className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.12 }}
                                        >
                                            <Mic className="w-4 h-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        )}

                        {/* Send / Stop */}
                        <motion.button
                            type="button"
                            onClick={isStreaming ? onStop : handleSubmit}
                            disabled={!isStreaming && !hasContent}
                            whileTap={{ scale: 0.88 }}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                                isStreaming || hasContent
                                    ? "bg-white text-[#1f1f1f] hover:bg-white/90"
                                    : "bg-white/10 text-gray-600 cursor-not-allowed",
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {isStreaming ? (
                                    <motion.div
                                        key="stop"
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.7, opacity: 0 }}
                                        transition={{ duration: 0.12 }}
                                    >
                                        <Square className="w-3.5 h-3.5 fill-current" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="send"
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.7, opacity: 0 }}
                                        transition={{ duration: 0.12 }}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
