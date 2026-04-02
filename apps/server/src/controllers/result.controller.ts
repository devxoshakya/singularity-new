import type { Context } from "hono";
import prisma from "@singularity/db";
import {
	getResultByRollNoSchema,
	getResultsByYearSchema,
} from "@/schemas/result.schema";
import type { HonoContext } from "@/types/context";

type CarryOverItem = {
	sem: string;
	cop: string;
	name?: string;
};

type SemesterItem = {
	semester: string;
	evenOdd: string;
	totalMarksObtained: number;
	resultStatus: string;
	SGPA: number;
	dateOfDeclaration: string;
	subjects: Array<{
		code: string;
		name: string;
		type: string;
		internal: string;
		external: string;
		backPaper: string;
		grade: string;
	}>;
};

type SemesterFilter =
	| { kind: "all" }
	| { kind: "latest" }
	| { kind: "exact"; semester: number };

const sanitizeCarryOvers = (value: unknown): CarryOverItem[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((entry): entry is Record<string, unknown> =>
			typeof entry === "object" && entry !== null && !Array.isArray(entry),
		)
		.map((entry) => ({
			sem: String(entry.sem ?? "").trim(),
			cop: String(entry.cop ?? "").trim(),
			name: entry.name == null ? undefined : String(entry.name).trim(),
		}))
		.filter((entry) => entry.cop.length > 0);
};

const getSemesterNumber = (semesterLabel: string): number => {
	const match = String(semesterLabel).match(/\d+/);
	return match ? Number(match[0]) : -1;
};

const parseSemesterFilter = (
	semQuery: string | undefined,
): SemesterFilter | null => {
	if (!semQuery || semQuery === "all") {
		return { kind: "all" };
	}

	const normalized = semQuery.trim().toLowerCase();
	if (normalized === "latest") {
		return { kind: "latest" };
	}

	const semester = Number.parseInt(normalized, 10);
	if (Number.isInteger(semester) && semester >= 1 && semester <= 8) {
		return { kind: "exact", semester };
	}

	return null;
};

const filterSemesters = (
	semesters: SemesterItem[],
	semesterFilter: SemesterFilter,
	latestSemester: number | null = null,
): SemesterItem[] => {
	if (semesterFilter.kind === "all") {
		return semesters;
	}

	if (semesterFilter.kind === "exact") {
		return semesters.filter(
			(entry) => getSemesterNumber(entry.semester) === semesterFilter.semester,
		);
	}

	const resolvedLatestSemester =
		latestSemester ??
		semesters.reduce((max, entry) => Math.max(max, getSemesterNumber(entry.semester)), -1);

	if (resolvedLatestSemester < 1) {
		return [];
	}

	return semesters.filter(
		(entry) => getSemesterNumber(entry.semester) === resolvedLatestSemester,
	);
};

const getPrimarySemesterPayload = (semesters: SemesterItem[]) => {
	const primarySemester = semesters[0];
	if (!primarySemester) {
		return {};
	}

	return {
		semester: primarySemester.semester,
		evenOdd: primarySemester.evenOdd,
		totalMarksObtained: primarySemester.totalMarksObtained,
		resultStatus: primarySemester.resultStatus,
		SGPA: primarySemester.SGPA,
		dateOfDeclaration: primarySemester.dateOfDeclaration,
		subjects: primarySemester.subjects,
	};
};

const sanitizeSemesters = (value: unknown): SemesterItem[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	const semesters = value
		.filter((entry): entry is Record<string, unknown> =>
			typeof entry === "object" && entry !== null,
		)
		.map((entry) => {
			const subjectsRaw = Array.isArray(entry.subjects) ? entry.subjects : [];
			const subjects = subjectsRaw
				.filter((subject): subject is Record<string, unknown> =>
					typeof subject === "object" && subject !== null,
				)
				.map((subject) => ({
					code: String(subject.code ?? "").trim(),
					name: String(subject.name ?? "").trim(),
					type: String(subject.type ?? "").trim(),
					internal: String(subject.internal ?? "").trim(),
					external: String(subject.external ?? "").trim(),
					backPaper: String(subject.backPaper ?? "").trim(),
					grade: String(subject.grade ?? "").trim(),
				}));

			return {
				semester: String(entry.semester ?? "").trim(),
				evenOdd: String(entry.evenOdd ?? "").trim(),
				totalMarksObtained: Number(entry.totalMarksObtained ?? 0) || 0,
				resultStatus: String(entry.resultStatus ?? "").trim(),
				SGPA: Number(entry.SGPA ?? 0) || 0,
				dateOfDeclaration: String(entry.dateOfDeclaration ?? "").trim(),
				subjects,
			};
		});

	semesters.sort(
		(a, b) => getSemesterNumber(a.semester) - getSemesterNumber(b.semester),
	);

	return semesters;
};

/**
 * GET /api/result/cache
 * Get all student records with minimal fields (id, fullName, rollNo, branch)
 * Sorted by latest semester SGPA in descending order
 * Used for quick lookups (no server-side caching)
 */
export const getStudentsCacheController = async (c: Context<HonoContext>) => {
	try {
		// Get all students with semesters and year for sorting
		const students = await prisma.result.findMany({
			select: {
				id: true,
				fullName: true,
				rollNo: true,
				branch: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
				year: true,
			},
		});

		const getSemesterNumber = (semesterLabel: string): number => {
			const match = semesterLabel.match(/\d+/);
			return match ? Number(match[0]) : -1;
		};

		// Pick SGPA from the latest semester entry.
		const getLatestSGPA = (
			semesters: Array<{ semester: string; SGPA: number }>,
		): number | null => {
			if (!Array.isArray(semesters) || semesters.length === 0) return null;

			const latestSemester = semesters.reduce((latest, current) => {
				return getSemesterNumber(current.semester) >
					getSemesterNumber(latest.semester)
					? current
					: latest;
			});

			return Number.isFinite(latestSemester.SGPA)
				? latestSemester.SGPA
				: null;
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
			sortSGPA: getLatestSGPA(student.semesters),
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
		const sem = c.req.query("sem");

		if (!rollNo) {
			return c.json({ error: "Roll number is required" }, 400);
		}

		const semesterFilter = parseSemesterFilter(sem);
		if (!semesterFilter) {
			return c.json(
				{ error: "Invalid `sem` query param. Use 1..8 or `latest`." },
				400,
			);
		}

		// Validate input
		const validatedData = getResultByRollNoSchema.parse({ rollNo });

		// Read typed fields first (excluding CarryOvers) to avoid malformed legacy data decode errors.
		const result = await prisma.result.findFirst({
			where: { rollNo: validatedData.rollNo },
			select: {
				id: true,
				rollNo: true,
				enrollmentNo: true,
				fullName: true,
				fatherName: true,
				course: true,
				branch: true,
				instituteName: true,
				blocked: true,
				year: true,
				cgpa: true,
				divison: true,
				totalMarksObtained: true,
				latestResultStatus: true,
				latestCOP: true,
				semesters: true,
			},
		});

		if (!result) {
			return c.json(
				{ error: "Result not found for the provided roll number" },
				404,
			);
		}

		const rawResult = await prisma.result.findRaw({
			filter: { rollNo: validatedData.rollNo },
			options: {
				limit: 1,
				projection: {
					CarryOvers: 1,
				},
			},
		});

		const carryOvers = sanitizeCarryOvers(
			Array.isArray(rawResult) ? rawResult[0]?.CarryOvers : undefined,
		);
		const sanitizedSemesters = sanitizeSemesters(result.semesters);
		const filteredSemesters = filterSemesters(sanitizedSemesters, semesterFilter);
		const primarySemesterPayload = getPrimarySemesterPayload(filteredSemesters);
		const includeSemesters = semesterFilter.kind === "all";
		const { semesters: _resultSemesters, ...resultWithoutSemesters } = result;

		return c.json(
			{
				success: true,
				data: {
					...(includeSemesters
						? { ...result, semesters: filteredSemesters }
						: resultWithoutSemesters),
					...primarySemesterPayload,
					CarryOvers: carryOvers,
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
		const sem = c.req.query("sem");

		if (!year) {
			return c.json({ error: "Year is required" }, 400);
		}

		const semesterFilter = parseSemesterFilter(sem);
		if (!semesterFilter) {
			return c.json(
				{ error: "Invalid `sem` query param. Use 1..8 or `latest`." },
				400,
			);
		}

		// Validate input
		const validatedData = getResultsByYearSchema.parse({
			year,
		});

		const batchSize = 300;
		const results: Array<Record<string, any>> = [];
		let lastRollNo: string | null = null;

		while (true) {
			const batch = await prisma.result.findMany({
				where: { year: validatedData.year },
				select: {
					id: true,
					rollNo: true,
					enrollmentNo: true,
					fullName: true,
					fatherName: true,
					course: true,
					branch: true,
					instituteName: true,
					blocked: true,
					year: true,
					cgpa: true,
					divison: true,
					totalMarksObtained: true,
					latestResultStatus: true,
					latestCOP: true,
					semesters: true,
				},
				orderBy: {
					rollNo: "asc",
				},
				take: batchSize,
				...(lastRollNo
					? {
						cursor: { rollNo: lastRollNo },
						skip: 1,
					}
					: {}),
			});

			if (batch.length === 0) {
				break;
			}

			const rollNos = batch.map((student) => student.rollNo);
			const rawCarryOversBatch = await prisma.result.findRaw({
				filter: {
					year: validatedData.year,
					rollNo: { $in: rollNos },
				},
				options: {
					projection: {
						rollNo: 1,
						CarryOvers: 1,
					},
				},
			});

			const carryOverByRollNo = new Map<string, CarryOverItem[]>();
			if (Array.isArray(rawCarryOversBatch)) {
				rawCarryOversBatch.forEach((doc: any) => {
					const key = String(doc?.rollNo ?? "").trim();
					if (key.length > 0) {
						carryOverByRollNo.set(key, sanitizeCarryOvers(doc?.CarryOvers));
					}
				});
			}

			const normalizedBatch = batch.map((student) => ({
				...student,
				CarryOvers: carryOverByRollNo.get(student.rollNo) ?? [],
				semesters: sanitizeSemesters(student.semesters),
			}));

			results.push(...normalizedBatch);
			lastRollNo = batch[batch.length - 1]?.rollNo ?? null;

			if (batch.length < batchSize) {
				break;
			}
		}

		let filteredResults = results;
		const includeSemesters = semesterFilter.kind === "all";

		if (semesterFilter.kind === "exact") {
			filteredResults = results
				.map((student) => ({
					constSemesters: filterSemesters(student.semesters, semesterFilter),
					student,
				}))
				.filter(({ constSemesters }) => constSemesters.length > 0)
				.map(({ student, constSemesters }) => ({
					...(includeSemesters
						? { ...student, semesters: constSemesters }
						: (({ semesters: _studentSemesters, ...studentWithoutSemesters }) =>
							studentWithoutSemesters)(student)),
					...getPrimarySemesterPayload(constSemesters),
				}));
		} else if (semesterFilter.kind === "latest") {
			const maxSemester = results.reduce((max, student) => {
				const studentMax = (student.semesters as SemesterItem[]).reduce(
					(acc, semesterEntry) => Math.max(acc, getSemesterNumber(semesterEntry.semester)),
					-1,
				);
				return Math.max(max, studentMax);
			}, -1);

			filteredResults =
				maxSemester < 1
					? []
					: results
						.map((student) => ({
							constSemesters: filterSemesters(
								student.semesters,
								semesterFilter,
								maxSemester,
							),
							student,
						}))
						.filter(({ constSemesters }) => constSemesters.length > 0)
						.map(({ student, constSemesters }) => ({
							...(includeSemesters
								? { ...student, semesters: constSemesters }
								: (({ semesters: _studentSemesters, ...studentWithoutSemesters }) =>
									studentWithoutSemesters)(student)),
							...getPrimarySemesterPayload(constSemesters),
						}));
		} else {
			filteredResults = results.map((student) => ({
				...(includeSemesters
					? student
					: (({ semesters: _studentSemesters, ...studentWithoutSemesters }) =>
						studentWithoutSemesters)(student)),
				...getPrimarySemesterPayload(student.semesters),
			}));
		}

		return c.json(
			{
				success: true,
				data: filteredResults,
				totalCount: filteredResults.length,
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
