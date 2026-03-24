"use client";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    ValueAnimationTransition,
} from "framer-motion";
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

const tabs = [
    {
        icon: "/assets/lottie/vroom.lottie",
        title: "Search & Result Mode",
        isNew: false,
        // bottom area — search input + mode toggle
        backgroundPositionX: 70,
        backgroundPositionY: 100,
        backgroundSizeX: 170,
    },
    {
        icon: "/assets/lottie/click.lottie",
        title: "Chat History",
        isNew: false,
        // left sidebar — chat history list
        backgroundPositionX: 0,
        backgroundPositionY: 50,
        backgroundSizeX: 230,
    },
    {
        icon: "/assets/lottie/stars.lottie",
        title: "Knowledge Base Chat",
        isNew: true,
        // top-right — chat message bubble area
        backgroundPositionX: 70,
        backgroundPositionY: 5,
        backgroundSizeX: 145,
    },
];

const FeatureTab = (
    props: (typeof tabs)[number] &
        ComponentPropsWithoutRef<"div"> & { selected: boolean },
) => {
    const tabRef = useRef<HTMLDivElement>(null);
    const dotLottieRef = useRef<any>(null);
    const xPercentage = useMotionValue(0);
    const yPercentage = useMotionValue(0);
    const maskImage = useMotionTemplate`radial-gradient(80px 80px at ${xPercentage}% ${yPercentage}%, black, transparent)`;

    useEffect(() => {
        if (!tabRef.current || !props.selected) return;

        xPercentage.set(0);
        yPercentage.set(0);

        const { height, width } = tabRef.current.getBoundingClientRect();
        const circumference = height * 2 + width * 2;
        const times = [
            0,
            width / circumference,
            (width + height) / circumference,
            (width * 2 + height) / circumference,
            1,
        ];

        const options: ValueAnimationTransition = {
            times: times,
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
        };

        animate(xPercentage, [0, 100, 100, 0, 0], options);
        animate(yPercentage, [0, 0, 100, 100, 0], options);
    }, [props.selected]);

    const handleTabHover = () => {
        dotLottieRef?.current?.setFrame(0);
        dotLottieRef?.current?.play();
    };

    return (
        <div
            onMouseEnter={handleTabHover}
            className="border border-white/15 flex p-2.5 rounded-xl gap-2.5 items-center lg:flex-1 relative"
            ref={tabRef}
            onClick={props.onClick}
        >
            {props.selected && (
                <motion.div
                    style={{ maskImage }}
                    className="absolute inset-0 -m-px border border-[#A369FF] rounded-xl"
                />
            )}
            <div className="h-12 w-12 border border-white/15 rounded-lg inline-flex items-center justify-center">
                <DotLottieReact
                    src={props.icon}
                    className="h-5 w-5"
                    dotLottieRefCallback={(dotLottie) => {
                        dotLottieRef.current = dotLottie;
                    }}
                />
            </div>
            <div className="font-medium">{props.title}</div>
            {props.isNew && (
                <div className="text-xs rounded-full px-2 py-0.5 bg-[#8c44ff] text-black font-semibold">
                    new
                </div>
            )}
        </div>
    );
};

export const Features = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const backgroundPositionX = useMotionValue(tabs[0].backgroundPositionX);
    const backgroundPositionY = useMotionValue(tabs[0].backgroundPositionY);
    const backgroundSizeX = useMotionValue(tabs[0].backgroundSizeX);

    const backgroundPosition = useMotionTemplate`${backgroundPositionX}% ${backgroundPositionY}%`;
    const backgroundSize = useMotionTemplate`${backgroundSizeX}% auto`;

    const handleSelectTab = (index: number) => {
        setSelectedTab(index);

        const options: ValueAnimationTransition = {
            duration: 2,
            ease: "easeInOut",
        };

        animate(
            backgroundSizeX,
            [backgroundSizeX.get(), 100, tabs[index].backgroundSizeX],
            options,
        );
        animate(
            backgroundPositionX,
            [backgroundPositionX.get(), tabs[index].backgroundPositionX],
            options,
        );
        animate(
            backgroundPositionY,
            [backgroundPositionY.get(), tabs[index].backgroundPositionY],
            options,
        );
    };

    return (
        <section className="py-20 md:py-24 max-w-6xl mx-auto px-4">
            <div className="container">
                <h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">
                    Less Emails. More Answers.
                </h2>
                <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
                    From fee breakdowns to exam schedules, students can
                    instantly query your college's knowledge base — without
                    waiting on staff.
                </p>

                <div className="mt-10 flex flex-col lg:flex-row gap-3">
                    {tabs.map((tab, index) => (
                        <FeatureTab
                            selected={selectedTab === index}
                            onClick={() => handleSelectTab(index)}
                            {...tab}
                            key={index}
                        />
                    ))}
                </div>

                <div className="border border-white/20 p-2.5 rounded-xl mt-3">
                    <motion.div
                        className="aspect-video bg-cover border border-white/20 rounded-lg"
                        style={{
                            backgroundImage: `url(/landing/product.png)`,
                            backgroundPosition: backgroundPosition,
                            backgroundSize: backgroundSize,
                        }}
                    />
                </div>
            </div>
        </section>
    );
};
