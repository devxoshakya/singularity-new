import { LocalStorageService } from "@/lib/local-storage-service";

const JWT_SECRET = "jhunnu";

type FrontendIdentity = {
    userId?: string | null;
    name?: string | null;
    email?: string | null;
};

function base64UrlEncode(input: Uint8Array | string): string {
    const bytes =
        typeof input === "string" ? new TextEncoder().encode(input) : input;

    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

async function signHs256(message: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(message),
    );

    return base64UrlEncode(new Uint8Array(signature));
}

export async function createFrontendJwtToken(
    identity?: FrontendIdentity,
): Promise<string> {
    const userId = identity?.userId?.trim() || "anonymous";

    const name =
        identity?.name?.trim() ||
        "Unknown User";

    const email =
        identity?.email?.trim() ||
        "unknown@jhunnu.local";

    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: "HS256",
        typ: "JWT",
    };

    const payload = {
        sub: userId,
        id: userId,
        user_id: userId,
        name,
        email,
        iat: now,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signature = await signHs256(unsignedToken, JWT_SECRET);

    return `${unsignedToken}.${signature}`;
}

export function getApiKey(): string {
    return LocalStorageService.getApiKey();
}
