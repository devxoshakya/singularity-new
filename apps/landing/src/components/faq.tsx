"use client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ShineButton } from "./shine-button";
import { CircleQuestionMarkIcon } from "lucide-react";

export const faqData = [
    {
        question: "How does Singularity fetch AKTU results?",
        answer: "Singularity automatically pulls student results directly from the AKTU student result portal. Admins get a live dashboard with the latest data — no manual entry or spreadsheet uploads needed.",
    },
    {
        question: "How does the knowledge base chat work?",
        answer: "You upload your institution's documents — fee structures, syllabi, exam schedules, notices — and Singularity's RAG engine indexes them. Students can then ask questions in plain language and get accurate, sourced answers instantly.",
    },
    {
        question: "What is Result Mode and how do students use it?",
        answer: "Students save their roll number once, and Result Mode lets them query their semester results and SGPA trend anytime — without logging into any external portal.",
    },
    {
        question: "How does the membership plan work?",
        answer: "Each institution purchases a one-time membership plan with a fixed member seat limit. Once set up, all students and admins under that institution can access Singularity within their allotted seats.",
    },
    {
        question: "Is our institution's data kept private?",
        answer: "Yes. Each institution gets its own isolated knowledge base. Student data, chat history, and uploaded documents are never shared across organizations.",
    },
];

export const Faq = () => {
    return (
        <div className="w-full max-w-300 mx-auto">
            <div className="min-h-120 flex items-center justify-center flex-col my-24 w-full gap-8 md:gap-0 max-h-fit p-4">
                <div className="flex gap-2 md:mb-8 h-fit  items-center justify-center flex-col w-full md:w-3/4 ">
                    <ShineButton
                        Icon={CircleQuestionMarkIcon}
                        className=""
                        label="FAQs"
                    />
                    <h2 className="text-3xl sm:text-3xl font-display md:text-5xl font-medium text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000 text-center">
                        You got questions? We got answers
                    </h2>
                </div>
                <div className="md:w-2/3 p-4 rounded-2xl">
                    <Accordion type="single" collapsible className="">
                        {faqData.map((faq) => (
                            <AccordionItem
                                key={faq.question}
                                value={faq.question}
                                className="border bg-muted/20 mb-3 rounded-2xl"
                            >
                                <AccordionTrigger className="hover:no-underline px-4 cursor-pointer text-left">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/60 px-4 rounded-b-xl py-4">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    );
};
