import { z } from "zod";

export const onboardingSchema = z.object({
	rollNo: z
		.string()
		.min(1, "Roll number is required")
		.regex(/^[0-9]+$/, "Roll number must contain only digits")
		.length(13, "Roll number must be exactly 13 digits")
		.transform((val) => val.toUpperCase()),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
