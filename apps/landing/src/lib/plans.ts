export type PlanKey =
  | "FREE"
  | "BASIC"
  | "PRO"
  | "PRO_PLUS"
  | "PREMIUM"
  | "PREMIUM_PLUS";

type PlanConfig = {
  label: string;
  studentLimit: number;
  memberLimit: number;
  price: number;
  dodoProductId?: string;
};

export const PLAN_LIMITS: Record<PlanKey, PlanConfig> = {
  FREE: {
    label: "Free",
    studentLimit: 0,
    memberLimit: 0,
    price: 0,
  },
  BASIC: {
    label: "Basic",
    studentLimit: 1000,
    memberLimit: 1000,
    price: 99,
    dodoProductId: "pdt_0NagnThNF0EarYwHvJDfJ",
  },
  PRO: {
    label: "Pro",
    studentLimit: 2500,
    memberLimit: 2500,
    price: 199,
    dodoProductId: "pdt_0NagnagtLVGPXgQAhfoLI",
  },
  PRO_PLUS: {
    label: "Pro Plus",
    studentLimit: 4000,
    memberLimit: 4000,
    price: 299,
    dodoProductId: "pdt_CqCeMB2Afh3YzKAGCZC7B",
  },
  PREMIUM: {
    label: "Premium",
    studentLimit: 6000,
    memberLimit: 6000,
    price: 399,
    dodoProductId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM,
  },
  PREMIUM_PLUS: {
    label: "Premium Plus",
    studentLimit: 8000,
    memberLimit: 8000,
    price: 499,
    dodoProductId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM_PLUS,
  },
};

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [plan, config] of Object.entries(PLAN_LIMITS) as Array<[
    PlanKey,
    PlanConfig,
  ]>) {
    if (config.dodoProductId === productId) {
      return plan;
    }
  }

  return null;
}
