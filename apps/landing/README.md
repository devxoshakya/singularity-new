# Singularity Landing App (`apps/landing`)

Singularity is an AI-first institutional platform built to answer student questions fast, reduce manual admin workload, and turn scattered academic data into actionable insights.

This README is intentionally **feature-first** and **flow-first**: what the product does, what pain points it solves, what value it creates, and how every major/minor feature works in practice.

---

## 1) What problem this product solves

Educational institutions usually struggle with the same bottlenecks:

- Students ask the same policy/exam/course questions repeatedly.
- Support and admin teams spend too much time on repetitive query handling.
- Academic data is available, but hard to explore quickly.
- Institution knowledge lives in PDFs/docs and is difficult to query in real time.
- Membership/access to institutional tools is hard to govern at scale.

### Singularity solves this by providing

- A conversational AI assistant for students and members.
- Structured onboarding + org-level access controls.
- Admin workflows for approvals, moderation, and lifecycle control.
- A dashboard that combines member governance and data operations.
- A knowledge ingestion flow to continuously improve answer quality.

---

## 2) Platform value in one line

**Singularity turns institutional documents and student data into instant, governed, and explainable AI interactions.**

---

## 3) Core value delivered to each user type

### For students

- Faster answers without waiting for manual support.
- A single chat workspace for academic/institutional questions.
- Result-analysis mode for performance-focused interactions.
- Persistent conversation history for continuity.

### For institutional admins

- Controlled member onboarding (pending → approved/rejected).
- Role-based access (`ADMIN` / `MEMBER`).
- Plan-based capacity controls (member + student limits).
- Tools to monitor and moderate organizational membership.
- Student cache and analytics-oriented workflows.

### For institutions as a whole

- Reduced support overhead.
- Faster dissemination of policy/academic clarity.
- Better data utilization from existing content and result systems.
- Scalable digital-first student interaction layer.

---

## 4) End-to-end product flows (detailed)

## Flow A: New user to active institutional member

1. User visits landing page.
2. User signs in via Clerk.
3. If no active org membership, user is routed to onboarding.
4. User chooses either:
   - **Create organization** (paid plans), or
   - **Join organization** (public org discovery + request)
5. If joining, request status becomes `PENDING` until admin action.
6. Once approved, user gets active membership and enters chat workspace.

### Pain point solved

- Eliminates unstructured manual onboarding and access confusion.

---

## Flow B: Institution creation and paid activation

1. Admin enters org name and slug.
2. Admin selects plan tier.
3. Checkout session is created with Dodo Payments.
4. On successful payment webhook:
   - Org is created (or upgraded if existing slug)
   - Plan limits are applied
   - Admin membership is created
   - Clerk metadata is synced with org context

### Pain point solved

- Converts fragmented setup + billing into one reliable activation path.

---

## Flow C: Student/member asks questions in AI chat

1. User opens chat (`/c/new` or `/c/[id]`).
2. Frontend sends query with identity + optional API key + roll number headers.
3. Assistant streams answer in real time (SSE).
4. Context/sources (when available) are shown with responses.
5. Session is persisted and appears in conversation history.

### Pain point solved

- Replaces slow ticket-based Q&A with immediate guided responses.

---

## Flow D: Admin moderates organization membership

1. Admin opens dashboard.
2. Reviews pending requests.
3. Accept/reject actions enforce plan limits before activation.
4. Active members can be filtered, searched, and removed.
5. Deplatform action can mark a full year as passout and remove memberships.

### Pain point solved

- Provides governance and control at institution scale.

---

## Flow E: Knowledge base enhancement

1. Admin uploads supported documents (`pdf`, `doc`, `docx`, `txt`, `pptx`).
2. Files are submitted through knowledge route.
3. Ingestion process enriches institution knowledge available to AI.

### Pain point solved

- Keeps AI answers aligned with latest institutional content.

---

## 5) Feature inventory (major + minute)

## A) Public landing experience

- Immersive visual storytelling sections (hero, features, testimonials, FAQ, CTA).
- Pricing presentation embedded into landing flow.
- Auth-aware redirect for signed-in users directly into chat entry path.

## B) Authentication and session handling

- Clerk-powered login and SSO callback support.
- Route-level gating for authenticated app surfaces.
- Membership-based app access enforcement.

## C) Organization onboarding and access

- Two-path onboarding: create org or join org.
- Public organization discovery with search.
- Request lifecycle: `PENDING`, `ACTIVE`, `REJECTED`.
- Auto-routing based on membership state.

## D) Role-based controls

- Explicit `ADMIN`/`MEMBER` separation.
- Admin-only routes for dashboard, settings, playground.
- Membership moderation APIs guarded by org admin checks.

## E) AI chat experience

- Two interaction modes:
  - `rag` (knowledge-grounded Q&A)
  - `results` (result-analysis interactions)
- Real-time token/response streaming.
- Robust SSE handling for varied payload formats.
- Source/context extraction and rendering.
- New-chat instant URL promotion without disruptive full reload.
- Stop-stream control for user interruption.

## F) Conversation continuity

- Sidebar history grouped by date windows.
- Local cache fallback to preserve continuity.
- Per-thread delete support.
- Search command (`Cmd/Ctrl + K`) with recent + local + remote composition.

## G) Profile and user controls

- Inline account menu with identity display.
- Local roll number/API key persistence.
- API key format validation and help guidance.
- Dedicated account settings surface.
- Leave-organization action for non-admin users.

## H) Admin dashboard operations

- Live org usage stats + pending count visibility.
- Upgrade banner when usage nears plan limits.
- Member table with search, filters, pagination.
- Pending request acceptance/rejection.
- Active member removal workflow.
- Year-based bulk deplatform action.

## I) Student data operations

- Student cache retrieval and lookup workflows.
- Year and search filters for result exploration.
- Result status views (pass/pcp/fail style outputs in UI).

## J) Knowledge management tools

- Drag/drop upload UX.
- Client-side file validation (size/type).
- Multi-file queue and submit flow.
- Back-office handoff for indexing pipeline.

## K) Analytics playground

- Natural-language query input for analytics requests.
- Chart-first rendering of structured analysis responses.
- Purpose-built admin experimentation environment.

## L) Documentation platform

- MDX docs delivery under `/docs`.
- Search endpoint for discoverability.
- Auto-generated OG images.
- `/llms-full.txt` export for LLM-friendly docs ingestion.

---

## 6) Backend and AI stack (as provided)

The landing app integrates with a backend stack that includes:

- **Decorize FastAPI backend** deployed on **Google Cloud Run**
- **LangChain** orchestration for RAG workflows
- **Gemini 3.0 Flash** as LLM
- **Gemini Embedding-001** for embeddings
- **MongoDB Vector Search index** for retrieval
- **Document ingestion pipeline** supporting **PDF** and **OCR**-based extraction

### Why this matters for users

- Faster, context-grounded answers from institutional content.
- Better recall/precision from vector search over indexed documents.
- Scalable cloud deployment for production availability.
- Continuous knowledge refresh through ingestion.

---

## 7) How well it works in real usage

From implemented product behavior, the app is designed to perform well for day-to-day institutional operations by combining:

- **Fast interaction loops** (streaming responses and immediate UI feedback)
- **Graceful continuity** (local history + fallback flows)
- **Governed access** (membership and role checks)
- **Operational safeguards** (plan limits enforced during approvals)
- **Practical admin tooling** (request moderation, removals, bulk actions, upload pipeline)

In short, it balances user speed, admin control, and institutional reliability.

---

## 8) Plans and limit model

Configured plan tiers:

- `FREE`
- `BASIC`
- `PRO`
- `PRO_PLUS`
- `PREMIUM`
- `PREMIUM_PLUS`

Each paid tier defines:

- student limit
- member limit
- plan pricing
- product mapping for billing integration

These limits are actively enforced in membership activation workflows.

---

## 9) Internal routes and APIs (quick reference)

### Main pages

- `/` landing
- `/login`
- `/onboarding`
- `/c`, `/c/[id]`
- `/account-setting`
- `/dashboard`, `/playground`, `/setting`
- `/docs/*`, `/llms-full.txt`

### App APIs

- Search/docs: `/api/search`
- Billing: `/api/checkout`, `/api/customer-portal`, `/api/webhook/dodo-payments`
- Orgs: `/api/orgs/create`, `/api/orgs/list`, `/api/orgs/me`, `/api/orgs/leave`
- Membership: `/api/orgs/[orgId]/request`, `/api/orgs/[orgId]/members`, `/api/orgs/[orgId]/members/[memberId]`
- User ops: `/api/orguser/verify`, `/api/orguser/deplatform`
- Knowledge ops: `/api/knowledge/submit`

---

## 10) Environment variables (operational)

- Auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- DB: `DATABASE_URL`
- Billing: `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_RETURN_URL`, `DODO_PAYMENTS_ENVIRONMENT`, `DODO_PAYMENTS_WEBHOOK_SECRET`, `NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM`, `NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM_PLUS`
- External service URLs: `NEXT_PUBLIC_JHUNNU_API_URL`, `NEXT_PUBLIC_ANALYSIS_BASE_URL`
- Optional (if email handoff enabled): `RESEND_API_KEY`, `BACKEND_TEAM_EMAIL`

---

## 11) Local development

```bash
# Monorepo root
bun install
bun run dev
```

Landing-only:

```bash
cd apps/landing
bun run dev
```

Default dev port: `4000`.

---

## 12) Final product positioning

Singularity is not just a landing app—it is the institution-facing AI experience layer that combines:

- user-friendly onboarding,
- governed access,
- intelligent student support,
- admin control workflows,
- and continuously improving knowledge retrieval.

If your goal is to reduce repetitive institutional support load while improving student experience quality, this app is built exactly for that outcome.
