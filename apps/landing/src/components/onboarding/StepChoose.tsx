"use client";

import type React from "react";
import { Step } from "./OnboardingShell";

const card: React.CSSProperties = {
  background: "#111",
  border: "1px solid #1f1f1f",
  borderRadius: 16,
  padding: "32px 28px",
  cursor: "pointer",
  transition: "border-color 0.2s, transform 0.2s",
  flex: 1,
};

export default function StepChoose({ onSelect }: { onSelect: (s: Step) => void }) {
  return (
    <div>
      <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.03em" }}>
        Welcome aboard.
      </h1>
      <p style={{ color: "#555", fontSize: 15, marginBottom: 36 }}>
        Get started by creating your organisation or joining an existing one.
      </p>

      <div style={{ display: "flex", gap: 16 }}>
        <div
          style={card}
          onClick={() => onSelect("create")}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#635bff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1f1f1f";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(99,91,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#635bff" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Create an org</h2>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
            Set up your organisation, pick a plan, and invite your team.
          </p>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, color: "#635bff", fontSize: 13 }}>
            <span>Get started</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </div>

        <div
          style={card}
          onClick={() => onSelect("join")}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#14b8a6";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1f1f1f";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(20,184,166,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Join an org</h2>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
            Browse public organisations and send a request to join.
          </p>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, color: "#14b8a6", fontSize: 13 }}>
            <span>Browse orgs</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
