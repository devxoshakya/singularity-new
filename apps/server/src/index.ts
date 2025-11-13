import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import prisma from "@singularity/db";
import onboardingRouter from "./routes/onboarding.route";
import type { HonoContext } from "./types/context";
import { defaultCacheStrategy } from "./utils/cache";
import { auth } from "./lib/auth";
import { authMiddleware } from "./middleware/auth.middleware";


// Create auth instance with environment variables
// const auth = createAuth({
//   GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
//   BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
//   BETTER_AUTH_URL: env.BETTER_AUTH_URL,
// });

const app = new Hono<HonoContext>();

app.use(logger());

// CORS configuration with dynamic origin handling
app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Allow requests with credentials from specific origins
      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:3000", 
        "https://m.devshakya.xyz",
        "https://listing.singularity.miet.ac.in",
        env.CORS_ORIGIN, // Additional origin from env
      ].filter(Boolean); // Remove undefined values

      // If origin is in allowed list, return it; otherwise return first allowed origin
      if (origin && allowedOrigins.includes(origin)) {
        return origin;
      }
      
      // For development, allow localhost origins
      if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
        return origin;
      }

      // Default to first allowed origin
      return allowedOrigins[0] || origin;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// Apply Better Auth middleware to validate sessions
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Apply auth middleware only to protected routes (NOT on /api/auth/*)
app.use("/api/me", authMiddleware);
app.use("/api/onboarding/*", authMiddleware);
app.use("/users", authMiddleware);

// Onboarding route
app.route("/api/onboarding", onboardingRouter);

app.get("/", (c) => {
  return c.text("OK JI");
});

// Example: Get current authenticated user
app.get("/api/me", (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user });
});

app.get("/users", async (c) => {
  const users = await prisma.user.findMany({
    cacheStrategy: defaultCacheStrategy
  });
  return c.json(users);
});

export type AppType = typeof app;

export default app;
