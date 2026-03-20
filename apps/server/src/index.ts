import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import prisma from "@singularity/db";
import onboardingRouter from "./routes/onboarding.route";
import subscriptionRouter from "./routes/subscription.route";
import cronRouter from "./routes/cron.route";
import resultRouter from "./routes/result.route";
import cacheRouter from "./routes/cache.route";
import analyticsRouter from "./routes/analytics.route";
import type { HonoContext } from "./types/context";
import { defaultCacheStrategy } from "./utils/cache";
import { auth } from "./lib/auth";
import { authMiddleware } from "./middleware/auth.middleware";
import { freeSubscriptionMiddleware } from "./middleware/free-subscription.middleware";
import type { Context } from "hono";


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
    origin: [
      "https://m.devshakya.xyz",
      "https://s.devshakya.xyz",
      "http://localhost:3001",
      "http://localhost:4000",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
    maxAge: 86400,
  }),
);


// Apply Better Auth middleware to validate sessions
app.on(["POST", "GET"], "/api/auth/*", (c: Context) => auth.handler(c.req.raw));

// Apply FREE subscription middleware after auth routes
app.use("/api/auth/*", freeSubscriptionMiddleware);

// Apply auth middleware only to protected routes (NOT on /api/auth/*)
app.use("/api/me", authMiddleware);
app.use("/api/onboarding/*", authMiddleware);
app.use("/api/subscriptions/*", authMiddleware);
app.use("/users", authMiddleware);

// Application routes
app.route("/api/onboarding", onboardingRouter);
app.route("/api/subscriptions", subscriptionRouter);
app.route("/api/cron", cronRouter);
app.route("/api/result", resultRouter);
app.route("/api/cache", cacheRouter);
app.route("/api/analytics", analyticsRouter);

app.get("/", (c: Context) => {
  return c.text("OK Jhunnu <3");
});

// Example: Get current authenticated user
app.get("/api/me", (c: Context) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user });
});

app.get("/users", async (c: Context) => {
  const users = await prisma?.user?.findMany({
    cacheStrategy: defaultCacheStrategy
  });
  return c.json(users);
});

export type AppType = typeof app;

export default app;
