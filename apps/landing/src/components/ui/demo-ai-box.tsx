"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
    ArrowUp,
    Square,
    StopCircle,
    Mic,
    Globe,
    BrainCog,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

// FIX 1: Proper SpeechRecognition type declarations instead of `any`
// The Web Speech API is not in the default TS lib, so we declare it manually.
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

// ── Web Speech API Hook ───────────────────────────────────────────────────────

// FIX 2: Replace `any` with proper ISpeechRecognition type on the ref.
// FIX 3: Use `useCallback` with stable deps so consumers don't get new function
//         references on every render — prevents VoiceRecorder's effect from
//         re-running unnecessarily.
function useVoiceToText(lang = "en-IN") {
    const recognitionRef = React.useRef<ISpeechRecognition | null>(null);
    // Tracks whether recognition is actually running so we never call
    // start() on an already-started instance (InvalidStateError).
    const isListeningRef = React.useRef(false);
    const [transcript, setTranscript] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            console.log("Speech-to-text transcript:", currentTranscript);
            setTranscript(currentTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // "aborted" fires when we call stop() ourselves — not an error
            if (event.error !== "aborted") {
                console.error("Speech recognition error:", event.error);
            }
            isListeningRef.current = false;
        };

        // Keep the ref in sync so startListening guard is accurate
        recognition.onend = () => {
            isListeningRef.current = false;
        };

        recognitionRef.current = recognition;
    }, [lang]);

    const startListening = React.useCallback(() => {
        // Guard: don't call start() if already running
        if (!recognitionRef.current || isListeningRef.current) return;
        setTranscript("");
        try {
            recognitionRef.current.start();
            isListeningRef.current = true;
        } catch (e) {
            console.error("Failed to start listening", e);
            isListeningRef.current = false;
        }
    }, []);

    const stopListening = React.useCallback(() => {
        if (!recognitionRef.current || !isListeningRef.current) return;
        try {
            recognitionRef.current.stop();
            // isListeningRef will be set false by onend
        } catch (e) {
            console.error("Failed to stop listening", e);
            isListeningRef.current = false;
        }
    }, []);

    return { transcript, startListening, stopListening, setTranscript };
}

// ── Utility ───────────────────────────────────────────────────────────────────

const cn = (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" ");

// FIX 5: Guard document access — this runs at module parse time in SSR/Next.js
//         and would throw "document is not defined". Wrap in typeof check.
if (
    typeof document !== "undefined" &&
    !document.getElementById("prompt-input-styles")
) {
    const styles = `
      *:focus-visible {
        outline-offset: 0 !important;
        --ring-offset: 0 !important;
      }
      textarea::-webkit-scrollbar { width: 6px; }
      textarea::-webkit-scrollbar-track { background: transparent; }
      textarea::-webkit-scrollbar-thumb { background-color: #444444; border-radius: 3px; }
      textarea::-webkit-scrollbar-thumb:hover { background-color: #555555; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.id = "prompt-input-styles";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => (
        <textarea
            className={cn(
                "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none scrollbar-thin scrollbar-thumb-[#444444] scrollbar-track-transparent hover:scrollbar-thumb-[#555555]",
                className,
            )}
            ref={ref}
            rows={1}
            {...props}
        />
    ),
);
Textarea.displayName = "Textarea";

// ── Tooltip ───────────────────────────────────────────────────────────────────

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            "z-50 overflow-hidden rounded-md border border-[#333333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
        )}
        {...props}
    />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variantClasses = {
            default: "bg-white hover:bg-white/80 text-black",
            outline:
                "border border-[#444444] bg-transparent hover:bg-[#3A3A40]",
            ghost: "bg-transparent hover:bg-[#3A3A40]",
        };
        const sizeClasses = {
            default: "h-10 px-4 py-2",
            sm: "h-8 px-3 text-sm",
            lg: "h-12 px-6",
            icon: "h-8 w-8 rounded-full aspect-[1/1]",
        };
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    variantClasses[variant],
                    sizeClasses[size],
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

// ── VoiceRecorder ─────────────────────────────────────────────────────────────

// FIX 6: Removed `time`, `onStartRecording`, `onStopRecording` from useEffect
//         deps. These caused the effect to re-run on every tick, repeatedly
//         firing onStopRecording and resetting the timer mid-recording.
// FIX 7: Use a ref for elapsed time so onStopRecording always gets the correct
//         final value, not a stale closure value from the last render.
interface VoiceRecorderProps {
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: (duration: number) => void;
    visualizerBars?: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    isRecording,
    onStartRecording,
    onStopRecording,
    visualizerBars = 32,
}) => {
    const [time, setTime] = React.useState(0);
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = React.useRef(0);

    // Keep callbacks in refs so the effect doesn't need them as deps
    const onStartRef = React.useRef(onStartRecording);
    const onStopRef = React.useRef(onStopRecording);
    React.useEffect(() => {
        onStartRef.current = onStartRecording;
    }, [onStartRecording]);
    React.useEffect(() => {
        onStopRef.current = onStopRecording;
    }, [onStopRecording]);

    React.useEffect(() => {
        if (isRecording) {
            elapsedRef.current = 0;
            setTime(0);
            onStartRef.current();
            timerRef.current = setInterval(() => {
                elapsedRef.current += 1;
                setTime(elapsedRef.current);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (elapsedRef.current > 0) {
                onStopRef.current(elapsedRef.current);
                elapsedRef.current = 0;
                setTime(0);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isRecording]); // only isRecording — intentional

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full transition-all duration-300 py-3",
                isRecording ? "opacity-100" : "opacity-0 h-0",
            )}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-sm text-white/80">
                    {formatTime(time)}
                </span>
            </div>
            <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
                {[...Array(visualizerBars)].map((_, i) => (
                    <div
                        key={i}
                        className="w-0.5 rounded-full bg-white/50 animate-pulse"
                        style={{
                            height: `${Math.max(15, Math.random() * 100)}%`,
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: `${0.5 + Math.random() * 0.5}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

// ── PromptInput context + primitives ──────────────────────────────────────────

interface PromptInputContextType {
    isLoading: boolean;
    value: string;
    setValue: (value: string) => void;
    maxHeight: number | string;
    onSubmit?: () => void;
    disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
    isLoading: false,
    value: "",
    setValue: () => {},
    maxHeight: 150,
    onSubmit: undefined,
    disabled: false,
});
function usePromptInput() {
    const context = React.useContext(PromptInputContext);
    if (!context)
        throw new Error("usePromptInput must be used within a PromptInput");
    return context;
}

interface PromptInputProps {
    isLoading?: boolean;
    value?: string;
    onValueChange?: (value: string) => void;
    maxHeight?: number | string;
    onSubmit?: () => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
    (
        {
            className,
            isLoading = false,
            maxHeight = 150,
            value,
            onValueChange,
            onSubmit,
            children,
            disabled = false,
            onDragOver,
            onDragLeave,
            onDrop,
        },
        ref,
    ) => {
        const [internalValue, setInternalValue] = React.useState(value || "");

        // FIX 8: Sync internal state when controlled `value` prop changes externally
        //         (e.g. parent clears input after submit)
        React.useEffect(() => {
            if (value !== undefined) setInternalValue(value);
        }, [value]);

        const handleChange = (newValue: string) => {
            setInternalValue(newValue);
            onValueChange?.(newValue);
        };

        return (
            <TooltipProvider>
                <PromptInputContext.Provider
                    value={{
                        isLoading,
                        value: value ?? internalValue,
                        setValue: onValueChange ?? handleChange,
                        maxHeight,
                        onSubmit,
                        disabled,
                    }}
                >
                    <div
                        ref={ref}
                        className={cn(
                            "rounded-t-3xl border-t border-l border-r border-[#444444] bg-[#1F2023] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300",
                            isLoading && "border-red-500/70",
                            className,
                        )}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                        {children}
                    </div>
                </PromptInputContext.Provider>
            </TooltipProvider>
        );
    },
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps {
    disableAutosize?: boolean;
    placeholder?: string;
}
const PromptInputTextarea: React.FC<
    PromptInputTextareaProps & React.ComponentProps<typeof Textarea>
> = ({
    className,
    onKeyDown,
    disableAutosize = false,
    placeholder,
    ...props
}) => {
    const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (disableAutosize || !textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
            typeof maxHeight === "number"
                ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
                : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
    }, [value, maxHeight, disableAutosize]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
        }
        onKeyDown?.(e);
    };

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn("text-base", className)}
            disabled={disabled}
            placeholder={placeholder}
            {...props}
        />
    );
};

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {}
const PromptInputActions: React.FC<PromptInputActionsProps> = ({
    children,
    className,
    ...props
}) => (
    <div className={cn("flex items-center gap-2", className)} {...props}>
        {children}
    </div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
    tooltip: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    side?: "top" | "bottom" | "left" | "right";
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
    tooltip,
    children,
    className,
    side = "top",
    ...props
}) => {
    const { disabled } = usePromptInput();
    return (
        <Tooltip {...props}>
            <TooltipTrigger asChild disabled={disabled}>
                {children}
            </TooltipTrigger>
            <TooltipContent side={side} className={className}>
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
};

// ── CustomDivider ─────────────────────────────────────────────────────────────

const CustomDivider: React.FC = () => (
    <div className="relative h-6 w-[1.5px] mx-1">
        <div
            className="absolute inset-0 bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent rounded-full"
            style={{
                clipPath:
                    "polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)",
            }}
        />
    </div>
);

// ── Main PromptInputBox ───────────────────────────────────────────────────────

interface PromptInputBoxProps {
    onSend?: (message: string) => void;
    onModeChange?: (mode: "rag" | "results") => void;
    isLoading?: boolean;
    isStreaming?: boolean;
    onStop?: () => void;
    placeholder?: string;
    className?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export const PromptInputBox = React.forwardRef(
    (props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
        const {
            onSend = () => {},
            onModeChange,
            isLoading = false,
            isStreaming = false,
            onStop = () => {},
            placeholder = "Type your message here...",
            className,
            value: controlledValue,
            onValueChange: onControlledChange,
        } = props;

        const [internalInput, setInternalInput] = React.useState("");
        
        const input = controlledValue !== undefined ? controlledValue : internalInput;
        const setInput = onControlledChange !== undefined ? onControlledChange : setInternalInput;

        const [isRecording, setIsRecording] = React.useState(false);
        const { transcript, startListening, stopListening } =
            useVoiceToText("en-IN");
        const [showSearch, setShowSearch] = React.useState(true);
        const [showThink, setShowThink] = React.useState(false);
        const promptBoxRef = React.useRef<HTMLDivElement>(null);

        const handleToggleChange = (value: string) => {
            if (value === "search") {
                setShowSearch(true);
                setShowThink(false);
                onModeChange?.("rag");
            } else if (value === "think") {
                setShowThink(true);
                setShowSearch(false);
                onModeChange?.("results");
            }
        };

        const handleSubmit = () => {
            if (input.trim()) {
                onSend(input.trim());
                setInput("");
            }
        };

        // FIX 9: Wrap in useCallback with stable deps so VoiceRecorder's useEffect
        //         doesn't see new function references on every render.
        const handleStartRecording = React.useCallback(() => {
            startListening();
        }, [startListening]);

        // FIX 10: Read transcript from closure at stop time. The previous version
        //          had a stale closure bug — transcript captured at callback creation
        //          was always "". Using a ref snapshot fixes this.
        const transcriptRef = React.useRef(transcript);
        React.useEffect(() => {
            transcriptRef.current = transcript;
        }, [transcript]);

        const handleStopRecording = React.useCallback(
            (duration: number) => {
                console.log(`Stopped recording after ${duration} seconds`);
                setIsRecording(false);
                stopListening();
                // FIX 10 continued: read from ref, not stale closure
                const finalTranscript = transcriptRef.current.trim();
                if (finalTranscript) {
                    const prev = input;
                    setInput(prev ? `${prev} ${finalTranscript}` : finalTranscript);
                }
            },
            [stopListening],
            // transcript intentionally excluded — we read it via ref above
        );

        const hasContent = input.trim() !== "";

        const innerBorderColor = isRecording
            ? "border-red-500/40"
            : showSearch
              ? "border-blue-500/25"
              : showThink
                ? "border-purple-500/25"
                : "border-[#444444]";

        return (
            <div className="rounded-t-3xl p-1.5 pb-0 transition-all duration-500 bg-accent">
                <PromptInput
                    value={input}
                    onValueChange={setInput}
                    isLoading={isLoading || isStreaming}
                    onSubmit={handleSubmit}
                    className={cn(
                        "w-full bg-[#1F2023] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300 ease-in-out",
                        innerBorderColor,
                        className,
                    )}
                    disabled={isLoading || isStreaming || isRecording}
                    ref={ref || promptBoxRef}
                >
                    <div
                        className={cn(
                            "transition-all duration-300",
                            isRecording
                                ? "h-0 overflow-hidden opacity-0"
                                : "opacity-100",
                        )}
                    >
                        <PromptInputTextarea
                            placeholder={
                                showSearch
                                    ? "Ask anything from your course material..."
                                    : showThink
                                      ? "Ask about your SGPAs and carry overs..."
                                      : placeholder
                            }
                            className="text-base"
                        />
                    </div>

                    {isRecording && (
                        <VoiceRecorder
                            isRecording={isRecording}
                            onStartRecording={handleStartRecording}
                            onStopRecording={handleStopRecording}
                        />
                    )}

                    <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
                        <div
                            className={cn(
                                "flex items-center gap-1 transition-opacity duration-300",
                                isRecording
                                    ? "opacity-0 invisible h-0"
                                    : "opacity-100 visible",
                            )}
                        >
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    onClick={() => handleToggleChange("search")}
                                    className={cn(
                                        "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                                        showSearch
                                            ? "bg-[#1EAEDB]/15 border-[#1EAEDB] text-[#1EAEDB]"
                                            : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]",
                                    )}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        <motion.div
                                            animate={{
                                                rotate: showSearch ? 360 : 0,
                                                scale: showSearch ? 1.1 : 1,
                                            }}
                                            whileHover={{
                                                rotate: showSearch ? 360 : 15,
                                                scale: 1.1,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 10,
                                                },
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 25,
                                            }}
                                        >
                                            <Globe
                                                className={cn(
                                                    "w-4 h-4",
                                                    showSearch
                                                        ? "text-[#1EAEDB]"
                                                        : "text-inherit",
                                                )}
                                            />
                                        </motion.div>
                                    </div>
                                    <AnimatePresence>
                                        {showSearch && (
                                            <motion.span
                                                initial={{
                                                    width: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    width: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-xs overflow-hidden whitespace-nowrap text-[#1EAEDB] flex-shrink-0"
                                            >
                                                Search
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>

                                <CustomDivider />

                                <button
                                    type="button"
                                    onClick={() => handleToggleChange("think")}
                                    className={cn(
                                        "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                                        showThink
                                            ? "bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#8B5CF6]"
                                            : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]",
                                    )}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        <motion.div
                                            animate={{
                                                rotate: showThink ? 360 : 0,
                                                scale: showThink ? 1.1 : 1,
                                            }}
                                            whileHover={{
                                                rotate: showThink ? 360 : 15,
                                                scale: 1.1,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 10,
                                                },
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 25,
                                            }}
                                        >
                                            <BrainCog
                                                className={cn(
                                                    "w-4 h-4",
                                                    showThink
                                                        ? "text-[#8B5CF6]"
                                                        : "text-inherit",
                                                )}
                                            />
                                        </motion.div>
                                    </div>
                                    <AnimatePresence>
                                        {showThink && (
                                            <motion.span
                                                initial={{
                                                    width: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    width: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-xs overflow-hidden whitespace-nowrap text-[#8B5CF6] flex-shrink-0"
                                            >
                                                Results
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>

                        {/* FIX 11: Button is never disabled — must always be clickable to
                                   stop streaming/loading even when input is empty. */}
                        <PromptInputAction
                            tooltip={
                                isStreaming || isLoading
                                    ? "Stop generation"
                                    : isRecording
                                      ? "Stop recording"
                                      : hasContent
                                        ? "Send message"
                                        : "Voice message"
                            }
                        >
                            <Button
                                variant="default"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full transition-all duration-200",
                                    isRecording
                                        ? "bg-transparent hover:bg-gray-600/30 text-red-500 hover:text-red-400"
                                        : hasContent || isStreaming || isLoading
                                        ? "bg-white hover:bg-white/80 text-[#1F2023]"
                                        : "bg-transparent hover:bg-gray-600/30 text-[#9CA3AF] hover:text-[#D1D5DB]",
                                )}
                                onClick={() => {
                                    if (isStreaming || isLoading) {
                                        onStop();
                                    } else if (isRecording) {
                                        setIsRecording(false);
                                    } else if (hasContent) {
                                        handleSubmit();
                                    } else {
                                        setIsRecording(true);
                                    }
                                }}
                                disabled={false}
                            >
                                {isStreaming || isLoading ? (
                                    <Square className="h-4 w-4 fill-[#1F2023] animate-pulse" />
                                ) : isRecording ? (
                                    <StopCircle className="h-5 w-5 text-red-500" />
                                ) : hasContent ? (
                                    <ArrowUp className="h-4 w-4 text-[#1F2023]" />
                                ) : (
                                    <Mic className="h-5 w-5 text-[#1F2023] transition-colors" />
                                )}
                            </Button>
                        </PromptInputAction>
                    </PromptInputActions>
                </PromptInput>
            </div>
        );
    },
);
PromptInputBox.displayName = "PromptInputBox";
