import { z } from "zod";

// Schema for getting result by roll number
export const getResultByRollNoSchema = z.object({
	rollNo: z
		.string()
		.min(1, "Roll number is required")
		.regex(/^[0-9]+$/, "Roll number must contain only digits"),
});

// Schema for getting results by year with pagination
export const getResultsByYearSchema = z.object({
	year: z
		.string()
		.transform((val) => parseInt(val, 10))
		.refine((val) => !isNaN(val) && val >= 1 && val <= 4, {
			message: "Year must be between 1 and 4",
		}),
	page: z
		.string()
		.optional()
		.default("1")
		.transform((val) => parseInt(val, 10))
		.refine((val) => !isNaN(val) && val >= 1, {
			message: "Page must be a positive number",
		}),
	perPage: z
		.string()
		.optional()
		.default("10")
		.transform((val) => parseInt(val, 10))
		.refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
			message: "perPage must be between 1 and 100",
		}),
});

export type GetResultByRollNoInput = z.infer<typeof getResultByRollNoSchema>;
export type GetResultsByYearInput = z.infer<typeof getResultsByYearSchema>;
