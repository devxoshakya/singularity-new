
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { Header } from "@/sections/Header";
import HeroSection from "@/sections/Hero";
import { LogoTicker } from "@/sections/LogoTicker";
import { Features } from "@/sections/Features";
import { Benefits } from "@/sections/Benefits";
import { PricingPage } from "@/components/ui/pricing-page";
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
        <div className="w-full relative overflow-hidden">
            {/* <Header /> */}
            <HeroSection />
            <div className="max-w-480 mx-auto px-4">
                <LogoTicker />
            </div>
            <div className="max-w-480 mx-auto px-4">
                <Features />
            </div>
            <div className="max-w-480 mx-auto px-4">
                {/* <BentoFeatures /> */}
            </div>
            <div className="max-w-480 mx-auto px-4">
                <PricingPage embedded />
            </div>
            {/* <Benefits /> */}
            <div className="max-w-480 mx-auto px-4">
                <Testimonials />
            </div>
            <MietResults />
            <Faq />
            <CallToAction />
            <Footer2 />
        </div>
    );
}
