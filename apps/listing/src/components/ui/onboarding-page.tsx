"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { Input } from "./input";
import { Spinner } from "./spinner";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingPageProps {
    userEmail: string;
}

export function OnboardingPage({ userEmail }: OnboardingPageProps) {
    const [rollNo, setRollNo] = useState("");
    const [turnstileReady, setTurnstileReady] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const onboardingMutation = useOnboarding();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rollNo) {
            toast.error("Roll number required.", {
                description: "Please enter your 13-digit roll number.",
            });
            return;
        }

        if (!/^[0-9]{13}$/.test(rollNo)) {
            toast.error("Invalid roll number", {
                description: "Roll number must be exactly 13 digits.",
            });
            return;
        }

        if (!turnstileToken) {
            toast.error("Please complete the verification.", {
                description: "Verification is required to continue.",
            });
            return;
        }

        // Submit with the verified token
        onboardingMutation.mutate({ rollNo });
    };

    const handleTurnstileVerify = (token: string) => {
        setTurnstileToken(token);
        console.log("Turnstile token received:", token);
    };

    return (
        <main className="relative md:h-screen md:overflow-hidden bg-black lg:grid lg:grid-cols-2">
            {/* Left side visual */}
            <div className="bg-transparent relative hidden h-full flex-col border-r p-10 lg:flex">
                <img
                    src="https://cdn2.devshakya.xyz/landing/sentrabg.png"
                    alt="Moon background"
                    className="absolute inset-0 w-full h-full opacity-20 blur-[2px] object-cover"
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-background to-transparent" />
                <div className="z-10 flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="#ffffff"
                        viewBox="0 0 120 120"
                        className="size-8"
                    >
                        <path
                            fill="#ffffff"
                            d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                        />
                    </svg>
                    <p className="text-xl font-semibold">Singularity</p>
                </div>

                <div className="z-10 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl">
                            “This Platform has helped me save time and verify
                            students faster than ever before.”
                        </p>
                        <footer className="text-sm font-medium">
                            - Akshay Kumar, Senior QA Automation Engineer
                        </footer>
                    </blockquote>
                </div>

                <div className="absolute inset-0">
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            </div>

            {/* Right side form */}
            <div className="relative flex min-h-screen flex-col justify-center p-4">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate -z-10 opacity-60"
                />

                <div className="mx-auto space-y-4 sm:w-sm">
                    <div className="flex items-center gap-2 lg:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 120 120"
                            className="size-6"
                        >
                            <path d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60" />
                        </svg>
                        <p className="text-xl font-semibold">Singularity</p>
                    </div>

                    <div className="flex flex-col space-y-1">
                        <h1 className="font-heading text-2xl font-bold tracking-wide">
                            Complete Your Profile
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Just one more step to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Email Address
                            </label>
                            <Input
                                value={userEmail}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Roll Number
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter your roll number"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                required
                                className="uppercase"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your AKTU roll number (e.g.,
                                2300680100100)
                            </p>
                        </div>

                        {/* Visible Turnstile Widget */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Verification
                            </label>
                            <ManagedTurnstile
                                onReady={() => setTurnstileReady(true)}
                                onVerify={handleTurnstileVerify}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                !turnstileReady ||
                                !turnstileToken ||
                                onboardingMutation.isPending
                            }
                        >
                            {onboardingMutation.isPending ? (
                                <>
                                    <Spinner className="size-4 me-2" />
                                    <span>Setting up your account...</span>
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}

/* Background Animation */
function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="pointer-events-none absolute inset-0">
            <svg className="h-full w-full" viewBox="0 0 696 316" fill="none">
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        initial={{ pathLength: 0.3, opacity: 0.4 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 22 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

/* Managed Turnstile Component - Visible Widget with Auto-execution */
function ManagedTurnstile({
    onVerify,
    onReady,
}: {
    onVerify: (token: string) => void;
    onReady: () => void;
}) {
    const onVerifyRef = React.useRef(onVerify);
    const widgetIdRef = React.useRef<string | null>(null);

    // Keep onVerify ref updated
    React.useEffect(() => {
        onVerifyRef.current = onVerify;
    }, [onVerify]);

    React.useEffect(() => {
        // Check if script already loaded
        let script = document.querySelector(
            'script[src*="challenges.cloudflare.com/turnstile"]'
        ) as HTMLScriptElement;

        if (!script) {
            script = document.createElement("script");
            script.src =
                "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        const initTurnstile = () => {
            const ts = (window as any).turnstile;

            if (!ts) {
                console.error("Turnstile failed to load");
                toast.error("Failed to load verification");
                return;
            }

            try {
                // Use test sitekey for development (always passes)
                // Production sitekey: 0x4AAAAAACAtfCYbnqYoa8pu
                const sitekey =
                    process.env.NODE_ENV === "production"
                        ? "0x4AAAAAACAtfCYbnqYoa8pu"
                        : "1x00000000000000000000AA"; // Test key - always passes

                // Render in managed mode - Visible widget with automatic execution
                widgetIdRef.current = ts.render("#cf-turnstile", {
                    sitekey,
                    size: "flexible",
                    theme: "auto",
                    // No execution mode = auto-executes immediately
                    callback: (token: string) => {
                        console.log("Turnstile verification successful");
                        onVerifyRef.current(token);
                    },
                    "error-callback": (errorCode: string) => {
                        console.error("Turnstile error:", errorCode);
                        toast.error("Verification failed", {
                            description: `Error: ${errorCode}. Please try again.`,
                        });
                    },
                    "expired-callback": () => {
                        console.warn("Turnstile token expired");
                        toast.error("Verification expired", {
                            description: "Please submit again.",
                        });
                    },
                    "timeout-callback": () => {
                        console.warn("Turnstile timeout");
                        toast.error("Verification timeout", {
                            description: "Please try again.",
                        });
                    },
                });

                console.log(
                    "Turnstile widget rendered (Managed Mode):",
                    widgetIdRef.current
                );
                onReady();
            } catch (error) {
                console.error("Turnstile render error:", error);
                toast.error("Failed to initialize verification");
            }
        };

        if ((window as any).turnstile) {
            initTurnstile();
        } else {
            script.addEventListener("load", initTurnstile);
            script.addEventListener("error", () => {
                console.error("Failed to load Turnstile script");
                toast.error("Failed to load verification");
            });
        }

        return () => {
            const ts = (window as any).turnstile;
            if (ts && widgetIdRef.current) {
                try {
                    ts.remove(widgetIdRef.current);
                    console.log("Turnstile widget removed");
                } catch (err) {
                    console.warn("Error removing Turnstile:", err);
                }
            }
        };
    }, [onReady]);

    return <div id="cf-turnstile" />;
}
