"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

type OrgListing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { members: number };
};

export default function StepJoin({
  onBack,
  onRequested,
}: {
  onBack: () => void;
  onRequested: (orgName: string) => void;
}) {
  const { user } = useUser();
  const [orgs, setOrgs] = useState<OrgListing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orgs/list")
      .then(async (r) => {
        const data = (await r.json()) as OrgListing[] | { error?: string };
        if (!r.ok) {
          throw new Error("error" in data ? (data.error ?? "Failed to load organisations") : "Failed to load organisations");
        }
        setOrgs(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load organisations");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return orgs.filter(
      (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [orgs, search]);

  async function handleRequest(org: OrgListing) {
    setRequesting(org.id);
    setError("");
    try {
      const email = user?.primaryEmailAddress?.emailAddress ?? null;
      const res = await fetch(`/api/orgs/${org.id}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      setRequested((prev) => new Set(prev).add(org.id));
      onRequested(org.name);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed";
      setError(message);
    } finally {
      setRequesting(null);
    }
  }

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
        Join an organisation
      </h1>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 28 }}>Send a request - the admin will review and approve you.</p>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <svg
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          style={{
            width: "100%",
            background: "#111",
            border: "1px solid #1f1f1f",
            borderRadius: 10,
            padding: "11px 14px 11px 40px",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
          placeholder="Search organisations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
        {loading && <p style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Loading...</p>}
        {!loading && filtered.length === 0 && (
          <p style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No organisations found.</p>
        )}
        {filtered.map((org) => {
          const isRequested = requested.has(org.id);
          const isRequesting = requesting === org.id;
          return (
            <div
              key={org.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid #1f1f1f",
                background: "#111",
              }}
            >
              <div>
                <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{org.name}</p>
                <p style={{ color: "#444", fontSize: 12 }}>
                  {org.slug} - {org._count.members} member{org._count.members !== 1 ? "s" : ""}
                </p>
                {org.description && <p style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{org.description}</p>}
              </div>
              <button
                onClick={() => {
                  void handleRequest(org);
                }}
                disabled={isRequested || isRequesting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${isRequested ? "#1f3a2e" : "#1f1f1f"}`,
                  background: isRequested ? "rgba(20,184,166,0.08)" : "transparent",
                  color: isRequested ? "#14b8a6" : "#888",
                  fontSize: 13,
                  cursor: isRequested || isRequesting ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginLeft: 16,
                  transition: "all 0.15s",
                }}
              >
                {isRequesting ? "..." : isRequested ? "Requested ✓" : "Request to join"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
