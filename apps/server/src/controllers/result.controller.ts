import type { Context } from "hono";
import prisma from "@singularity/db";
import {
	getResultByRollNoSchema,
	getResultsByYearSchema,
} from "@/schemas/result.schema";
import type { HonoContext } from "@/types/context";

/**
 * GET /api/result/cache
 * Get all student records with minimal fields (id, fullName, rollNo, branch)
 * Sorted by latest semester SGPA in descending order
 * Used for quick lookups (no server-side caching)
 */
export const getStudentsCacheController = async (c: Context<HonoContext>) => {
	try {
		// Get all students with SGPA and year for sorting
		const students = await prisma.result.findMany({
			select: {
				id: true,
				fullName: true,
				rollNo: true,
				branch: true,
				SGPA: true,
				year: true,
			},
		});

		// Helper function to get the latest semester SGPA (checking all semesters)
		const getLatestSGPA = (sgpaData: any): number | null => {
			if (!sgpaData) return null;
			
			// Check all semesters from sem8 down to sem1 to find the latest available
			for (let sem = 8; sem >= 1; sem--) {
				const semKey = `sem${sem}`;
				if (sgpaData[semKey] !== undefined && sgpaData[semKey] !== null) {
					return Number(sgpaData[semKey]);
				}
			}
			return null;
		};

		// Calculate latest SGPA for sorting
		const studentsWithSGPA = students.map(student => ({
			student: {
				id: student.id,
				fullName: student.fullName,
				rollNo: student.rollNo,
				branch: student.branch,
				year: student.year,
			},
			sortSGPA: getLatestSGPA(student.SGPA),
		}));

		// Sort by latest SGPA (descending), null values at the end
		studentsWithSGPA.sort((a, b) => {
			if (a.sortSGPA === null && b.sortSGPA === null) return 0;
			if (a.sortSGPA === null) return 1;
			if (b.sortSGPA === null) return -1;
			return b.sortSGPA - a.sortSGPA;
		});

		// Extract only student data (without SGPA)
		const sortedStudents = studentsWithSGPA.map(item => item.student);

		return c.json(
			{
				success: true,
				data: sortedStudents,
				count: sortedStudents.length,
			},
			200,
		);
	} catch (error: any) {
		console.error("Get students cache error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
};

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
 * GET /api/result/by-year?year=1
 * Get all students by year
 */
export const getResultsByYearController = async (c: Context<HonoContext>) => {
	try {
		// Get query parameters
		const year = c.req.query("year");

		if (!year) {
			return c.json({ error: "Year is required" }, 400);
		}

		// Validate input
		const validatedData = getResultsByYearSchema.parse({
			year,
		});

		// Get all results for the year
		const results = await prisma.result.findMany({
			where: { year: validatedData.year },
			include: {
				Subjects: true,
			},
			orderBy: {
				rollNo: "asc",
			},
		});

		return c.json(
			{
				success: true,
				data: results,
				totalCount: results.length,
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
