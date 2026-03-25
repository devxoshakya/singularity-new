"use client";

export type ConversationSummary = {
    id: string;
    title: string;
    createdAt?: string;
};

export type RecentSearch = {
    id: string;
    title: string;
};

export const CHAT_HISTORY_UPDATED_EVENT = "chat-history-updated";

function isQuotaExceededError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const maybe = error as DOMException;
    return (
        maybe.name === "QuotaExceededError" ||
        maybe.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
}

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

function parseJson<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function setItemWithEviction(key: string, value: string): boolean {
    if (!isBrowser()) return false;

    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

export class LocalStorageService {
    static getString(key: string): string {
        if (!isBrowser()) return "";
        return localStorage.getItem(key) ?? "";
    }

    static setString(key: string, value: string): boolean {
        if (!isBrowser()) return false;
        return setItemWithEviction(key, value);
    }

    static remove(key: string) {
        if (!isBrowser()) return;
        localStorage.removeItem(key);
    }

    static getApiKey(): string {
        return (
            this.getString("api-key").trim() ||
            this.getString("auth-token").trim() ||
            ""
        );
    }

    static setApiKey(value: string) {
        this.setString("api-key", value);
        this.remove("auth-token");
        this.remove("gemini-key");
    }

    static getRollNo(): string {
        return this.getString("roll-no");
    }

    static setRollNo(value: string) {
        this.setString("roll-no", value);
    }

    static setUserIdentity(name?: string | null, email?: string | null) {
        if (name?.trim()) {
            this.setString("user-name", name);
        }
        if (email?.trim()) {
            this.setString("user-email", email);
        }
    }

    static getChatHistory(): ConversationSummary[] {
        const parsed = parseJson<unknown[]>(this.getString("chat-history"), []);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (item): item is ConversationSummary =>
                !!item &&
                typeof item === "object" &&
                typeof (item as any).id === "string" &&
                typeof (item as any).title === "string",
        );
    }

    static setChatHistory(items: ConversationSummary[], emitEvent = true): boolean {
        const ok = this.setString("chat-history", JSON.stringify(items));
        if (ok && emitEvent && isBrowser()) {
            window.dispatchEvent(new CustomEvent(CHAT_HISTORY_UPDATED_EVENT));
        }
        return ok;
    }

    static upsertChatHistory(conversationId: string, title: string) {
        const safeTitle = title.trim().slice(0, 120) || "New chat";
        const list = this.getChatHistory();
        const now = new Date().toISOString();
        const deduped =
            safeTitle === "New chat"
                ? list.filter(
                      (item) =>
                          item.id === conversationId ||
                          item.title.trim().toLowerCase() !== "new chat",
                  )
                : list;

        const existingIndex = deduped.findIndex((item) => item.id === conversationId);

        let next: ConversationSummary[];
        if (existingIndex >= 0) {
            const existing = deduped[existingIndex];
            const existingTitle = existing.title?.trim() ?? "";
            const shouldKeepExistingTitle =
                existingTitle.length > 0 &&
                existingTitle.toLowerCase() !== "new chat" &&
                safeTitle.toLowerCase() === "new chat";

            const merged: ConversationSummary = {
                ...existing,
                title: shouldKeepExistingTitle ? existingTitle : safeTitle,
                createdAt: existing.createdAt ?? now,
            };
            next = [
                merged,
                ...deduped.filter((item) => item.id !== conversationId),
            ];
        } else {
            next = [
                { id: conversationId, title: safeTitle, createdAt: now },
                ...deduped,
            ];
        }

        this.setChatHistory(next, true);
    }

    static getPendingNewChatId(): string | null {
        const pending = this.getChatHistory().find(
            (item) => item.title.trim().toLowerCase() === "new chat",
        );

        return pending?.id ?? null;
    }

    static getRecentSearches(): RecentSearch[] {
        const parsed = parseJson<unknown[]>(this.getString("recent-chat-searches"), []);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter(
                (item): item is RecentSearch =>
                    !!item &&
                    typeof item === "object" &&
                    typeof (item as any).id === "string" &&
                    typeof (item as any).title === "string",
            )
            .slice(0, 5);
    }

    static setRecentSearches(items: RecentSearch[]) {
        this.setString("recent-chat-searches", JSON.stringify(items.slice(0, 5)));
    }

}
