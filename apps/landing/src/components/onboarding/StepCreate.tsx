"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";

const PAID_PLANS = ["BASIC", "PRO", "PRO_PLUS", "PREMIUM", "PREMIUM_PLUS"] as PlanKey[];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid #1f1f1f",
  borderRadius: 10,
  padding: "11px 14px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export default function StepCreate({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [plan, setPlan] = useState<PlanKey>("BASIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(val: string) {
    setOrgName(val);
    setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function handleSubmit() {
    if (!orgName.trim() || !orgSlug.trim()) {
      setError("Organisation name and slug are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orgs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, orgSlug, plan }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      if (!data.checkoutUrl) {
        throw new Error("No checkout URL returned.");
      }

      router.push(data.checkoutUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  }

  const selectedLimits = PLAN_LIMITS[plan];

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#555",
          cursor: "pointer",
          padding: 0,
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back
      </button>

      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em" }}>
        Create your organisation
      </h1>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>One-time purchase - no recurring fees.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        <div>
          <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Organisation name</label>
          <input style={inputStyle} placeholder="Acme University" value={orgName} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
        <div>
          <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Slug</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#444", fontSize: 14 }}>
              singularity.app/
            </span>
            <input
              style={{ ...inputStyle, paddingLeft: 130 }}
              placeholder="acme-university"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
            />
          </div>
        </div>
      </div>

      <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 12 }}>Select a plan</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {PAID_PLANS.map((p) => {
          const limits = PLAN_LIMITS[p];
          const selected = plan === p;
          return (
            <div
              key={p}
              onClick={() => setPlan(p)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${selected ? "#635bff" : "#1f1f1f"}`,
                background: selected ? "rgba(99,91,255,0.06)" : "#111",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `2px solid ${selected ? "#635bff" : "#333"}`,
                    background: selected ? "#635bff" : "transparent",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{limits.label}</span>
                  <span style={{ color: "#555", fontSize: 12, marginLeft: 10 }}>
                    {limits.studentLimit.toLocaleString()} students - {limits.memberLimit.toLocaleString()} members
                  </span>
                </div>
              </div>
              <span style={{ color: selected ? "#635bff" : "#666", fontSize: 14, fontWeight: 600 }}>${limits.price}</span>
            </div>
          );
        })}
      </div>

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px",
          background: loading ? "#1a1a2e" : "#635bff",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {loading ? "Redirecting to checkout..." : `Continue to payment - $${selectedLimits.price}`}
      </button>
    </div>
  );
}
