"use client";

import { useState } from "react";
import StepChoose from "./StepChoose";
import StepCreate from "./StepCreate";
import StepJoin from "./StepJoin";
import StepPending from "./StepPending";

export type Step = "choose" | "create" | "join" | "pending";

interface Props {
  initialStep: Step;
  pendingOrgName: string | null;
}

export default function OnboardingShell({ initialStep, pendingOrgName }: Props) {
  const [step, setStep] = useState<Step>(initialStep);
  const [pendingOrg, setPendingOrg] = useState(pendingOrgName);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "40px 16px",
      }}
    >
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,91,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, marginBottom: 48, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="white">
            <path d="M16 0 L17.5 14.5 L32 16 L17.5 17.5 L16 32 L14.5 17.5 L0 16 L14.5 14.5 Z" />
          </svg>
          <span style={{ color: "#fff", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Singularity
          </span>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 640 }}>
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
  );
}
