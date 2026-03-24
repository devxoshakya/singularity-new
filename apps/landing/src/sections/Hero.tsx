"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import DashboardPreview from "./DashboardPreview";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CornerDownLeft } from "lucide-react";

const fadeUp = (delay: number, y: number = 16, duration: number = 0.6) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration, delay, ease: "easeOut" as const },
});

const HeroSection = () => {
    return (
        <section className="flex-1 relative overflow-hidden flex flex-col items-center">
            {/* Background Video */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src="/landing/BlackHole.mp4"
            />
            {/* Hue overlay */}
            <div
                className="absolute inset-0 z-1 pointer-events-none"
                style={{ backgroundColor: "#5997ff", mixBlendMode: "hue" }}
            />
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center mt-4 w-full px-6 pt-18">
                {/* Headline */}
                <motion.h1
                    {...fadeUp(0.1, 16, 0.6)}
                    className="relative inline-block border border-accent bg-accent/13 px-4 py-2 backdrop-blur-sm text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-white max-w-xl"
                >
                    The{" "}
                    <em
                        className="font-display italic text-white/90"
                        style={{ fontStyle: "italic" }}
                    >
                        AI Brain
                    </em>{" "}
                    Your Institution Never Had
                    <span className="absolute aspect-square h-1 bg-white z-10 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
                    <span className="absolute aspect-square h-1 bg-white z-10 top-0 right-0 translate-x-1/2 -translate-y-1/2" />
                    <span className="absolute aspect-square h-1 bg-white z-10 bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
                    <span className="absolute aspect-square h-1 bg-white z-10 bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    {...fadeUp(0.1, 16, 0.6)}
                    className="relative inline-block border border-accent bg-accent/13 px-4 py-1 my-2 backdrop-blur-lg text-center text-base md:text-lg leading-[0.95] tracking-tight text-white max-w-xl"
                >
                    Instant answers, real-time results, and admin insights — all
                    in one platform, 24/7, without burdening your staff.
                    <span className="absolute aspect-square h-1 bg-white z-10 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
                    <span className="absolute aspect-square h-1 bg-white z-10 top-0 right-0 translate-x-1/2 -translate-y-1/2" />
                    <span className="absolute aspect-square h-1 bg-white z-10 bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
                    <span className="absolute aspect-square h-1 bg-white z-10 bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    className="flex gap-2 md:gap-4 justify-center items-center my-8 md:max-w-md mx-auto"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    // transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    {...fadeUp(0.2, 20, 0.6)}
                >
                    <Button
                        className="gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-300"
                        asChild
                    >
                        <Link
                            className="flex group items-center gap-2"
                            href="/login"
                        >
                            <span>Get Started</span>
                            <Badge className="bg-accent p-1 text-foreground transition-all duration-200 ease-in-out group-hover:shadow-xl shadow-background/70">
                                <CornerDownLeft className="size-4" />
                            </Badge>
                        </Link>
                    </Button>
                    <Button
                        variant="secondary"
                        className="gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-300"
                    >
                        <Link
                            className="flex group items-center gap-2"
                            href="/docs/components"
                        >
                            <span>Browse Components</span>
                            <Badge className="bg-accent text-foreground transition-all duration-200 group-hover:shadow-xl shadow-white/70">
                                B
                            </Badge>
                        </Link>
                    </Button>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    {...fadeUp(0.5, 30, 0.8)}
                    className="flex justify-center w-full"
                >
                    <DashboardPreview />
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
