# Singularity

A full-stack monorepo for a web platform with a landing/docs site, a listing application, and a Hono-based API server — all deployed to Cloudflare Workers.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js 16** - Full-stack React framework (landing & listing apps)
- **Tailwind CSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Fumadocs** - Documentation framework with MDX support (landing app)
- **Hono** - Lightweight, performant server framework
- **Cloudflare Workers** - Edge runtime environment
- **Prisma** - TypeScript-first ORM with Accelerate for edge
- **MongoDB** - Database engine
- **Better Auth** - Authentication with Google OAuth
- **Dodo Payments** - Subscription & payment integration
- **Framer Motion** - Animation library
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses MongoDB with Prisma.

1. Make sure you have a MongoDB database set up (e.g. MongoDB Atlas).
2. Copy `.env.example` to configure your environment variables with your MongoDB connection details and other secrets.
3. Generate the Prisma client and push the schema:

```bash
bun run db:generate
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

- Landing / Docs site: [http://localhost:4000](http://localhost:4000)
- Listing application: [http://localhost:3001](http://localhost:3001)
- API server: [http://localhost:3000](http://localhost:3000)

## Before Deploying to Cloudflare

When you are ready to deploy your apps to Cloudflare Workers, update the environment variables to match your `*.workers.dev` domains:

```bash
# apps/listing/.env
SERVER_URL={your-production-server-domain}

# apps/server/.env
CORS_ORIGIN={your-production-web-domain}
BETTER_AUTH_URL={your-production-server-domain}
```

In `apps/server/src/lib/auth.ts`, uncomment the `session.cookieCache` and `advanced.crossSubDomainCookies` sections and replace `<your-workers-subdomain>` with your actual workers subdomain. These settings are required to ensure cookies are transferred properly between your web and server domains.

## Deployment (Cloudflare Wrangler)

Each app has its own deploy script:

- **Landing**: `cd apps/landing && bun run deploy`
- **Listing**: `cd apps/listing && bun run deploy`
- **Server**: `cd apps/server && bun run deploy`

## Project Structure

```
singularity/
├── apps/
│   ├── landing/     # Marketing & docs site (Next.js + Fumadocs)
│   ├── listing/     # Main web application (Next.js)
│   └── server/      # Backend API (Hono + Cloudflare Workers)
├── packages/
│   ├── auth/        # Authentication configuration & logic (Better Auth)
│   └── db/          # Database schema & client (Prisma + MongoDB)
```

## Available Scripts

- `bun run dev` — Start all applications in development mode
- `bun run build` — Build all applications
- `bun run dev:server` — Start only the server
- `bun run check-types` — Check TypeScript types across all apps
- `bun run db:generate` — Generate the Prisma client
- `bun run db:push` — Push schema changes to the database
- `bun run db:migrate` — Run database migrations
- `bun run db:studio` — Open Prisma Studio UI
- `bun run db:start` — Start the local database (Docker)
- `bun run db:stop` — Stop the local database
- `bun run db:down` — Remove the local database container
