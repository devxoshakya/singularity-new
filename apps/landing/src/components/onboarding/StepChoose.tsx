"use client";

import { ArrowRight, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Step } from "./OnboardingShell";

export default function StepChoose({
    onSelect,
}: {
    onSelect: (s: Step) => void;
}) {
    return (
        <>
            <div className="mx-auto max-w-xl space-y-8">
                <div className="space-y-0 pb-4 text-left">
                    <h1 className="font-heading text-2xl font-bold tracking-wide text-white sm:text-3xl">
                        Welcome aboard.
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Get started by creating your organisation or joining an
                        existing one.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => onSelect("create")}
                        className="group rounded-xl border border-border/60 bg-background/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/60"
                    >
                        <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <Building2 className="size-5" />
                        </span>
                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                            Create an organisation
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Set up your organisation, pick a plan, and invite
                            your team.
                        </p>
                        <div className="flex items-end gap-2 ">
                            <Badge variant="secondary" className="mt-3">
                                Paid plans
                            </Badge>
                            <span className="mt-5 inline-flex items-center border border-primary/50 rounded-full gap-1 text-xs p-0.5 px-1.5 font-medium text-primary">
                                Get started
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.75" />
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect("join")}
                        className="group rounded-xl border border-border/60 bg-background/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/60"
                    >
                        <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-400">
                            <Users className="size-5" />
                        </span>
                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                            Join an organisation
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Browse public organisations and send a request to
                            join.
                        </p>
                        <div className="flex items-end gap-2 ">
                            <Badge
                                variant="outline"
                                className="mt-3 border-cyan-400/50 bg-cyan-400/15 text-cyan-300"
                            >
                                Public orgs
                            </Badge>
                            <span className="mt-5 inline-flex items-center border border-cyan-400/50 rounded-full gap-1 text-xs p-0.5 px-1.5 font-medium text-cyan-400">
                                Browse orgs
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.75" />
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
}
