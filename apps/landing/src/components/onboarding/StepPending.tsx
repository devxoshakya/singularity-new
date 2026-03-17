"use client";

export default function StepPending({ orgName }: { orgName: string | null }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(20,184,166,0.1)",
          border: "1px solid rgba(20,184,166,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.03em" }}>Request sent</h1>
      <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
        Your request to join
        {orgName ? <span style={{ color: "#fff" }}> {orgName}</span> : " the organisation"} is pending admin approval. You will get
        access as soon as they accept.
      </p>
      <p style={{ color: "#333", fontSize: 12, marginTop: 24 }}>You can safely close this tab.</p>
    </div>
  );
}
