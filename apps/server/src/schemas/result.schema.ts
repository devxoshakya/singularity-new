import { z } from "zod";

// Schema for getting result by roll number
export const getResultByRollNoSchema = z.object({
	rollNo: z
		.string()
		.min(1, "Roll number is required")
		.regex(/^[0-9]+$/, "Roll number must contain only digits"),
});

// Schema for getting results by year
export const getResultsByYearSchema = z.object({
	year: z
		.string()
		.trim()
		.regex(/^\d+$/, "Year must be a valid number")
		.transform((val) => parseInt(val, 10))
		.refine((val) => Number.isInteger(val) && ((val >= 1 && val <= 4) || val >= 2020), {
			message: "Year must be between 1 and 4 or a valid year from 2020 onwards",
		}),
});

export type GetResultByRollNoInput = z.infer<typeof getResultByRollNoSchema>;
export type GetResultsByYearInput = z.infer<typeof getResultsByYearSchema>;
