"use client";
import React from "react";
import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";

export default function FeaturesSectionDemo() {
    const features = [
        {
            title: "AI Chat Built for Academic Workflows",
            description:
                "Students and teams can ask academic questions, review concepts, and get grounded responses with document-backed context.",
            skeleton: <SkeletonOne />,
            className:
                "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
        },
        {
            title: "Result Analysis in One Place",
            description:
                "Save your roll number once and check SGPA trend, carry-overs, and subject-level result insights without leaving the dashboard.",
            skeleton: <SkeletonTwo />,
            className:
                "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
        },
        {
            title: "Quick Gemini API Key Setup",
            description:
                "Watch our quick setup tutorial and start using Gemini-backed flows in minutes.",
            skeleton: <SkeletonThree />,
            className:
                "col-span-1 lg:col-span-3 lg:border-r  dark:border-neutral-800",
        },
        {
            title: "Global-Scale Admin Console",
            description:
                "Empower your organization with a dashboard designed for global reach—manage members, approve requests, and monitor student results from anywhere in the world.",
            skeleton: <SkeletonFour />,
            className: "col-span-1 lg:col-span-3 border-b lg:border-none",
        },
    ];
    return (
        <div className="relative z-20 mx-auto w-full max-w-7xl py-10 lg:py-6">
            <div className="px-8">
                <h4 className="mx-auto max-w-5xl text-center text-3xl font-medium tracking-tight text-black lg:text-5xl lg:leading-tight dark:text-white">
                    Built for Student Support and Result Intelligence
                </h4>

                <p className="mx-auto my-4 max-w-2xl text-center text-sm font-normal text-neutral-500 lg:text-base dark:text-neutral-300">
                    Singularity combines AI chat, organization workflows, and
                    academic result analysis in one focused platform.
                </p>
            </div>

            <div className="relative">
                <div className="mt-10 grid grid-cols-1 rounded-md lg:grid-cols-6 xl:border dark:border-neutral-800">
                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.title}
                            className={feature.className}
                        >
                            <FeatureTitle>{feature.title}</FeatureTitle>
                            <FeatureDescription>
                                {feature.description}
                            </FeatureDescription>
                            <div className="h-full w-full">
                                {feature.skeleton}
                            </div>
                        </FeatureCard>
                    ))}
                </div>
            </div>
        </div>
    );
}

const FeatureCard = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                `relative flex min-h-70 flex-col overflow-hidden p-4 sm:min-h-80 sm:p-8 items-start text-left`,
                className,
            )}
        >
            {children}
        </div>
    );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
    return (
        <p className="max-w-5xl text-left text-xl tracking-tight text-black md:text-2xl md:leading-snug dark:text-white">
            {children}
        </p>
    );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
    return (
        <p
            className={cn(
                "mx-auto max-w-4xl text-left text-sm md:text-base",
                "text-center font-normal text-neutral-500 dark:text-neutral-300",
                "mx-0 my-2 max-w-sm text-left md:text-sm",
            )}
        >
            {children}
        </p>
    );
};

export const SkeletonOne = () => {
    return (
        <div className="relative mt-3 h-56 w-full sm:h-64">
            <div className="group mx-auto h-full w-full bg-white p-3 shadow-2xl dark:bg-neutral-900">
                <div className="flex h-full w-full flex-1 flex-col space-y-2">
                    <img
                        src="/landing/desktop.png"
                        alt="Singularity product preview"
                        width={2200}
                        height={2800}
                        className="h-full w-full top-0 rounded-sm object-cover object-top-left"
                    />
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-20 w-full bg-linear-to-t from-white via-white/70 to-transparent dark:from-black dark:via-black/70" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-12 w-full bg-linear-to-b from-white via-transparent to-transparent dark:from-black" />
        </div>
    );
};

export const SkeletonThree = () => {
    return (
        <a
            href="https://youtu.be/sLxW6oIS4cM"
            target="__blank"
            className="group/image relative mt-3 flex h-56 w-full sm:h-64"
        >
            <div className="group mx-auto h-full w-full bg-transparent dark:bg-transparent">
                <div className="relative flex h-full w-full flex-1 flex-col space-y-2">
                    <IconBrandYoutubeFilled className="absolute inset-0 z-10 m-auto h-20 w-20 text-red-500" />
                    <img
                        src="/landing/api.jpg"
                        alt="Gemini setup tutorial"
                        width={800}
                        height={800}
                        className="h-full w-full rounded-sm object-cover object-center blur-none transition-all duration-200 group-hover/image:blur-md"
                    />
                </div>
            </div>
        </a>
    );
};

export const SkeletonTwo = () => {
    const images = [
        "/assets/graphs/1.png",
        "/assets/graphs/2.png",
        "/assets/graphs/3.png",
        "/assets/graphs/4.png",
        "/assets/graphs/5.png",
        "/assets/graphs/6.png",
        "/assets/graphs/7.png",
    ];

    const imageVariants = {
        whileHover: {
            scale: 1.1,
            rotate: 0,
            zIndex: 100,
        },
        whileTap: {
            scale: 1.1,
            rotate: 0,
            zIndex: 100,
        },
    };
    return (
        <div className="relative mt-3 flex h-56 flex-col items-start gap-4 overflow-hidden p-4 sm:h-64 sm:p-6">
            <div className="-ml-8 flex flex-row sm:-ml-12">
                {images.map((image, idx) => (
                    <motion.div
                        variants={imageVariants}
                        key={"images-first" + idx}
                        style={{
                            rotate: Math.random() * 20 - 10,
                        }}
                        whileHover="whileHover"
                        whileTap="whileTap"
                        className="mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                        <img
                            src={image}
                            alt="Singularity preview"
                            width="500"
                            height="500"
                            className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
                        />
                    </motion.div>
                ))}
            </div>
            <div className="-ml-4 flex flex-row sm:-ml-8">
                {images.map((image, idx) => (
                    <motion.div
                        key={"images-second" + idx}
                        style={{
                            rotate: Math.random() * 20 - 10,
                        }}
                        variants={imageVariants}
                        whileHover="whileHover"
                        whileTap="whileTap"
                        className="mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                        <img
                            src={image}
                            alt="Singularity preview"
                            width="500"
                            height="500"
                            className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
                        />
                    </motion.div>
                ))}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 z-100 h-full w-12 bg-linear-to-r from-white to-transparent dark:from-black" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-100 h-full w-12 bg-linear-to-l from-white to-transparent dark:from-black" />
        </div>
    );
};

export const SkeletonFour = () => {
    return (
        <div className="relative flex h-56 w-full items-end justify-end overflow-hidden bg-transparent sm:h-64 dark:bg-transparent">
            {/* Only bottom-right quarter of the globe visible */}
            <div className="absolute right-0 bottom-0 h-[200%] w-[200%] translate-x-1/2 translate-y-1/4 overflow-hidden pointer-events-none">
                {/* Background video */}
                <video
                    className="absolute bottom-0 left-0 h-full w-full object-cover scale-125 object-bottom z-0"
                    src="/landing/earth.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            </div>
        </div>
    );
};
