# Singularity

A full-stack monorepo for a web platform with a landing/docs site, a listing application, and a Hono-based API server — all deployed to Cloudflare Workers. The platform provides student-focused subscription services with Google OAuth authentication (restricted to `@miet.ac.in` emails), tiered subscription plans, and integrated payment processing.

---

## Table of Contents

- [Tech Stack Overview](#tech-stack-overview)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Apps](#apps)
  - [Landing (`apps/landing`)](#landing-appslanding)
  - [Listing (`apps/listing`)](#listing-appslisting)
  - [Server (`apps/server`)](#server-appsserver)
- [Packages](#packages)
  - [Auth (`packages/auth`)](#auth-packagesauth)
  - [DB (`packages/db`)](#db-packagesdb)
- [Authentication Flow](#authentication-flow)
- [Subscription & Payment Flow](#subscription--payment-flow)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Available Scripts](#available-scripts)

---

## Tech Stack Overview

| Technology | Role | Used In |
|---|---|---|
| **TypeScript** | Type safety across the entire codebase | All apps & packages |
| **Turborepo** | Monorepo build orchestration, task caching, and dependency graph | Root |
| **Bun** | JavaScript runtime and package manager | Root |
| **Next.js 16** | Full-stack React framework with App Router | `apps/landing`, `apps/listing` |
| **Hono** | Lightweight, high-performance HTTP framework for edge runtimes | `apps/server` |
| **Cloudflare Workers** | Serverless edge runtime for all deployed apps | All apps |
| **OpenNext** | Adapter to deploy Next.js apps on Cloudflare Workers | `apps/landing`, `apps/listing` |
| **Tailwind CSS v4** | Utility-first CSS framework | `apps/landing`, `apps/listing` |
| **shadcn/ui** | Pre-built, accessible UI components based on Radix UI | `apps/landing`, `apps/listing` |
| **Radix UI** | Headless, accessible component primitives | `apps/landing`, `apps/listing` |
| **Fumadocs** | Documentation framework with MDX support, search, and OG images | `apps/landing` |
| **Framer Motion** | Declarative animation library for React | `apps/landing`, `apps/listing` |
| **Better Auth** | Authentication framework with OAuth, session management, and plugins | `apps/server`, `apps/listing`, `packages/auth` |
| **Prisma** | TypeScript-first ORM with edge runtime support | `packages/db`, `apps/server` |
| **Prisma Accelerate** | Connection pooling and caching layer for edge environments | `packages/db` |
| **MongoDB** | NoSQL database engine | `packages/db` |
| **Dodo Payments** | Subscription billing and payment processing | `packages/auth`, `apps/server` |
| **Zod** | TypeScript-first schema validation | `apps/server`, `apps/listing` |
| **TanStack React Query** | Server-state management and data fetching | `apps/listing` |
| **TanStack React Form** | Type-safe form state management | `apps/listing` |
| **Axios** | HTTP client for API communication | `apps/listing` |
| **Orama** | Full-text search engine (documentation search) | `apps/landing` |
| **Cobe** | 3D globe visualization | `apps/landing` |
| **Lottie** | Animated vector graphics | `apps/landing` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Workers                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Landing     │  │   Listing    │  │       Server          │  │
│  │  (Next.js)    │  │  (Next.js)   │  │       (Hono)          │  │
│  │              │  │              │  │                       │  │
│  │  • Docs      │  │  • Login     │  │  • /api/auth/*        │  │
│  │  • Marketing │  │  • Onboard   │  │  • /api/onboarding    │  │
│  │  • Pricing   │  │  • Dashboard │  │  • /api/subscriptions  │  │
│  │  • Search    │  │  • Pricing   │  │  • /api/result         │  │
│  │              │  │              │  │  • /api/cron           │  │
│  │              │  │              │  │  • /api/me             │  │
│  │  Port: 4000  │  │  Port: 3001  │  │  Port: 3000           │  │
│  └──────────────┘  └──────┬───────┘  └───────────┬───────────┘  │
│                           │    HTTP (Axios)       │              │
│                           └──────────────────────►│              │
│                                                   │              │
└───────────────────────────────────────────────────┼──────────────┘
                                                    │
                            ┌───────────────────────┼──────────┐
                            │   Shared Packages     │          │
                            │                       ▼          │
                            │  ┌─────────────────────────────┐ │
                            │  │  @singularity/auth          │ │
                            │  │  Better Auth + Dodo Payments │ │
                            │  └──────────────┬──────────────┘ │
                            │                 │                │
                            │  ┌──────────────▼──────────────┐ │
                            │  │  @singularity/db            │ │
                            │  │  Prisma + Accelerate        │ │
                            │  └──────────────┬──────────────┘ │
                            └─────────────────┼────────────────┘
                                              │
                                              ▼
                                    ┌───────────────────┐
                                    │     MongoDB        │
                                    │  (Atlas / Local)   │
                                    └───────────────────┘
```

---

## Project Structure

```
singularity/
├── apps/
│   ├── landing/                    # Marketing site & documentation (Next.js + Fumadocs)
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   │   ├── (home)/         # Landing page route group
│   │   │   │   ├── docs/           # Documentation pages (Fumadocs)
│   │   │   │   ├── api/search/     # Full-text search endpoint (Orama)
│   │   │   │   ├── og/docs/        # Dynamic Open Graph image generation
│   │   │   │   └── llms-full.txt/  # LLM-accessible text export
│   │   │   ├── sections/           # Landing page sections (Hero, Features, Pricing, etc.)
│   │   │   ├── components/         # Reusable UI components (shadcn/ui)
│   │   │   │   ├── ui/             # Base UI primitives
│   │   │   │   └── blocks/         # Complex component compositions
│   │   │   ├── lib/                # Utilities (Fumadocs source, helpers)
│   │   │   └── assets/             # SVG icons and static assets
│   │   ├── content/docs/           # MDX documentation files
│   │   └── public/                 # Static public assets
│   │
│   ├── listing/                    # Main web application (Next.js)
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   │   ├── login/          # Authentication page (Google OAuth)
│   │   │   │   ├── on-boarding/    # Post-auth onboarding (roll number + CAPTCHA)
│   │   │   │   ├── dashboard/      # Protected user dashboard
│   │   │   │   └── pricing/        # Subscription checkout
│   │   │   ├── components/         # Reusable UI components
│   │   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   └── dashboard/      # Dashboard-specific components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   └── lib/                # Auth client, API client, utilities
│   │   └── public/                 # Static public assets
│   │
│   └── server/                     # Backend API (Hono on Cloudflare Workers)
│       └── src/
│           ├── index.ts            # App entry point, route mounting, CORS
│           ├── routes/             # API route handlers
│           │   ├── onboarding.route.ts
│           │   ├── subscription.route.ts
│           │   ├── result.route.ts
│           │   └── cron.route.ts
│           ├── controllers/        # Business logic
│           │   ├── onboarding.controller.ts
│           │   └── result.controller.ts
│           ├── middleware/          # Auth, free-subscription middleware
│           ├── schemas/            # Zod validation schemas
│           │   ├── onboarding.schema.ts
│           │   └── result.schema.ts
│           ├── lib/                # Auth instance configuration
│           ├── types/              # TypeScript type definitions
│           └── utils/              # Cache strategy helpers
│
├── packages/
│   ├── auth/                       # Authentication configuration (Better Auth)
│   │   └── src/
│   │       ├── index.ts            # createBetterAuth() factory function
│   │       ├── config/products.ts  # Subscription product definitions (test & live)
│   │       ├── services/           # Subscription management service
│   │       │   └── subscription.service.ts
│   │       └── lib/helper.ts       # Date calculations, product mapping
│   │
│   └── db/                         # Database schema & client (Prisma + MongoDB)
│       ├── prisma/schema/          # Prisma schema files
│       │   ├── schema.prisma       # Main config (MongoDB, edge runtime)
│       │   ├── auth.prisma         # User, Session, Account, Verification models
│       │   ├── subscription.prisma # Subscription model & enums
│       │   └── result.prisma       # Academic Result & Subject models
│       ├── src/index.ts            # Prisma client export with Accelerate
│       └── docker-compose.yml      # Local database setup
│
├── package.json                    # Root workspace config (Bun workspaces)
├── turbo.json                      # Turborepo task pipeline config
├── tsconfig.base.json              # Shared TypeScript base config
├── tsconfig.json                   # Root TypeScript config
├── bunfig.toml                     # Bun configuration
└── .env.example                    # Environment variable template
```

---

## Apps

### Landing (`apps/landing`)

> Marketing site and documentation hub — built with Next.js and Fumadocs, deployed to Cloudflare Workers.

**Purpose:** Serves as the public-facing marketing website with an interactive landing page, integrated documentation, full-text search, and dynamic OG image generation.

#### Key Features

- **Interactive landing page** with animated sections (Hero, Features, Pricing, Benefits, Testimonials, Call to Action)
- **Documentation site** powered by Fumadocs with MDX content, sidebar navigation, and table of contents
- **Full-text search** via Orama search engine (accessible at `/api/search`)
- **Dynamic Open Graph images** auto-generated for documentation pages
- **LLM text export** endpoint (`/llms-full.txt`) for AI indexing
- **Keyboard shortcuts** on the hero section (Enter → docs, B → components, G → GitHub)
- **3D globe visualization** using Cobe library
- **Lottie animations** for feature showcases

#### Routes

| Route | Description |
|---|---|
| `/` | Landing page with marketing sections |
| `/docs/[...slug]` | Documentation pages (Fumadocs MDX) |
| `/api/search` | Full-text documentation search (Orama) |
| `/og/docs/[...slug]` | Dynamic OG image generation |
| `/llms-full.txt` | LLM-accessible full-text export |

#### Tech Details

| Aspect | Detail |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Docs Engine** | Fumadocs (fumadocs-core, fumadocs-ui, fumadocs-mdx) |
| **Styling** | Tailwind CSS + shadcn/ui + class-variance-authority |
| **Animations** | Framer Motion, Lottie (@lottiefiles/dotlottie-react) |
| **Icons** | Lucide React, Tabler Icons, React Icons |
| **Search** | Orama (full-text search) |
| **Deployment** | OpenNext → Cloudflare Workers |
| **Dev Port** | `http://localhost:4000` |

#### Directory Highlights

- **`src/sections/`** — Full-page landing sections: `Hero.tsx`, `Features.tsx`, `BentoFeatures.tsx`, `Pricing.tsx`, `Benefits.tsx`, `Testimonials.tsx`, `LogoTicker.tsx`, `CallToAction.tsx`, `Footer.tsx`, `Header.tsx`
- **`src/components/ui/`** — shadcn/ui components: Button, Badge, Accordion, Pricing Table
- **`src/lib/source.ts`** — Fumadocs source loader, configures documentation tree, icons (Lucide), and search index
- **`content/docs/`** — MDX documentation files with frontmatter schema validation

---

### Listing (`apps/listing`)

> Main web application — handles user authentication, onboarding, dashboard, and subscription management.

**Purpose:** This is the core user-facing application. It manages the full user lifecycle: login via Google OAuth, onboarding (roll number collection with CAPTCHA), a protected dashboard, and subscription checkout.

#### Key Features

- **Google OAuth authentication** via Better Auth client (restricted to `@miet.ac.in` emails)
- **Email/password authentication** as a secondary option
- **Onboarding flow** with roll number validation and Cloudflare Turnstile CAPTCHA
- **Protected dashboard** with session-based access control (server-side redirect)
- **Subscription checkout** with tiered pricing plans
- **Dark/light theme** toggle via `next-themes`
- **Toast notifications** via Sonner
- **React Query** for server-state management and mutation handling
- **Shader background** canvas animation on the landing page

#### Routes

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Application landing page with hero content and shader background |
| `/login` | No | Authentication page with Google OAuth and email/password forms |
| `/on-boarding` | Yes | Post-auth onboarding — collects roll number with Turnstile CAPTCHA |
| `/dashboard` | Yes | Protected user dashboard with profile, plan info, and navigation |
| `/pricing` | No | Subscription pricing table with checkout integration |

#### Auth Protection Pattern

Protected routes use server-side session validation:

```typescript
// In server components (/dashboard, /on-boarding):
const session = await authClient.getSession({
  fetchOptions: { headers: await headers(), throw: true },
});
if (!session?.user) redirect("/login");
```

#### Tech Details

| Aspect | Detail |
|---|---|
| **Framework** | Next.js 16 (App Router, React Compiler enabled) |
| **Auth Client** | better-auth/react with inferAdditionalFields and dodopaymentsClient plugins |
| **Forms** | TanStack React Form + Zod validation |
| **Data Fetching** | TanStack React Query + Axios |
| **Styling** | Tailwind CSS + shadcn/ui + Radix UI primitives |
| **Animations** | Framer Motion (floating paths, transitions) |
| **Themes** | next-themes (dark/light mode) |
| **Notifications** | Sonner (toast messages) |
| **CAPTCHA** | Cloudflare Turnstile (test key in dev, production key in prod) |
| **Deployment** | OpenNext → Cloudflare Workers |
| **Dev Port** | `http://localhost:3001` |

#### Directory Highlights

- **`src/lib/auth-client.ts`** — Better Auth client configured with `NEXT_PUBLIC_SERVER_URL`, plugins for additional user fields (`plan`, `blocked`, `rollNo`) and Dodo Payments
- **`src/lib/api.ts`** — Axios instance pointed at the server API; exports the `onboarding` endpoint
- **`src/hooks/use-onboarding.ts`** — React Query mutation for the onboarding POST request; on success redirects to `/pricing`
- **`src/components/ui/auth-page.tsx`** — Google OAuth login page with Terms checkbox, Google redirect flow
- **`src/components/ui/onboarding-page.tsx`** — Roll number input + Cloudflare Turnstile CAPTCHA verification
- **`src/components/dashboard/navbar.tsx`** — Dashboard top nav with logo, subscription plan badge, and user avatar menu

#### User Fields (Extended via Better Auth)

| Field | Type | Description |
|---|---|---|
| `rollNo` | `string` | Student roll number (collected during onboarding) |
| `plan` | `string` | Subscription tier (`free`, `pro`, `premium`) |
| `blocked` | `boolean` | Admin-controlled account block flag |

---

### Server (`apps/server`)

> Backend API — Hono-based server running on Cloudflare Workers, handling authentication, onboarding, subscriptions, and cron tasks.

**Purpose:** The central API server that powers all backend operations: user authentication via Better Auth, onboarding logic, subscription management with Dodo Payments, and scheduled cron jobs for subscription expiry.

#### Key Features

- **Better Auth integration** — Full OAuth and session management at `/api/auth/*`
- **Onboarding endpoint** — Validates and stores student roll numbers (13-digit numeric)
- **Subscription management** — Fetches active subscriptions, checks status, provides checkout info
- **Result endpoints** — Query student results by roll number or year with pagination
- **Cron job** — Automatically expires outdated subscriptions and downgrades users to FREE tier
- **Prisma Accelerate caching** — Multiple cache strategies (30-day default, 5-min session, 1-hour short, no-cache)
- **CORS configuration** — Allows requests from the listing app (localhost:3001 and production domain)
- **Request logging** — Built-in Hono logger middleware

#### API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET/POST` | `/api/auth/*` | — | Better Auth handler (login, logout, OAuth, sessions, webhooks) |
| `POST` | `/api/onboarding` | ✅ | Submit student roll number (13 digits, numeric). Returns 409 if duplicate. |
| `GET` | `/api/subscriptions/me` | ✅ | Get active subscription, all subscriptions, and Dodo customer portal URL |
| `GET` | `/api/subscriptions/status` | ✅ | Check if user has active subscription, returns current plan (default: FREE) |
| `GET` | `/api/subscriptions/checkout-info` | ✅ | Returns available product slugs for checkout (`pro-6m`, `pro-12m`, `premium-6m`, `premium-12m`) |
| `GET` | `/api/result/by-rollno` | — | Get result by roll number (query: `rollNo`) |
| `GET` | `/api/result/by-year` | — | Get paginated results by year (query: `year`, `page`, `perPage`) |
| `GET` | `/api/cron/check-subscriptions` | — | Cron: expire outdated subscriptions, downgrade to FREE |
| `GET` | `/api/me` | ✅ | Get authenticated user profile |
| `GET` | `/users` | ✅ | Get all users (cached) |
| `GET` | `/` | — | Health check |

#### Middleware Stack

1. **Logger** (`hono/logger`) — Logs all incoming requests
2. **CORS** — Validates origin, allows credentials, exposes `Set-Cookie` header
3. **Better Auth** — Processes auth requests on `/api/auth/*`
4. **Free Subscription Middleware** — Auto-creates a FREE tier subscription on signup/social sign-in at the auth callback route
5. **Auth Middleware** — Validates session tokens on protected routes, sets `user` in Hono context

#### Tech Details

| Aspect | Detail |
|---|---|
| **Framework** | Hono v4 |
| **Runtime** | Cloudflare Workers |
| **Auth** | Better Auth (via `@singularity/auth`) |
| **Database** | Prisma (via `@singularity/db`) with Accelerate caching |
| **Validation** | Zod schemas |
| **Payments** | Dodo Payments (webhook-driven subscription updates) |
| **Dev Port** | `http://localhost:3000` |

#### Directory Highlights

- **`src/index.ts`** — App entry point; mounts logger, CORS, auth routes, onboarding, subscriptions, cron, result, and user endpoints
- **`src/routes/onboarding.route.ts`** — Roll number submission route with auth middleware
- **`src/routes/subscription.route.ts`** — Subscription status, checkout info, and user subscription details
- **`src/routes/result.route.ts`** — Result endpoints: by roll number and by year with pagination
- **`src/routes/cron.route.ts`** — Scheduled job to expire old subscriptions
- **`src/controllers/onboarding.controller.ts`** — Business logic: validates roll number uniqueness, updates user record
- **`src/controllers/result.controller.ts`** — Result queries: by roll number, by year with pagination
- **`src/middleware/auth.middleware.ts`** — Extracts and validates session from request headers
- **`src/middleware/free-subscription.middleware.ts`** — Creates default FREE subscription on user signup
- **`src/lib/auth.ts`** — Instantiates Better Auth with Cloudflare Worker environment variables
- **`src/utils/cache.ts`** — Prisma Accelerate cache strategies (default: 30d, session: 5m, short: 1h, no-cache: 0s)
- **`src/schemas/onboarding.schema.ts`** — Zod schema for onboarding input (13-digit numeric roll number)
- **`src/schemas/result.schema.ts`** — Zod schemas for result queries (roll number, year with pagination)

#### Cache Strategies (Prisma Accelerate)

| Strategy | TTL | SWR | Use Case |
|---|---|---|---|
| Default | 30 days | 30 days | User profiles, product data |
| Session | 5 minutes | 5 minutes | Auth sessions, security-sensitive data |
| Short | 1 hour | 1 hour | Frequently changing data |
| No Cache | 0 seconds | 0 seconds | Real-time data |

---

## Packages

### Auth (`packages/auth`)

> Shared authentication configuration — wraps Better Auth with Google OAuth, Dodo Payments, and subscription management.

**Purpose:** Provides a factory function (`createBetterAuth`) that creates a fully configured Better Auth instance. This package centralizes all authentication, authorization, and subscription logic so it can be consumed by the server app.

#### Main Exports

| Export | Description |
|---|---|
| `createBetterAuth(env)` | Factory function that returns a configured Better Auth instance |
| `AuthEnv` | TypeScript interface for required environment variables |

#### What It Configures

- **Database adapter:** Prisma (MongoDB) via `@singularity/db`
- **Social login:** Google OAuth (restricted to `@miet.ac.in` domain)
- **Email/password:** Enabled as a secondary auth method
- **Dodo Payments plugin:** Handles subscription creation, cancellation, and webhook events
- **Custom user fields:** `rollNo` (string), `blocked` (boolean), `plan` (string, defaults to `"free"`)
- **Cookie settings:** Cross-subdomain cookies for dev (`localhost`) and prod (`.devshakya.xyz`), SameSite=none, Secure, HttpOnly
- **Trusted origins:** `http://localhost:3001`, `https://m.devshakya.xyz`, custom `FRONTEND_URL`

#### Subscription Service (`services/subscription.service.ts`)

| Function | Description |
|---|---|
| `upsertSubscription()` | Create or update a subscription from Dodo Payments webhook data |
| `cancelSubscription()` | Downgrade user to FREE tier, mark subscription as cancelled |
| `checkAndExpireSubscriptions()` | Cron: expire old paid subscriptions and downgrade to FREE |

#### Product Configuration (`config/products.ts`)

Defines test and live product mappings for Dodo Payments:

| Product | Plan | Duration |
|---|---|---|
| `pro-6m` | PRO | 6 months (Half Yearly) |
| `pro-12m` | PRO | 12 months (Yearly) |
| `premium-6m` | PREMIUM | 6 months (Half Yearly) |
| `premium-12m` | PREMIUM | 12 months (Yearly) |

#### Tech Details

| Aspect | Detail |
|---|---|
| **Core** | Better Auth v1.3 |
| **Payment Plugin** | `@dodopayments/better-auth` |
| **Payment SDK** | `dodopayments` v2.5 |
| **Database** | `@singularity/db` (Prisma + MongoDB) |
| **Build** | tsdown (ESM output) |

---

### DB (`packages/db`)

> Database schema and client — Prisma ORM with MongoDB and Accelerate for edge runtime compatibility.

**Purpose:** Defines the complete database schema and exports a Prisma client extended with Accelerate (connection pooling and caching) for use in edge environments like Cloudflare Workers.

#### Main Exports

| Export | Description |
|---|---|
| `prisma` (default) | PrismaClient instance extended with Accelerate |
| `SubscriptionStatus` | Enum: `ACTIVE`, `EXPIRED`, `CANCELLED`, `PAUSED` |
| `SubscriptionPlan` | Enum: `BASIC`, `PRO`, `PREMIUM`, `ADMIN` |
| `SubscriptionDuration` | Enum: `HALF_YEARLY`, `YEARLY` |

#### Database Models

The schema is split across multiple Prisma files in `prisma/schema/`:

**Auth Models** (`auth.prisma`):

| Model | Fields | Purpose |
|---|---|---|
| **User** | `id`, `email`, `name`, `emailVerified`, `image`, `rollNo`, `blocked`, `plan`, `createdAt`, `updatedAt` | Core user identity with custom fields for student data |
| **Session** | `id`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `userId` | Token-based sessions with device tracking |
| **Account** | `id`, `userId`, `providerId`, `accountId`, `accessToken`, `refreshToken`, `idToken`, `scopes` | OAuth provider accounts (Google, etc.) |
| **Verification** | `id`, `identifier`, `value`, `expiresAt` | Email verification records |

**Subscription Models** (`subscription.prisma`):

| Model | Fields | Purpose |
|---|---|---|
| **Subscription** | `id`, `userId`, `plan`, `status`, `duration`, `startDate`, `endDate`, `paymentId`, `productId` | Tracks user subscription lifecycle |

**Academic Models** (`result.prisma`):

| Model | Fields | Purpose |
|---|---|---|
| **Result** | `id`, `studentName`, `rollNo`, `semester`, `sgpa`, `cgpa`, `totalMarks`, `subjects` | Academic result records with aggregate scores |
| **Subject** | `id`, `name`, `code`, `grade`, `credits`, `resultId` | Individual course subjects linked to results |

#### Prisma Configuration

| Setting | Value |
|---|---|
| **Provider** | MongoDB |
| **Client Engine** | Edge-compatible (`workerd` runtime) |
| **Caching** | Prisma Accelerate (`@prisma/extension-accelerate`) |
| **Connection** | `DATABASE_URL` (Accelerate proxy) + `DIRECT_URL` (direct MongoDB) |
| **Schema Files** | Multi-file schema in `prisma/schema/` |
| **Build** | tsdown (ESM output) |

#### Entity Relationship Summary

```
User ──┬── 1:N ── Session
       ├── 1:N ── Account
       └── 1:N ── Subscription

Result ── 1:N ── Subject
```

---

## Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   /login     │────►│ Google OAuth  │────►│ /on-boarding  │────►│  /pricing    │
│              │     │ (@miet.ac.in) │     │ Roll No +     │     │  Checkout    │
│ Google button│     │              │     │ Turnstile     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                                               ┌──────────────┐
                                                               │  /dashboard  │
                                                               │  (Protected) │
                                                               └──────────────┘
```

1. **User visits `/login`** — Presented with Google OAuth button (terms checkbox required)
2. **Google OAuth redirect** — Better Auth handles the OAuth flow; restricted to `@miet.ac.in` emails
3. **Free subscription auto-created** — Server middleware creates a FREE tier subscription on first signup
4. **Redirect to `/on-boarding`** — User enters their 13-digit roll number; Cloudflare Turnstile CAPTCHA verified
5. **POST to `/api/onboarding`** — Server validates roll number uniqueness, stores it on the user record
6. **Redirect to `/pricing`** — User can select a subscription plan or continue with free tier
7. **Dashboard access** — Session-protected route; server-side validation redirects unauthenticated users to `/login`

---

## Subscription & Payment Flow

```
┌───────────────┐     ┌────────────────┐     ┌─────────────────┐
│  /pricing     │────►│ Dodo Payments   │────►│ Webhook Event    │
│  Select Plan  │     │ Checkout Page   │     │ (subscription.*)│
└───────────────┘     └────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Server processes │
                                              │ upsertSubscription│
                                              │ Updates user plan│
                                              └─────────────────┘
```

**Available Plans:**

| Plan | 6-Month Slug | 12-Month Slug |
|---|---|---|
| PRO | `pro-6m` | `pro-12m` |
| PREMIUM | `premium-6m` | `premium-12m` |

**Subscription Lifecycle:**
1. User selects a plan → redirected to Dodo Payments checkout
2. Payment succeeds → Dodo sends webhook to `/api/auth/webhooks/dodopayments`
3. Server processes webhook → `upsertSubscription()` creates/updates the subscription record
4. Cron job (`/api/cron/check-subscriptions`) runs periodically to expire outdated subscriptions
5. Expired users are automatically downgraded to FREE tier

---

## API Reference

### Authentication

All auth routes are handled by Better Auth at `/api/auth/*`:

| Endpoint | Description |
|---|---|
| `POST /api/auth/sign-in` | Email/password sign-in |
| `POST /api/auth/sign-up` | Email/password registration |
| `GET /api/auth/sign-in/social` | Google OAuth initiation |
| `GET /api/auth/callback/google` | Google OAuth callback |
| `POST /api/auth/sign-out` | Sign out (invalidate session) |
| `GET /api/auth/session` | Get current session |
| `POST /api/auth/checkout` | Initiate Dodo Payments checkout (pass `productSlug`) |
| `POST /api/auth/webhooks/dodopayments` | Dodo Payments webhook receiver |

### Application API

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/onboarding` | ✅ | `{ rollNo: string }` (13 digits) | Updated user object |
| `GET` | `/api/subscriptions/me` | ✅ | — | Active subscription + all subscriptions + portal URL |
| `GET` | `/api/subscriptions/status` | ✅ | — | `{ hasActive, plan }` |
| `GET` | `/api/subscriptions/checkout-info` | ✅ | — | Available product slugs |
| `GET` | `/api/result/by-rollno` | — | Query: `rollNo` | Student result with subjects |
| `GET` | `/api/result/by-year` | — | Query: `year`, `page`, `perPage` | Paginated results by year |
| `GET` | `/api/cron/check-subscriptions` | — | — | Expires outdated subscriptions |
| `GET` | `/api/me` | ✅ | — | Authenticated user profile |
| `GET` | `/users` | ✅ | — | All users (cached) |
| `GET` | `/` | — | — | Health check (`"OK JI"`) |

### Result API

**Base URL:** `https://singularity-server.devxoshakya.workers.dev`

#### Get Result by Roll Number

Returns detailed result information for a specific student by their roll number.

**Endpoint:** `GET /api/result/by-rollno`

**Query Parameters:**
- `rollNo` (required) - Student's roll number (must be numeric digits only)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/result/by-rollno?rollNo=1234567890123
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "rollNo": "1234567890123",
    "enrollmentNo": "EN123456789",
    "fullName": "John Doe",
    "blocked": false,
    "fatherName": "Father Name",
    "course": "B.Tech",
    "branch": "Computer Science",
    "year": 2,
    "SGPA": [8.5, 8.7],
    "CarryOvers": [],
    "divison": "First Division",
    "cgpa": "8.6",
    "instituteName": "MIET",
    "latestResultStatus": "Pass",
    "totalMarksObtained": 850,
    "latestCOP": "8.7",
    "Subjects": [
      {
        "id": "507f1f77bcf86cd799439012",
        "subject": "Data Structures",
        "code": "CS201",
        "type": "Theory",
        "internal": "20",
        "external": "75",
        "resultId": "507f1f77bcf86cd799439011"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or missing roll number
  ```json
  { "error": "Roll number is required" }
  ```
- `404 Not Found` - Result not found
  ```json
  { "error": "Result not found for the provided roll number" }
  ```
- `500 Internal Server Error` - Server error
  ```json
  { "error": "Internal server error" }
  ```

---

#### Get Results by Year (Paginated)

Returns all student results for a specific year with pagination support.

**Endpoint:** `GET /api/result/by-year`

**Query Parameters:**
- `year` (required) - Academic year (1-4)
- `page` (optional) - Page number (default: 1, minimum: 1)
- `perPage` (optional) - Results per page (default: 10, minimum: 1, maximum: 100)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/result/by-year?year=2&page=1&perPage=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "rollNo": "1234567890123",
      "enrollmentNo": "EN123456789",
      "fullName": "John Doe",
      "blocked": false,
      "fatherName": "Father Name",
      "course": "B.Tech",
      "branch": "Computer Science",
      "year": 2,
      "SGPA": [8.5, 8.7],
      "CarryOvers": [],
      "divison": "First Division",
      "cgpa": "8.6",
      "instituteName": "MIET",
      "latestResultStatus": "Pass",
      "totalMarksObtained": 850,
      "latestCOP": "8.7",
      "Subjects": [...]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "perPage": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Pagination Metadata:**
- `currentPage` - Current page number
- `perPage` - Number of results per page
- `totalCount` - Total number of results available
- `totalPages` - Total number of pages
- `hasNextPage` - Boolean indicating if next page exists
- `hasPreviousPage` - Boolean indicating if previous page exists

**Error Responses:**
- `400 Bad Request` - Invalid parameters
  ```json
  {
    "error": "Validation failed",
    "details": [
      { "message": "Year must be between 1 and 4", "path": ["year"] }
    ]
  }
  ```
- `500 Internal Server Error` - Server error
  ```json
  { "error": "Internal server error" }
  ```

**Notes:**
- Results are ordered by roll number in ascending order
- Maximum `perPage` value is 100 to prevent performance issues
- Both endpoints use Prisma Accelerate caching for optimized performance

---

## Database Schema

### Enums

```prisma
enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PAUSED
}

enum SubscriptionPlan {
  BASIC
  PRO
  PREMIUM
  ADMIN
}

enum SubscriptionDuration {
  HALF_YEARLY
  YEARLY
}
```

### Models Overview

| Model | Key Fields | Relations |
|---|---|---|
| **User** | `id`, `email`, `name`, `rollNo`, `plan`, `blocked`, `emailVerified` | → Session[], Account[], Subscription[] |
| **Session** | `token`, `expiresAt`, `ipAddress`, `userAgent` | → User |
| **Account** | `providerId`, `accountId`, `accessToken`, `refreshToken` | → User |
| **Verification** | `identifier`, `value`, `expiresAt` | — |
| **Subscription** | `plan`, `status`, `duration`, `startDate`, `endDate`, `paymentId` | → User |
| **Result** | `rollNo`, `semester`, `sgpa`, `cgpa`, `totalMarks` | → Subject[] |
| **Subject** | `name`, `code`, `grade`, `credits` | → Result |

---

## Environment Variables

Copy `.env.example` to `.env` in the relevant directory. Below is the full reference:

### Server (`apps/server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MongoDB connection string (Prisma Accelerate proxy URL for edge) |
| `DIRECT_URL` | — | Direct MongoDB connection string (for migrations) |
| `BETTER_AUTH_SECRET` | ✅ | Session signing key (min 32 chars; generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | ✅ | Server URL where Better Auth is hosted |
| `FRONTEND_URL` | ✅ | Frontend application URL (for redirects) |
| `CORS_ORIGIN` | ✅ | Allowed CORS origin(s) for the listing app |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `DODO_PAYMENTS_API_KEY` | ✅ | Dodo Payments API key (`dodo_test_*` for dev) |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | ✅ | Dodo Payments webhook signature secret |
| `DODO_PAYMENTS_BUSINESS_ID` | ✅ | Dodo Payments business ID |
| `WORKER_ENVIRONMENT` | — | `"prod"` or `"dev"` (switches test/live product IDs) |

### Listing (`apps/listing/.env`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SERVER_URL` | ✅ | Backend API base URL (used by auth client and Axios) |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3+ (package manager and runtime)
- [MongoDB](https://www.mongodb.com/atlas) database (Atlas recommended)
- [Google OAuth credentials](https://console.cloud.google.com/apis/credentials)
- [Dodo Payments account](https://dashboard.dodopayments.com/) (for subscription features)

### Installation

```bash
# Install all dependencies
bun install
```

### Database Setup

This project uses MongoDB with Prisma.

1. Set up a MongoDB database (e.g. MongoDB Atlas).
2. Copy `.env.example` to `apps/server/.env` and configure your MongoDB connection details and other secrets.
3. Generate the Prisma client and push the schema:

```bash
bun run db:generate
bun run db:push
```

### Running Development Servers

```bash
# Start all apps simultaneously
bun run dev
```

| App | URL | Description |
|---|---|---|
| Landing | [http://localhost:4000](http://localhost:4000) | Marketing & docs site |
| Listing | [http://localhost:3001](http://localhost:3001) | Main web application |
| Server | [http://localhost:3000](http://localhost:3000) | Backend API |

To start individual apps:

```bash
bun run dev:server    # Server only
```

---

## Deployment

All apps deploy to **Cloudflare Workers** via Wrangler.

### Pre-Deployment Checklist

1. Update environment variables to match your `*.workers.dev` domains (include the full URL with protocol):

```bash
# apps/listing/.env
NEXT_PUBLIC_SERVER_URL=https://singularity-server.<your-subdomain>.workers.dev

# apps/server/.env
CORS_ORIGIN=https://singularity-listing.<your-subdomain>.workers.dev
BETTER_AUTH_URL=https://singularity-server.<your-subdomain>.workers.dev
```

2. In `apps/server/src/lib/auth.ts`, uncomment the `session.cookieCache` and `advanced.crossSubDomainCookies` sections and replace `<your-workers-subdomain>` with your actual workers subdomain. These settings ensure cookies are transferred properly between your web and server domains.

3. Set production secrets via Wrangler:

```bash
cd apps/server && wrangler secret put BETTER_AUTH_SECRET
# Repeat for other secrets
```

### Deploy Commands

```bash
# Landing site
cd apps/landing && bun run deploy

# Listing app
cd apps/listing && bun run deploy

# Server API
cd apps/server && bun run deploy
```

---

## Available Scripts

### Root (Turborepo)

| Script | Description |
|---|---|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript type checking across all apps |
| `bun run dev:server` | Start only the server app |

### Database (`@singularity/db`)

| Script | Description |
|---|---|
| `bun run db:generate` | Generate the Prisma client |
| `bun run db:push` | Push schema changes to the database |
| `bun run db:migrate` | Run database migrations |
| `bun run db:studio` | Open Prisma Studio UI |
| `bun run db:start` | Start the local database (Docker) |
| `bun run db:stop` | Stop the local database |
| `bun run db:down` | Remove the local database container |
| `bun run db:watch` | Watch for schema changes |

### Per-App

| Script | Description |
|---|---|
| `bun run dev` | Start Next.js/Hono dev server |
| `bun run build` | Production build |
| `bun run deploy` | Deploy to Cloudflare Workers (via Wrangler) |
