import { env } from "cloudflare:workers";
import { createBetterAuth } from "@singularity/auth";

export const auth = createBetterAuth({
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    FRONTEND_URL: env.FRONTEND_URL,
});

export default auth;