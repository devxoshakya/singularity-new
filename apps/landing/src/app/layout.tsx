import "./global.css";
import "katex/dist/katex.min.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
    subsets: ["latin"],
});

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
