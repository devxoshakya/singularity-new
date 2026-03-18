"use client";

import { useState } from "react";
import ColorBends from "@/components/ColorBends";
import Dither from "@/components/Dither";
import PrismaticBurst from "@/components/PrismaticBurst";
import StepChoose from "./StepChoose";
import StepCreate from "./StepCreate";
import StepJoin from "./StepJoin";
import StepPending from "./StepPending";
import { cn } from "@/lib/utils";

export type Step = "choose" | "create" | "join" | "pending";

interface Props {
  initialStep: Step;
  pendingOrgName: string | null;
}

export default function OnboardingShell({ initialStep, pendingOrgName }: Props) {
  const [step, setStep] = useState<Step>(initialStep);
  const [pendingOrg, setPendingOrg] = useState(pendingOrgName);

  const renderLeftBackground = () => {
    if (step === "create") {
      return (
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      );
    }

    if (step === "join" || step === "pending") {
      return (
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={0}
          mixBlendMode="lighten"
          colors={["#ff007a", "#4d3dff", "#ffffff"]}
        />
      );
    }

    return (
      <ColorBends
        className="h-full w-full"
        style={{}}
        colors={["#ff5c7a", "#8a5cff", "#00ffd1"] as never[]}
        rotation={0}
        speed={0.2}
        scale={1}
        frequency={1}
        warpStrength={1}
        mouseInfluence={1}
        parallax={0.5}
        noise={0.1}
        transparent
        autoRotate={0}
      />
    );
  };

  return (
    <main className="relative bg-black md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-1/2 overflow-hidden lg:block"
      >
        <div className="h-full w-full">{renderLeftBackground()}</div>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 hidden h-full flex-col items-center justify-center border-r bg-transparent p-10 lg:flex">
        <div className="flex flex-col items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#ffffff"
            viewBox="0 0 120 120"
            className="size-12 translate-x-[-0.5px]"
          >
            <path
              fill="#ffffff"
              fillRule="evenodd"
              d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-2xl font-semibold tracking-wide text-white">Singularity</p>
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col justify-center bg-[#000000A0] p-4">
        <div className="mx-auto w-full max-w-2xl">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 lg:hidden",
              step === "choose" || step === "join" ? "mb-12" : "mb-8"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#ffffff"
              viewBox="0 0 120 120"
              className="size-8 translate-x-[-0.5px]"
            >
              <path
                fill="#ffffff"
                fillRule="evenodd"
                d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xl font-semibold text-white">Singularity</p>
          </div>

          <div className="px-4 sm:px-6">
            {step === "choose" && <StepChoose onSelect={setStep} />}
            {step === "create" && <StepCreate onBack={() => setStep("choose")} />}
            {step === "join" && (
              <StepJoin
                onBack={() => setStep("choose")}
                onRequested={(orgName) => {
                  setPendingOrg(orgName);
                  setStep("pending");
                }}
              />
            )}
            {step === "pending" && <StepPending orgName={pendingOrg} />}
          </div>
        </div>
      </div>
    </main>
  );
}
