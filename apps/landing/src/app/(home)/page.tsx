import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { Header } from "@/sections/Header";
import Hero from "@/sections/Hero";
import { LogoTicker } from "@/sections/LogoTicker";
import { Features } from "@/sections/Features";
import { BentoFeatures } from "@/sections/BentoFeatures";
import { Benefits } from "@/sections/Benefits";
import { Pricing } from "@/sections/Pricing";
import { Testimonials } from "@/sections/Testimonials";
import { CallToAction } from "@/sections/CallToAction";
import { Footer2 } from "@/components/footer2";
import { MietResults } from "@/components/miet-results";
import { Faq } from "@/components/faq";

export default async function Home() {
    const { userId } = await auth();
    if (userId) {
        redirect(`/c/${randomUUID()}`);
    }

    return (
        <div className="w-full container mx-auto relative overflow-hidden p-4">
            {/* <Header /> */}
            <Hero />
            <LogoTicker />
            <Features />
            <BentoFeatures />
            <Pricing />
            {/* <Benefits /> */}
            <Testimonials />
            <MietResults />
            <Faq />
            <CallToAction />
            <Footer2 />
        </div>
    );
}
