# Singularity Server

Cloudflare Workers backend for Singularity AKTU result analysis platform.

## Environment Variables

Create a `.env` file in this directory with the following variables:

```bash
# Database
DATABASE_URL=your_mongodb_connection_string

# Better Auth Configuration
BETTER_AUTH_SECRET=your_random_secret_key_here
BETTER_AUTH_URL=https://your-worker-url.workers.dev

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Setting Up Environment Variables

### Local Development

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Production (Cloudflare Workers)

Use Wrangler to set secrets for production:

```bash
# Set all secrets
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL
wrangler secret put CORS_ORIGIN
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

Or set them via the Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings > Variables
4. Add each environment variable as a secret

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `https://your-worker-url.workers.dev/api/auth/callback/google`
   - `http://localhost:8787/api/auth/callback/google` (for local dev)
7. Copy Client ID and Client Secret to your environment variables

## Development

```bash
bun run dev
```

## Deployment

```bash
bun run deploy
```
