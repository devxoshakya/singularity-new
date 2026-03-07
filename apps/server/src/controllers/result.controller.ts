import type { Context } from "hono";
import prisma from "@singularity/db";
import {
	getResultByRollNoSchema,
	getResultsByYearSchema,
} from "@/schemas/result.schema";
import type { HonoContext } from "@/types/context";
import { defaultCacheStrategy } from "@/utils/cache";

/**
 * GET /api/result/by-rollno?rollNo=XXX
 * Get student result by roll number
 */
export const getResultByRollNoController = async (c: Context<HonoContext>) => {
	try {
		// Get and validate query parameters
		const rollNo = c.req.query("rollNo");

		if (!rollNo) {
			return c.json({ error: "Roll number is required" }, 400);
		}

		// Validate input
		const validatedData = getResultByRollNoSchema.parse({ rollNo });

		// Find result by roll number
		const result = await prisma.result.findFirst({
			where: { rollNo: validatedData.rollNo },
			include: {
				Subjects: true,
			},
			cacheStrategy: defaultCacheStrategy,
		});

		if (!result) {
			return c.json(
				{ error: "Result not found for the provided roll number" },
				404,
			);
		}

		return c.json(
			{
				success: true,
				data: result,
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

		console.error("Get result by roll number error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
};

/**
 * GET /api/result/by-year?year=1&page=1&perPage=10
 * Get all students by year with pagination
 */
export const getResultsByYearController = async (c: Context<HonoContext>) => {
	try {
		// Get query parameters
		const year = c.req.query("year");
		const page = c.req.query("page") || "1";
		const perPage = c.req.query("perPage") || "10";

		if (!year) {
			return c.json({ error: "Year is required" }, 400);
		}

		// Validate input
		const validatedData = getResultsByYearSchema.parse({
			year,
			page,
			perPage,
		});

		// Calculate pagination
		const skip = (validatedData.page - 1) * validatedData.perPage;
		const take = validatedData.perPage;

		// Get total count for the year
		const totalCount = await prisma.result.count({
			where: { year: validatedData.year },
			cacheStrategy: defaultCacheStrategy,
		});

		// Get paginated results
		const results = await prisma.result.findMany({
			where: { year: validatedData.year },
			include: {
				Subjects: true,
			},
			skip,
			take,
			orderBy: {
				rollNo: "asc",
			},
			cacheStrategy: defaultCacheStrategy,
		});

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / validatedData.perPage);
		const hasNextPage = validatedData.page < totalPages;
		const hasPreviousPage = validatedData.page > 1;

		return c.json(
			{
				success: true,
				data: results,
				pagination: {
					currentPage: validatedData.page,
					perPage: validatedData.perPage,
					totalCount,
					totalPages,
					hasNextPage,
					hasPreviousPage,
				},
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

		console.error("Get results by year error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
};
