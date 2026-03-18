"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, Users, ChevronLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
                const data = (await r.json()) as
                    | OrgListing[]
                    | { error?: string };
                if (!r.ok) {
                    throw new Error(
                        "error" in data
                            ? (data.error ?? "Failed to load organisations")
                            : "Failed to load organisations",
                    );
                }
                setOrgs(Array.isArray(data) ? data : []);
            })
            .catch((e) => {
                setError(
                    e instanceof Error
                        ? e.message
                        : "Failed to load organisations",
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filtered = useMemo(() => {
        return orgs.filter(
            (o) =>
                o.name.toLowerCase().includes(search.toLowerCase()) ||
                o.slug.toLowerCase().includes(search.toLowerCase()),
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
        <>
            <Button
                variant="ghost"
                className="absolute top-7 left-5 z-20"
                onClick={onBack}
            >
                <ChevronLeftIcon className="me-2 size-4" />
                Back
            </Button>
            <div className="mx-auto max-w-xl space-y-4">
                <div className="space-y-2">
                    <h1 className="font-heading text-2xl font-bold tracking-wide text-white sm:text-3xl">
                        Join an organisation
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Send a request and the admin will approve your access.
                    </p>
                </div>

                <div className="relative mb-5">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search organisations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-background/70 pl-9"
                    />
                </div>

                {error ? (
                    <p className="mb-4 text-sm text-red-400">{error}</p>
                ) : null}

                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {loading
                        ? Array.from({ length: 4 }).map((_, idx) => (
                              <div
                                  key={idx}
                                  className="rounded-xl border border-border/60 bg-background/75 p-4"
                              >
                                  <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0 flex-1 space-y-2">
                                          <Skeleton className="h-4 w-40" />
                                          <Skeleton className="h-3 w-56" />
                                          <Skeleton className="h-3 w-32" />
                                      </div>
                                      <Skeleton className="h-9 w-28 rounded-md" />
                                  </div>
                              </div>
                          ))
                        : null}

                    {!loading && filtered.length === 0 ? (
                        <p className="rounded-xl border border-border/60 bg-background/75 py-10 text-center text-sm text-muted-foreground">
                            No organisations found.
                        </p>
                    ) : null}

                    {!loading
                        ? filtered.map((org) => {
                              const isRequested = requested.has(org.id);
                              const isRequesting = requesting === org.id;
                              return (
                                  <div
                                      key={org.id}
                                      className="rounded-xl border border-border/60 bg-background/75 p-4"
                                  >
                                      <div className="flex items-center justify-between gap-3">
                                          <div className="min-w-0">
                                              <div className="flex gap-2 items-end">
                                                  <p className="truncate text-sm font-semibold text-foreground">
                                                      {org.name}
                                                  </p>
                                                  <Badge
                                                      variant="outline"
                                                      className="mt-2 gap-1 border-border/70 text-xs"
                                                  >
                                                      <Users className="size-3" />
                                                      Public org
                                                  </Badge>
                                              </div>
                                              <p className="mt-1 text-xs text-muted-foreground">
                                                  {org.slug} •{" "}
                                                  {org._count.members} member
                                                  {org._count.members !== 1
                                                      ? "s"
                                                      : ""}
                                              </p>
                                              {org.description ? (
                                                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                                      {org.description}
                                                  </p>
                                              ) : null}
                                          </div>

                                          <Button
                                              size="sm"
                                              variant={
                                                  isRequested
                                                      ? "secondary"
                                                      : "outline"
                                              }
                                              disabled={
                                                  isRequested || isRequesting
                                              }
                                              onClick={() => {
                                                  void handleRequest(org);
                                              }}
                                          >
                                              {isRequesting
                                                  ? "Sending..."
                                                  : isRequested
                                                    ? "Requested"
                                                    : "Request"}
                                          </Button>
                                      </div>
                                  </div>
                              );
                          })
                        : null}
                </div>
            </div>
        </>
    );
}
