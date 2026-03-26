// app/checkout/route.ts
import { Checkout } from '@dodopayments/nextjs'

// GET: Static checkout — query params: productId (required), quantity, customer fields, metadata_*
export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode' | undefined,
  type: 'static',
})

// POST: Checkout session (recommended) — body: { product_id, quantity, customer, ... }
export const POST = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode' | undefined,
  type: 'session',
})
