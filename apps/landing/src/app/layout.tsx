import "./global.css";
import "katex/dist/katex.min.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Singularity",
        template: "%s | Singularity",
    },
    icons: {
        icon: "/logo.svg",
        shortcut: "/logo.svg",
        apple: "/logo.svg",
    },
};

export default function Layout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${inter.className} dark`}
            suppressHydrationWarning
        >
            <body className="flex flex-col min-h-screen">
                <ClerkProvider>
                    <QueryProvider>
                        <TooltipProvider>{children}</TooltipProvider>
                    </QueryProvider>
                </ClerkProvider>
                <Toaster richColors />
            </body>
        </html>
    );
}
