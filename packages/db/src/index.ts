import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

export default prisma;

// Export Prisma types and enums for use in other packages
export { SubscriptionStatus, SubscriptionPlan, SubscriptionDuration } from '@prisma/client/edge';