// app/customer-portal/route.ts
import { CustomerPortal } from '@dodopayments/nextjs'

// GET: Redirect authenticated user to their customer portal
// Query params: customer_id (required), send_email (optional boolean)
export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode' | undefined,
})
