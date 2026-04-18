# Singularity Landing App (`apps/landing`)

This app is a **Next.js App Router** application that includes:

- Public marketing website
- Auth + onboarding flows
- Multi-tenant institution membership system
- AI chat client (RAG + result-analysis modes)
- Admin dashboard (members, student cache, knowledge-base submission)
- Billing + checkout + payment webhook integration (Dodo Payments)
- Docs site powered by Fumadocs + MDX

---

## 1) What this app contains

### Product surfaces

1. **Public marketing experience** (home page with hero, features, pricing section, FAQs, testimonials, CTA, animated visuals)
2. **Authenticated app shell** (sidebar, chat workspace, account settings)
3. **Onboarding** (create org + pay, or request to join an existing public org)
4. **Admin console** (dashboard, member moderation, deplatform by year, knowledge-base upload, analytics playground)
5. **Documentation site** (`/docs`) with search and OG image generation

### Primary route groups

- `src/app/(home)` → public landing site
- `src/app/(chat)` → authenticated app
- `src/app/(chat)/(admin)` → admin-only pages
- `src/app/onboarding` → org creation/join flow
- `src/app/docs` → docs pages
- `src/app/api` → backend route handlers

---

## 2) Architecture and key behaviors

## Authentication & access control

- Auth provider: **Clerk**
- Middleware: `src/proxy.ts` (`clerkMiddleware()`)
- Auth gating logic:
  - `/` redirects authenticated users to `/c/new`
  - `/login` redirects signed-in users to `/c/new` (if active membership) or `/onboarding`
  - `(chat)` layout enforces active membership via `requireActiveMembership()` (`src/lib/rbac.ts`)
  - `(chat)/(admin)` layout enforces `ADMIN` role via `requireRole("ADMIN")`

## Organization model (multi-tenant)

- Users belong to orgs through memberships with statuses like `PENDING`, `ACTIVE`, `REJECTED`
- `ADMIN` users moderate membership requests and active members
- Org plans drive limits (`memberLimit`, `studentLimit`) and billing behavior

## Chat backend integration model

Chat runs client-side against an external backend (`NEXT_PUBLIC_JHUNNU_API_URL`, fallback `https://jhunnu-backend.devshakya.xyz`) with:

- Frontend-generated JWT from `createFrontendJwtToken()`
- Request headers:
  - `Authorization: Bearer <token>`
  - `x-api-key` (optional, user-provided)
  - `x-roll-no` (for ask/analyze calls)

Chat supports two modes:

- `rag` → `/ask`
- `results` → `/analyze-result`

Conversation history endpoint used by UI:

- `/history/{conversationId}`

Session list/deletion used by sidebar history:

- `GET /sessions/`
- `DELETE /sessions/{id}?session_id={id}`

## Client persistence

`src/lib/local-storage-service.ts` stores:

- `api-key`
- `roll-no`
- `user-name`, `user-email`
- `chat-history`
- `recent-chat-searches`

Custom event emitted for history updates:

- `chat-history-updated`

---

## 3) Full route map (pages)

### Public and auth routes

- `/` → marketing home (`src/app/(home)/page.tsx`)
- `/login` → auth page (`src/app/login/page.tsx`)
- `/sso-callback` → Clerk redirect callback (`src/app/sso-callback/page.tsx`)
- `/onboarding` → create/join org flow (`src/app/onboarding/page.tsx`)

### Chat app routes

- `/c` → redirect to `/c/new`
- `/c/[id]` → chat thread page with streaming assistant responses
- `/account-setting` → user/org/account preferences + leave organization action

### Admin routes (requires active ADMIN membership)

- `/dashboard` → admin dashboard shell
- `/playground` → analytics query playground with chart renderer
- `/setting` → admin settings placeholder page

### Docs routes

- `/docs` and nested docs via `[[...slug]]`
- `/og/docs/[...slug]` → dynamic OpenGraph image generation for docs
- `/llms-full.txt` → merged docs text output for LLM ingestion

---

## 4) API routes in this app (internal)

## Docs/search

- `GET /api/search`
  - Fumadocs search source route (`createFromSource`)

## Billing / payments

- `GET /api/checkout` (static checkout)
- `POST /api/checkout` (checkout session)
- `GET /api/customer-portal`
- `POST /api/webhook/dodo-payments`
  - Handles successful/failed payment events
  - Creates org on first payment or upgrades existing org by slug
  - Creates admin membership
  - Syncs Clerk public metadata (`active_org_id`, `org_role`)

## Organization lifecycle

- `POST /api/orgs/create`
  - Validates org name/slug + plan
  - Creates Dodo checkout session (org created after successful webhook)
- `GET /api/orgs/list`
  - Lists public, non-FREE organizations for join flow
- `GET /api/orgs/me`
  - Returns current active org + role (+ roll no)
- `POST /api/orgs/leave`
  - Non-admin members can leave current active org
- `POST /api/orgs/[orgId]/request`
  - Submit join request for org
- `GET /api/orgs/[orgId]/members?status=PENDING|ACTIVE|REJECTED`
  - Admin list members/requests
- `PATCH /api/orgs/[orgId]/members/[memberId]`
  - `action=accept|reject` for pending requests
  - Enforces plan limits before accepting member
- `DELETE /api/orgs/[orgId]/members/[memberId]`
  - Admin removes active non-admin member (not self)

## User profile / verification

- `POST /api/orguser/verify`
  - Save `rollNo`, `dob`, `year`
- `POST /api/orguser/deplatform`
  - Marks users of a selected year as passout and removes memberships

## Knowledge base

- `POST /api/knowledge/submit`
  - Accepts documents via multipart form data
  - Currently logs submission and returns success
  - Contains commented example for email-provider integration (Resend/Nodemailer)

---

## 5) Feature inventory (what users can do)

## A) Landing / marketing

- Animated hero and visuals
- Feature and product demonstrations
- Embedded pricing module with plan comparison
- Testimonials, FAQ, CTA, footer
- Auto-redirect signed-in users to app chat

## B) Onboarding

### Step choose

- Create organization
- Join organization

### Step create

- Org name + slug creation UI
- Plan group toggle:
  - Basic plans: `BASIC`, `PRO`, `PREMIUM`
  - Plus plans: `PRO_PLUS`, `PREMIUM_PLUS`
- Shows student/member limits and one-time plan prices
- Redirects to Dodo checkout URL

### Step join

- Search public organizations
- Request to join org
- Handles loading/request/error states

### Step pending

- “Request sent” state until admin approval

## C) Chat workspace

- New/existing conversation routes
- Streaming assistant responses
- SSE parser handles mixed event payload styles
- RAG source extraction/normalization (`sources` / `context_used`)
- Mode switch support (`rag`, `results`)
- Local conversation history sync for sidebar
- Abort/stop in-flight streaming

## D) Sidebar & navigation

- Collapsible sidebar
- Org summary (name + plan badge)
- New chat action
- Conversation search command (recent + local + remote)
- History grouped by date buckets (Today/Yesterday/This week/Older)
- Per-conversation delete action

## E) User/account controls

- Clerk profile info display
- Local roll number + API key controls
- API key validation (`AIza...` prefix)
- API key help dialog linked to docs + embedded tutorial video
- Account settings page
- Leave organization action for non-admin members

## F) Admin dashboard

- Org usage stats + plan upgrade banner near limit
- Pending request moderation
- Active member table with search and pagination
- Year filter + “Deplatform All” action
- Member removal controls
- Student cache module (external result cache fetch + result detail states)
- Knowledge base submission module (file queue + validation + upload)

## G) Admin playground

- Natural-language analytics query UI
- Calls external analysis API (`NEXT_PUBLIC_ANALYSIS_BASE_URL`)
- Renders visual analysis output via chart renderer
- Rich loading and error states

## H) Docs platform

- MDX docs source from `content/docs`
- Docs layout, TOC, metadata, static params
- Search endpoint for docs content
- OG image generation per docs page
- Aggregated docs text at `/llms-full.txt`

---

## 6) Data, limits, and plan behavior

Plan configuration is in `src/lib/plans.ts`:

- `FREE`
- `BASIC` (1000 students / 1000 members)
- `PRO` (2500 / 2500)
- `PRO_PLUS` (4000 / 4000)
- `PREMIUM` (6000 / 6000)
- `PREMIUM_PLUS` (8000 / 8000)

`getPlanByProductId()` maps Dodo product IDs back to app plan keys.

---

## 7) Environment variables

Use `.env.local` in this app (or workspace env strategy).

### Required for auth/app shell

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Required for DB access (Prisma via `@singularity/db`)

- `DATABASE_URL`

### Required for billing routes

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_RETURN_URL`
- `DODO_PAYMENTS_ENVIRONMENT` (`test_mode` or `live_mode`)
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- `NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM`
- `NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM_PLUS`

### Required for external integrations used by UI

- `NEXT_PUBLIC_JHUNNU_API_URL` (chat/history backend; optional fallback exists)
- `NEXT_PUBLIC_ANALYSIS_BASE_URL` (admin playground analysis API)

### Optional (if knowledge submit email wiring is enabled)

- `RESEND_API_KEY`
- `BACKEND_TEAM_EMAIL`

---

## 8) Local development

From repository root (monorepo):

```bash
# Use the workspace package manager configured for this repo
# (packageManager is bun@1.3.1 in root package.json)

bun install
bun run dev
```

For this app only:

```bash
cd apps/landing
bun run dev
```

Default app port for landing is **4000** (`next dev --port=4000`).

### Available scripts (`apps/landing/package.json`)

- `build` → `next build --webpack`
- `dev` → `next dev --port=4000`
- `start` → `next start --port=4000`
- `postinstall` → `fumadocs-mdx`

---

## 9) File and folder guide

Top-level in `apps/landing`:

- `src/app` → routes/layouts/route handlers
- `src/components` → UI + domain components (chat, dashboard, onboarding, sidebar, etc.)
- `src/lib` → shared utilities (`rbac`, `plans`, `source`, local storage, auth token helper)
- `src/sections` → marketing page sections
- `content/docs` → MDX docs content
- `public` → static assets (images, video, lottie)
- `source.config.ts` → Fumadocs content config

---

## 10) Important implementation notes

- Chat history search UI calls `/api/conversations/search`, but this route is not present in `src/app/api` in current code.
- `JWT_SECRET` used by `createFrontendJwtToken()` is currently hardcoded in `src/lib/frontend-auth.ts`.
- `api/orguser/deplatform` contains a TODO comment for stronger admin authorization checks.
- `api/knowledge/submit` currently logs and returns success; production email dispatch needs to be wired.
- Docs navbar/site label in layout shared config is currently `My App`.

---

## 11) Related docs inside this app

- `content/docs/app-overview.mdx`
- `content/docs/features.mdx`
- `content/docs/endpoints.mdx`
- `content/docs/gemini-api-key.mdx`
- `apps/landing/endpoints.md`

---

## 12) Summary

`apps/landing` is both the public face of Singularity and the primary web client for authenticated institutional workflows: onboarding, AI chat, admin operations, docs, and billing. The app is organized around route groups, role-based access, and a hybrid model where UI/state live in Next.js while core AI conversations and analytics are fetched from external services.
