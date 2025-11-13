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
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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

export default app;
