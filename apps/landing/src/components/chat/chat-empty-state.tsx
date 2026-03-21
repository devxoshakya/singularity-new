"use client";

import React, { useState } from "react";
import { BookOpen, BarChart2, GraduationCap, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const cn = (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" ");

type TabId = "academic" | "results" | "syllabus" | "help";

interface Tab {
    id: TabId;
    label: string;
    icon: LucideIcon;
}

interface Props {
    onSelect: (prompt: string) => void;
}

const TABS: Tab[] = [
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "results", label: "My Results", icon: BarChart2 },
    { id: "syllabus", label: "Syllabus", icon: GraduationCap },
    { id: "help", label: "Help", icon: HelpCircle },
];

const SUGGESTIONS: Record<TabId, string[]> = {
    academic: [
        "Explain the difference between TCP and UDP with examples",
        "What is normalization in databases and why does it matter?",
        "Summarise the key concepts from the last lecture",
        "Give me a practice question on binary search trees",
    ],
    results: [
        "What is my current CGPA and how has it changed?",
        "Which subjects am I at risk of failing this semester?",
        "Show my SGPA trend across all semesters",
        "Do I have any carry-over subjects?",
    ],
    syllabus: [
        "What topics are covered in Database Management Systems?",
        "List all subjects for the current semester",
        "What is the exam pattern for Web Technology?",
        "Which subjects have practicals this semester?",
    ],
    help: [
        "How do I add my API key?",
        "What is the difference between RAG search and Result analyze?",
        "How do I update my roll number?",
        "What documents has my organisation uploaded?",
    ],
};

export function ChatEmptyState({ onSelect }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>("academic");

    return (
        // Full height, vertically centered
        <div className="flex items-center justify-center w-full h-full">
            <div className="w-full max-w-[700px] px-4">
                {/* Heading */}
                <h1 className="text-[28px] font-semibold text-white mb-6 tracking-tight">
                    How can I help you?
                </h1>

                {/* Tab pills — all have a border now */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={!active ? undefined : undefined}
                                className={cn(
                                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full",
                                    "text-sm font-medium transition-all duration-200 border",
                                    active
                                        ? "bg-[#2a2a2a] border-[#555] text-white"
                                        : "bg-transparent border-[#2e2e2e] text-[#888] hover:border-[#444] hover:text-[#ddd] hover:[text-shadow:0_0_8px_rgba(255,255,255,0.35)]",
                                )}
                            >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Suggestions */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.13, ease: "easeOut" }}
                    >
                        {SUGGESTIONS[activeTab].map((prompt, i) => (
                            <React.Fragment key={prompt}>
                                <button
                                    onClick={() => onSelect(prompt)}
                                    className="text-left w-full text-[15px] text-[#999] py-2 transition-all hover:bg-secondary/50 hover:rounded-md pl-2 my-1.5 duration-150 hover:text-white hover:[text-shadow:0_0_10px_rgba(255,255,255,0.22)]"
                                >
                                    {prompt}
                                </button>
                                {i < SUGGESTIONS[activeTab].length - 1 && (
                                    <div className="h-px bg-[#252525]" />
                                )}
                            </React.Fragment>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
