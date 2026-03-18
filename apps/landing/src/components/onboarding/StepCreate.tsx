"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeftIcon, Mail } from "lucide-react";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PlanGroup = "BASIC_PLANS" | "PLUS_PLANS";

const BASIC_PLANS = ["BASIC", "PRO", "PREMIUM"] as PlanKey[];
const PLUS_PLANS = ["PRO_PLUS", "PREMIUM_PLUS"] as PlanKey[];

export default function StepCreate({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [planGroup, setPlanGroup] = useState<PlanGroup>("BASIC_PLANS");
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
  const visiblePlans = planGroup === "BASIC_PLANS" ? BASIC_PLANS : PLUS_PLANS;

  return (
    <>
      <Button variant="ghost" className="absolute top-7 left-5 z-20" onClick={onBack}>
        <ChevronLeftIcon className="me-2 size-4" />
        Back
      </Button>
      <div className="mx-auto max-w-xl space-y-4">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-wide text-white sm:text-3xl">
            Create your organisation
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            One-time purchase, no recurring fees.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Organisation name</label>
            <Input
              placeholder="Acme University"
              value={orgName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-background/70"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Slug</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                singularity.app/
              </span>
              <Input
                placeholder="acme-university"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="bg-background/70 pl-28"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-xs text-muted-foreground">Select a plan</label>

          <div className="bg-muted/30 flex w-full rounded-full border p-1">
            <button
              type="button"
              onClick={() => {
                setPlanGroup("BASIC_PLANS");
                setPlan("BASIC");
              }}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                planGroup === "BASIC_PLANS"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Basic Plans
            </button>
            <button
              type="button"
              onClick={() => {
                setPlanGroup("PLUS_PLANS");
                setPlan("PRO_PLUS");
              }}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                planGroup === "PLUS_PLANS"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Plus Plans
            </button>
          </div>

          {visiblePlans.map((p) => {
            const limits = PLAN_LIMITS[p];
            const selected = plan === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-4 text-left transition",
                  selected
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/70 bg-background/75 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                    )}
                  >
                    {selected ? <CheckCircle2 className="size-3.5" /> : null}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{limits.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {limits.studentLimit.toLocaleString()} students • {limits.memberLimit.toLocaleString()} members
                    </p>
                  </div>
                </div>
                <Badge variant={selected ? "default" : "secondary"}>${limits.price}</Badge>
              </button>
            );
          })}

          {planGroup === "PLUS_PLANS" ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="hidden text-sm font-medium text-foreground sm:block">Custom (Above plan limits)</p>
                  <p className="mt-1 text-xs text-muted-foreground sm:hidden">Talk to us for custom pricing.</p>
                  <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                    Need more than Premium Plus limits? Talk to us for custom pricing.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <a href="mailto:sales@singularity.app">
                    <Mail className="mr-2 size-4" />
                    Contact Sales
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <Button onClick={handleSubmit} disabled={loading} className="mt-6 w-full" size="lg">
          {loading ? "Redirecting to checkout..." : `Continue to payment - $${selectedLimits.price}`}
        </Button>
      </div>
    </>
  );
}
