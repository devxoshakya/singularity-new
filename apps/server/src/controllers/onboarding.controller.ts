import type { Context } from "hono";
import prisma from "@singularity/db";
import { onboardingSchema } from "@/schemas/onboarding.schema";
import type { HonoContext } from "@/types/context";
import { defaultCacheStrategy } from "@/utils/cache";

export const onboardingController = async (c: Context<HonoContext>) => {
  try {
    // Get user from Better Auth context (set by middleware)
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized - Please log in" }, 401);
    }

    // Check if user already has rollNo
    
    if (user.rollNo) {
      return c.json(
        
        { error: "User already completed onboarding", rollNo: user.rollNo },
        400,
      );
    }

    // Parse and validate request body
    const body = await c.req.json();
    const validatedData = onboardingSchema.parse(body);

    // Check if rollNo already exists
    const existingUser = await prisma.user.findUnique({
      where: { rollNo: validatedData.rollNo },
      cacheStrategy: defaultCacheStrategy,
    });

    if (existingUser) {
      return c.json({ error: "Roll number already registered" }, 409);
    }

    // Update user with rollNo
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { rollNo: validatedData.rollNo },
      select: {
        id: true,
        email: true,
        name: true,
        rollNo: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return c.json(
      {
        success: true,
        message: "Onboarding completed successfully",
        user: updatedUser,
      },
      200,
    );
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return c.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        400,
      );
    }

    // Handle Prisma errors
    if (error.code === "P2002") {
      return c.json({ error: "Roll number already exists" }, 409);
    }

    console.error("Onboarding error:", error);
    return c.json(
      { error: "Internal server error", message: error.message },
      500,
    );
  }
};
