import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
    subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={inter.className} suppressHydrationWarning>
            <body className="flex flex-col min-h-screen">
                <RootProvider>
                    <ClerkProvider>{children}</ClerkProvider>

                    {/* {children} */}
                    <Toaster richColors />
                </RootProvider>
            </body>
        </html>
    );
}
