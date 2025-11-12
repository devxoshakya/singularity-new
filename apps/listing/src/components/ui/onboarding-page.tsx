"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Spinner } from "./spinner";

interface OnboardingPageProps {
    userEmail: string;
}

export function OnboardingPage({ userEmail }: OnboardingPageProps) {
    const router = useRouter();
    const [rollNo, setRollNo] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!rollNo || !turnstileToken) {
            return;
        }

        setIsSubmitting(true);
        
        try {
            // TODO: Add your API call here to save user data
            // await saveUserOnboarding({ email: userEmail, rollNo, turnstileToken });
            
            // Redirect to pricing page
            router.push("/pricing" as any);
        } catch (error) {
            console.error("Onboarding error:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative md:h-screen md:overflow-hidden bg-black lg:grid lg:grid-cols-2">
            <div className="bg-transparent relative hidden h-full flex-col border-r p-10 lg:flex">
                <img
                    src="https://cdn2.devshakya.xyz/landing/sentrabg.png"
                    alt="Moon background"
                    className="absolute inset-0 w-full h-full opacity-20 blur-[1px] md:blur-[2px] object-cover"
                />
                <div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
                <div className="z-10 flex items-center gap-2">
                    <div className="flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#ffffff"
                            viewBox="0 0 120 120"
                            className="size-8 translate-x-[-0.5px]"
                        >
                            <path
                                fill="#ffffff"
                                fillRule="evenodd"
                                d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </div>
                    <p className="text-xl font-semibold">Singularity</p>
                </div>
                <div className="z-10 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl">
                            &ldquo;This Platform has helped me to save time and
                            verify student's background faster than ever before.&rdquo;
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
            <div className="relative flex min-h-screen flex-col justify-center p-4">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
                >
                    <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
                    <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
                    <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
                </div>
                
                <div className="mx-auto space-y-4 sm:w-sm">
                    <div className="flex items-center gap-2 lg:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 120 120"
                            className="size-6"
                        >
                            <path
                                fillRule="evenodd"
                                d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                                clipRule="evenodd"
                            ></path>
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
                            <label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={userEmail}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="rollNo" className="text-sm font-medium">
                                Roll Number
                            </label>
                            <Input
                                id="rollNo"
                                type="text"
                                placeholder="Enter your roll number"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                required
                                className="uppercase"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your AKTU roll number (e.g., 2300680100100)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Verification
                            </label>
                            <div className="flex justify-center">
                                <CloudflareTurnstile
                                    onVerify={(token) => setTurnstileToken(token)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!rollNo || !turnstileToken || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="size-4 me-2" />
                                    <span>Setting up your account...</span>
                                </>
                            ) : (
                                <span>Complete Setup</span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}

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
        color: `rgba(54,1,63,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="pointer-events-none absolute inset-0">
            <svg
                className="h-full w-full text-[#ffffff] dark:text-[#ffffff]"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

interface CloudflareTurnstileProps {
    onVerify: (token: string) => void;
}

function CloudflareTurnstile({ onVerify }: CloudflareTurnstileProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Load Cloudflare Turnstile script
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (containerRef.current && (window as any).turnstile) {
                (window as any).turnstile.render(containerRef.current, {
                    sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
                    callback: (token: string) => {
                        onVerify(token);
                    },
                    theme: "auto",
                });
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [onVerify]);

    return <div ref={containerRef} className="border-none cf-turnstile" />;
}
