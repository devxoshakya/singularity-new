import { Hono } from "hono";
import { onboardingController } from "../controllers/onboarding.controller";

const onboardingRouter = new Hono();

// POST /api/onboarding - Complete user onboarding with roll number
// Requires authentication
onboardingRouter.post("/", onboardingController);

export default onboardingRouter;
