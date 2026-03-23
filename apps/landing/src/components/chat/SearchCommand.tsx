"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    LocalStorageService,
    type RecentSearch,
    type ConversationSummary,
} from "@/lib/local-storage-service";

type Result = { id: string; title: string; createdAt: string };

interface SearchCommandProps {
    hideTrigger?: boolean;
}

function searchLocal(q: string): Result[] {
    if (!q || typeof window === "undefined") return [];
    const cached = LocalStorageService.getChatHistory() as ConversationSummary[];
    return cached
        .filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8) as Result[];
}

function getRecentSearches(): RecentSearch[] {
    return LocalStorageService.getRecentSearches();
}

function saveRecentSearches(items: RecentSearch[]) {
    LocalStorageService.setRecentSearches(items);
}

function upsertRecentSearch(item: RecentSearch): RecentSearch[] {
    const current = getRecentSearches();
    const deduped = current.filter((entry) => entry.id !== item.id);
    const next = [item, ...deduped].slice(0, 5);
    saveRecentSearches(next);
    return next;
}

export function SearchCommand({ hideTrigger = false }: SearchCommandProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const router = useRouter();

    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    // cmd+k / ctrl+k
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Local results — instant
    const localResults = searchLocal(query);

    // Remote results — debounced
    const { data: remoteResults = [] } = useQuery({
        queryKey: ["search", query],
        queryFn: async () => {
            const res = await fetch(
                `/api/conversations/search?q=${encodeURIComponent(query)}`,
            );
            if (!res.ok) return [];
            return res.json() as Promise<Result[]>;
        },
        enabled: query.length > 2,
        staleTime: 1000 * 60,
    });

    // Merge: local first (dedup by id), then remote extras
    const localIds = new Set(localResults.map((r) => r.id));
    const merged = [
        ...localResults,
        ...remoteResults.filter((r) => !localIds.has(r.id)),
    ];

    const handleSelect = useCallback(
        (item: { id: string; title: string }) => {
            setRecentSearches(upsertRecentSearch({ id: item.id, title: item.title }));
            router.push(`/c/${item.id}`);
            setOpen(false);
            setQuery("");
        },
        [router],
    );

    return (
        <>
            {/* Trigger button */}
            {!hideTrigger && (
                <button
                    onClick={() => setOpen(true)}
                    className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">
                        Search chats...
                    </span>
                    <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground/60 border border-border/50 rounded px-1 py-0.5">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            )}

            {/* Dialog */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search conversations..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>No conversations found.</CommandEmpty>
                    {query.trim().length === 0 && recentSearches.length > 0 && (
                        <CommandGroup heading="Recent searches">
                            {recentSearches.map((r) => (
                                <CommandItem
                                    key={`recent-${r.id}`}
                                    value={`recent-${r.title}`}
                                    onSelect={() => handleSelect(r)}
                                >
                                    <Search className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{r.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                    {merged.length > 0 && (
                        <CommandGroup heading="Conversations">
                            {merged.map((r) => (
                                <CommandItem
                                    key={r.id}
                                    value={r.title}
                                    onSelect={() => handleSelect(r)}
                                >
                                    <Search className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{r.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
