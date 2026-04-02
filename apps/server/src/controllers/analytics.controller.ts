import type { Context } from "hono";
import prisma from "@singularity/db";
import type { HonoContext } from "@/types/context";

/**
 * Normalize carry over payload and return active carry over count.
 * Data may be [{ session, sem, cop }, ...] OR [["No Backlogs"]].
 */
const getCarryOverCount = (carryOvers: any[] | null | undefined): number => {
	if (!Array.isArray(carryOvers) || carryOvers.length === 0) {
		return 0;
	}

	let count = 0;

	for (const entry of carryOvers) {
		if (Array.isArray(entry)) {
			const normalized = entry
				.map((item) => String(item).trim().toLowerCase())
				.join(" ");
			if (normalized.includes("no backlogs")) {
				continue;
			}
			if (entry.length > 0) {
				count += 1;
			}
			continue;
		}

		if (typeof entry === "object" && entry !== null) {
			const copValue = String((entry as any).cop ?? "").trim();
			const codes = copValue.replace(/COP\s*:/i, "").trim();

			if (codes.length === 0) {
				continue;
			}

			if (codes.toLowerCase().includes("no backlogs")) {
				continue;
			}

			count += 1;
			continue;
		}

		const normalized = String(entry).trim().toLowerCase();
		if (!normalized || normalized.includes("no backlogs")) {
			continue;
		}
		count += 1;
	}

	return count;
};

/**
 * Student status rules (updated):
 * - Pass: 0 carry overs
 * - PCP: <= 2 carry overs
 * - Fail: >= 3 carry overs
 */
const classifyStudentStatus = (carryOvers: any[]): "Pass" | "PCP" | "Fail" => {
	const carryOverCount = getCarryOverCount(carryOvers);

	if (carryOverCount === 0) return "Pass";
	if (carryOverCount <= 2) return "PCP";
	return "Fail";
};

const parseCopCodes = (copValue: string | null | undefined): string[] => {
	if (!copValue) return [];
	const normalized = String(copValue).replace(/COP\s*:/i, "").trim();
	if (!normalized || normalized.toLowerCase().includes("no backlogs")) {
		return [];
	}
	return normalized
		.split(",")
		.map((code) => code.trim())
		.filter(Boolean);
};

const parseSemesterList = (semValue: string | null | undefined): number[] => {
	if (!semValue) return [];
	return Array.from(
		new Set(
			String(semValue)
				.split(",")
				.map((v) => parseInt(v.trim(), 10))
				.filter((v) => !Number.isNaN(v) && v >= 1 && v <= 8),
		),
	).sort((a, b) => a - b);
};

const getLatestCopCodeSet = (latestCOP: string | null | undefined): Set<string> => {
	return new Set(parseCopCodes(latestCOP));
};

type CarryOverHistoryRecord = {
	session: string;
	sems: number[];
	codes: string[];
};

const getCarryOverHistoryRecords = (carryOvers: any[] | null | undefined): CarryOverHistoryRecord[] => {
	if (!Array.isArray(carryOvers) || carryOvers.length === 0) {
		return [];
	}

	const records: CarryOverHistoryRecord[] = [];

	carryOvers.forEach((entry) => {
		if (Array.isArray(entry)) {
			const normalized = entry.map((item) => String(item).toLowerCase()).join(" ");
			if (normalized.includes("no backlogs")) return;
			const codes = entry.map((item) => String(item).trim()).filter(Boolean);
			if (codes.length > 0) {
				records.push({
					session: "Unknown",
					sems: [],
					codes,
				});
			}
			return;
		}

		if (typeof entry === "object" && entry !== null) {
			const codes = parseCopCodes((entry as any).cop);
			if (codes.length === 0) return;
			records.push({
				session: String((entry as any).session ?? "Unknown"),
				sems: parseSemesterList((entry as any).sem),
				codes,
			});
		}
	});

	return records;
};

type SemesterSgpaEntry = {
	semester: string;
	SGPA: number;
};

const getSemesterNumber = (semesterLabel: string): number => {
	const match = String(semesterLabel).match(/\d+/);
	return match ? Number(match[0]) : -1;
};

const getSgpaValues = (sgpaData: any): number[] => {
	if (!sgpaData) return [];

	if (Array.isArray(sgpaData)) {
		return [...sgpaData]
			.sort(
				(a, b) =>
					getSemesterNumber((a as SemesterSgpaEntry).semester) -
					getSemesterNumber((b as SemesterSgpaEntry).semester),
			)
			.map((entry) => Number((entry as SemesterSgpaEntry).SGPA))
			.filter((value) => Number.isFinite(value));
	}

	const sgpaValues: number[] = [];
	for (let sem = 1; sem <= 8; sem++) {
		const semKey = `sem${sem}`;
		const value = sgpaData[semKey];
		if (value !== undefined && value !== null) {
			sgpaValues.push(Number(value));
		}
	}

	return sgpaValues.filter((value) => Number.isFinite(value));
};

const getSemesterSGPA = (sgpaData: any, semester: number): number | null => {
	if (!sgpaData) return null;

	if (Array.isArray(sgpaData)) {
		const match = sgpaData.find(
			(entry: SemesterSgpaEntry) =>
				getSemesterNumber(entry.semester) === semester,
		);
		if (!match) return null;
		return Number.isFinite(Number(match.SGPA)) ? Number(match.SGPA) : null;
	}

	const semKey = `sem${semester}`;
	if (sgpaData[semKey] === undefined || sgpaData[semKey] === null) {
		return null;
	}

	const value = Number(sgpaData[semKey]);
	return Number.isFinite(value) ? value : null;
};

const getLatestSGPA = (sgpaData: any): number | null => {
	const values = getSgpaValues(sgpaData);
	if (values.length === 0) return null;
	return values[values.length - 1] ?? null;
};

const calculateAverageSGPA = (sgpaData: any): number | null => {
	const sgpaValues = getSgpaValues(sgpaData);
	if (sgpaValues.length === 0) return null;
	const sum = sgpaValues.reduce((acc, val) => acc + val, 0);
	return sum / sgpaValues.length;
};

/**
 * Helper function to normalize branch names to shorthand
 */
const normalizeBranchName = (branch: string): string => {
	const branchMap: Record<string, string> = {
		"COMPUTER SCIENCE AND ENGINEERINGARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "CSE-AIML",
		"COMPUTER SCIENCE AND ENGINEERING ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "CSE-AIML",
		"COMPUTER SCIENCE AND ENGINEERING ARTIFICIAL INTELLIGENCE": "CSE-AI",
		"COMPUTER SCIENCE AND ENGINEERINGDATA SCIENCE": "CSE-DS",
		"COMPUTER SCIENCE AND ENGINEERING DATA SCIENCE": "CSE-DS",
		"COMPUTER SCIENCE AND ENGINEERINGINTERNET OF THINGS": "CSE-IoT",
		"COMPUTER SCIENCE AND ENGINEERING INTERNET OF THINGS": "CSE-IoT",
		"COMPUTER SCIENCE AND ENGINEERING": "CSE",
		"COMPUTER SCIENCE AND INFORMATION TECHNOLOGY": "CSIT",
		"COMPUTER SCIENCE": "CS",
		"INFORMATION TECHNOLOGY": "IT",
		"ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
		"ELECTRICAL ENGINEERING": "EE",
		"MECHANICAL ENGINEERING": "ME",
		"BIOTECHNOLOGY": "BT",
	};

	// Check for exact match first
	if (branchMap[branch]) {
		return branchMap[branch];
	}

	// If no exact match, check if any key is contained in the branch name
	for (const [key, value] of Object.entries(branchMap)) {
		if (branch.includes(key)) {
			return value;
		}
	}

	// If still no match, create abbreviation from words > 3 chars
	const words = branch.split(/\s+/).filter(w => w.length > 3);
	if (words.length > 1) {
		return words.map(w => w[0]).join("");
	}

	return branch;
};

/**
 * GET /api/analytics/student-status-distribution
 * Returns Pass/PCP/Fail distribution for pie chart
 * 
 * Query Params:
 * - year (optional): Filter by year (1,2,3,4)
 * - branch (optional): Filter by branch shorthand (CSE, CSE-DS, etc.)
 * - semester (optional): Not used in this version
 */
export const getStudentStatusDistributionController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");
		const branch = c.req.query("branch");

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get all students matching filter
		const students = await prisma.result.findMany({
			where,
			select: {
				latestResultStatus: true,
				CarryOvers: true,
				latestCOP: true,
				branch: true,
			},
		});

		// Filter by branch if provided
		let filteredStudents = students;
		if (branch && branch !== "all") {
			filteredStudents = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		// Classify students
		const statusCounts = {
			Pass: 0,
			PCP: 0,
			Fail: 0,
		};

		filteredStudents.forEach((student) => {
			const status = classifyStudentStatus(student.CarryOvers as any[]);
			statusCounts[status]++;
		});

		const total = filteredStudents.length;

		// Create distribution array
		const distribution = [
			{
				status: "Pass",
				count: statusCounts.Pass,
				percentage: total > 0 ? (statusCounts.Pass / total) * 100 : 0,
				fill: "var(--chart-1)",
			},
			{
				status: "PCP",
				count: statusCounts.PCP,
				percentage: total > 0 ? (statusCounts.PCP / total) * 100 : 0,
				fill: "var(--chart-2)",
			},
			{
				status: "Fail",
				count: statusCounts.Fail,
				percentage: total > 0 ? (statusCounts.Fail / total) * 100 : 0,
				fill: "var(--chart-3)",
			},
		];

		return c.json(
			{
				success: true,
				data: {
					total,
					distribution,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("Student status distribution error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/branch-status-breakdown
 * Returns branch-wise Pass/PCP/Fail breakdown for grouped bar chart
 * 
 * Query Params:
 * - year (optional): Filter by year
 * - semester (optional): Not used in this version
 */
export const getBranchStatusBreakdownController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get all students matching filter
		const students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				latestResultStatus: true,
				CarryOvers: true,
				latestCOP: true,
			},
		});

		// Group by normalized branch name
		const branchData: Record<
			string,
			{
				pass: number;
				pcp: number;
				fail: number;
				total: number;
			}
		> = {};

		students.forEach((student) => {
			const normalizedBranch = normalizeBranchName(student.branch);
			const status = classifyStudentStatus(student.CarryOvers as any[]);

			if (!branchData[normalizedBranch]) {
				branchData[normalizedBranch] = {
					pass: 0,
					pcp: 0,
					fail: 0,
					total: 0,
				};
			}

			branchData[normalizedBranch].total++;
			if (status === "Pass") branchData[normalizedBranch].pass++;
			else if (status === "PCP") branchData[normalizedBranch].pcp++;
			else if (status === "Fail") branchData[normalizedBranch].fail++;
		});

		// Convert to array format
		const result = Object.entries(branchData).map(([branch, data]) => ({
			branch,
			pass: data.pass,
			pcp: data.pcp,
			fail: data.fail,
			total: data.total,
			passRate: data.total > 0 ? (data.pass / data.total) * 100 : 0,
		}));

		// Sort by total students descending
		result.sort((a, b) => b.total - a.total);

		return c.json(
			{
				success: true,
				data: result,
			},
			200,
		);
	} catch (error: any) {
		console.error("Branch status breakdown error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/year-branch-comparison
 * Returns year-wise average SGPA comparison across branches for area chart
 * 
 * Query Params:
 * - years (optional): Comma-separated years (default: "1,2,3,4")
 * - branches (optional): Comma-separated branch shorthands or "all"
 * - metric (optional): "avgSgpa" (default) | "passRate" | "avgMarks"
 */
export const getYearBranchComparisonController = async (
	c: Context<HonoContext>,
) => {
	try {
		const yearsParam = c.req.query("years") || "1,2,3,4";
		const branchesParam = c.req.query("branches");
		const metric = c.req.query("metric") || "avgSgpa";

		// Parse years
		const years = yearsParam.split(",").map((y) => parseInt(y.trim(), 10));

		// Get all students
		const students = await prisma.result.findMany({
			select: {
				year: true,
				branch: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
				totalMarksObtained: true,
				latestResultStatus: true,
				CarryOvers: true,
				latestCOP: true,
			},
		});

		// Get unique branches
		const uniqueBranches = new Set<string>();
		students.forEach((s) => {
			uniqueBranches.add(normalizeBranchName(s.branch));
		});

		// Filter branches if specified
		let branchesToInclude = Array.from(uniqueBranches);
		if (branchesParam && branchesParam !== "all") {
			const requestedBranches = branchesParam.split(",").map((b) => b.trim());
			branchesToInclude = branchesToInclude.filter((b) =>
				requestedBranches.includes(b),
			);
		}

		// Sort branches alphabetically
		branchesToInclude.sort();

		// Calculate metrics for each year and branch
		const yearData: any[] = [];

		years.forEach((year) => {
			const yearStudents = students.filter((s) => s.year === year);

			const dataPoint: any = { year };

			branchesToInclude.forEach((branch) => {
				const branchStudents = yearStudents.filter(
					(s) => normalizeBranchName(s.branch) === branch,
				);

				if (branchStudents.length === 0) {
					dataPoint[branch] = null;
					return;
				}

				if (metric === "avgSgpa") {
					// Calculate average SGPA
					const sgpaValues: number[] = [];
					branchStudents.forEach((s) => {
						const avgSgpa = calculateAverageSGPA(s.semesters);
						if (avgSgpa !== null) sgpaValues.push(avgSgpa);
					});

					dataPoint[branch] =
						sgpaValues.length > 0
							? sgpaValues.reduce((acc, val) => acc + val, 0) /
								sgpaValues.length
							: null;
				} else if (metric === "passRate") {
					// Calculate pass rate
					const passCount = branchStudents.filter((s) => {
						const status = classifyStudentStatus(s.CarryOvers as any[]);
						return status === "Pass";
					}).length;

					dataPoint[branch] = (passCount / branchStudents.length) * 100;
				} else if (metric === "avgMarks") {
					// Calculate average total marks
					const validMarks = branchStudents
						.map((s) => s.totalMarksObtained)
						.filter((m) => m > 0);

					dataPoint[branch] =
						validMarks.length > 0
							? validMarks.reduce((acc, val) => acc + val, 0) /
								validMarks.length
							: null;
				}

				// Round to 2 decimal places if not null
				if (dataPoint[branch] !== null) {
					dataPoint[branch] = Math.round(dataPoint[branch] * 100) / 100;
				}
			});

			yearData.push(dataPoint);
		});

		return c.json(
			{
				success: true,
				data: {
					years: yearData,
					branches: branchesToInclude,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("Year branch comparison error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/performance-metrics
 * Returns key performance indicators for dashboard stats cards
 * 
 * Query Params:
 * - years (required): Two comma-separated years, e.g. "1,2"
 *   (backward compatible fallback: year + compareWith)
 * - branch (optional): Filter by branch
 */
export const getPerformanceMetricsController = async (
	c: Context<HonoContext>,
) => {
	try {
		const branch = c.req.query("branch");
		const yearsParam = c.req.query("years");
		const year = c.req.query("year");
		const compareWith = c.req.query("compareWith");

		let years: number[] = [];
		if (yearsParam) {
			years = yearsParam
				.split(",")
				.map((y) => parseInt(y.trim(), 10))
				.filter((y) => !Number.isNaN(y));
		} else if (year && compareWith) {
			const y1 = parseInt(year, 10);
			const y2 = parseInt(compareWith, 10);
			if (!Number.isNaN(y1) && !Number.isNaN(y2)) {
				years = [y1, y2];
			}
		}

		const uniqueYears = Array.from(new Set(years));
		if (uniqueYears.length !== 2) {
			return c.json(
				{
					success: false,
					error: "Please provide exactly 2 years using `years=Y1,Y2` (or `year` and `compareWith`).",
				},
				400,
			);
		}

		const [baseYear, compareYear] = uniqueYears;

		const allStudents = await prisma.result.findMany({
			where: {
				year: {
					in: uniqueYears,
				},
			},
			select: {
				branch: true,
				year: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
				totalMarksObtained: true,
				CarryOvers: true,
			},
		});

		const branchFilter = branch && branch !== "all" ? branch : null;
		const filtered = branchFilter
			? allStudents.filter((s) => normalizeBranchName(s.branch) === branchFilter)
			: allStudents;

		const baseStudents = filtered.filter((s) => s.year === baseYear);
		const compareStudents = filtered.filter((s) => s.year === compareYear);

		const buildMetrics = (students: typeof baseStudents) => {
			const totalStudents = students.length;
			const sgpaValues = students
				.map((s) => calculateAverageSGPA(s.semesters))
				.filter((v): v is number => v !== null);

			const avgSgpa = sgpaValues.length > 0
				? sgpaValues.reduce((acc, val) => acc + val, 0) / sgpaValues.length
				: 0;

			const validMarks = students
				.map((s) => Number(s.totalMarksObtained || 0))
				.filter((m) => m > 0);
			const avgMarks = validMarks.length > 0
				? validMarks.reduce((acc, val) => acc + val, 0) / validMarks.length
				: 0;

			let passCount = 0;
			let pcpCount = 0;
			let failCount = 0;
			let topPerformers = 0;
			let withBacklogs = 0;

			students.forEach((s) => {
				const status = classifyStudentStatus(s.CarryOvers as any[]);
				if (status === "Pass") passCount++;
				else if (status === "PCP") pcpCount++;
				else failCount++;

				const studentAvgSgpa = calculateAverageSGPA(s.semesters);
				if (studentAvgSgpa !== null && studentAvgSgpa > 9.0) {
					topPerformers++;
				}

				if (getCarryOverCount(s.CarryOvers as any[]) > 0) {
					withBacklogs++;
				}
			});

			const passRate = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;

			return {
				year: students[0]?.year ?? null,
				avgSgpa: Math.round(avgSgpa * 100) / 100,
				avgMarks: Math.round(avgMarks * 100) / 100,
				passRate: Math.round(passRate * 100) / 100,
				totalStudents,
				topPerformers,
				withBacklogs,
				statusDistribution: {
					Pass: passCount,
					PCP: pcpCount,
					Fail: failCount,
				},
			};
		};

		const baseMetrics = buildMetrics(baseStudents);
		const compareMetrics = buildMetrics(compareStudents);

		const sgpaChange = compareMetrics.avgSgpa > 0
			? ((baseMetrics.avgSgpa - compareMetrics.avgSgpa) / compareMetrics.avgSgpa) * 100
			: 0;
		const passRateChange = compareMetrics.passRate > 0
			? ((baseMetrics.passRate - compareMetrics.passRate) / compareMetrics.passRate) * 100
			: 0;

		const comparison = {
			baseYear,
			compareYear,
			metrics: {
				avgSgpa: `${sgpaChange > 0 ? "+" : ""}${Math.round(sgpaChange * 10) / 10}%`,
				passRate: `${passRateChange > 0 ? "+" : ""}${Math.round(passRateChange * 10) / 10}%`,
				trend: sgpaChange > 0 ? "up" : sgpaChange < 0 ? "down" : "stable",
			},
		};

		const insights: string[] = [];
		if (sgpaChange > 0) {
			insights.push(`Average SGPA improved by ${Math.round(sgpaChange * 10) / 10}% from ${compareYear} to ${baseYear}.`);
		} else if (sgpaChange < 0) {
			insights.push(`Average SGPA decreased by ${Math.round(Math.abs(sgpaChange) * 10) / 10}% from ${compareYear} to ${baseYear}.`);
		}

		if (passRateChange > 0) {
			insights.push(`Pass rate increased by ${Math.round(passRateChange * 10) / 10}% from ${compareYear} to ${baseYear}.`);
		} else if (passRateChange < 0) {
			insights.push(`Pass rate decreased by ${Math.round(Math.abs(passRateChange) * 10) / 10}% from ${compareYear} to ${baseYear}.`);
		}

		if (insights.length === 0) {
			insights.push(`Performance remained stable between ${compareYear} and ${baseYear}.`);
		}

		return c.json(
			{
				success: true,
				data: {
					current: baseMetrics,
					compare: compareMetrics,
					comparison,
					insights,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("Performance metrics error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/semester-progression
 * Returns semester-wise performance progression for line charts
 * 
 * Query Params:
 * - year (optional): Filter by year
 * - branch (optional): Filter by branch
 * - cohort (optional): Filter by batch year (e.g., "2024")
 */
export const getSemesterProgressionController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");
		const branch = c.req.query("branch");

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get students matching filters
		let students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
				latestResultStatus: true,
				CarryOvers: true,
				latestCOP: true,
			},
		});

		// Filter by branch if provided
		if (branch && branch !== "all") {
			students = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		// Calculate semester-wise metrics
		const semesterData: any[] = [];

		for (let sem = 1; sem <= 8; sem++) {
			// Get all SGPA values for this semester
			const sgpaValues: number[] = [];
			students.forEach((s) => {
				const value = getSemesterSGPA(s.semesters, sem);
				if (value !== null) {
					sgpaValues.push(value);
				}
			});

			if (sgpaValues.length > 0) {
				// Calculate statistics
				const avg = sgpaValues.reduce((acc, val) => acc + val, 0) / sgpaValues.length;
				const max = Math.max(...sgpaValues);
				const min = Math.min(...sgpaValues);
				
				// Calculate pass rate for this semester (students with SGPA >= 5.0)
				const passCount = sgpaValues.filter(val => val >= 5.0).length;
				const passRate = (passCount / sgpaValues.length) * 100;

				semesterData.push({
					semester: sem,
					avgSgpa: Math.round(avg * 100) / 100,
					maxSgpa: Math.round(max * 100) / 100,
					minSgpa: Math.round(min * 100) / 100,
					students: sgpaValues.length,
					passRate: Math.round(passRate * 100) / 100,
				});
			}
		}

		// Calculate improvement
		let improvement: string | null = null;
		if (semesterData.length >= 2) {
			const firstSem = semesterData[0];
			const lastSem = semesterData[semesterData.length - 1];
			const improvementPercent = ((lastSem.avgSgpa - firstSem.avgSgpa) / firstSem.avgSgpa) * 100;
			improvement = `${improvementPercent > 0 ? "+" : ""}${Math.round(improvementPercent * 10) / 10}%`;
		}

		return c.json(
			{
				success: true,
				data: {
					semesters: semesterData,
					improvement,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("Semester progression error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/sgpa-range-distribution
 * Returns SGPA distribution in ranges for histogram/bar chart
 * 
 * Query Params:
 * - year (optional): Filter by year
 * - branch (optional): Filter by branch
 * - semester (optional): "latest" or specific semester number
 */
export const getSgpaRangeDistributionController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");
		const branch = c.req.query("branch");
		const semester = c.req.query("semester") || "latest";

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get students
		let students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
			},
		});

		// Filter by branch
		if (branch && branch !== "all") {
			students = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		// Extract SGPA values based on semester filter
		const sgpaValues: number[] = [];
		students.forEach((s) => {
			let sgpaValue: number | null = null;
			
			if (semester === "latest") {
				sgpaValue = getLatestSGPA(s.semesters);
			} else {
				const semNum = parseInt(semester, 10);
				if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
					sgpaValue = getSemesterSGPA(s.semesters, semNum);
				}
			}
			
			if (sgpaValue !== null) {
				sgpaValues.push(sgpaValue);
			}
		});

		// Define SGPA ranges
		const ranges = [
			{ min: 9.0, max: 10.0, label: "Outstanding", fill: "var(--chart-1)" },
			{ min: 8.0, max: 8.9, label: "Excellent", fill: "var(--chart-2)" },
			{ min: 7.0, max: 7.9, label: "Very Good", fill: "var(--chart-3)" },
			{ min: 6.0, max: 6.9, label: "Good", fill: "var(--chart-4)" },
			{ min: 5.0, max: 5.9, label: "Average", fill: "var(--chart-5)" },
			{ min: 0.0, max: 4.9, label: "Below Average", fill: "var(--chart-6)" },
		];

		// Count students in each range
		const distribution = ranges.map((range) => {
			const count = sgpaValues.filter(
				(val) => val >= range.min && val <= range.max,
			).length;
			return {
				range: `${range.min.toFixed(1)}-${range.max.toFixed(1)}`,
				count,
				label: range.label,
				fill: range.fill,
			};
		});

		// Calculate median and mode
		let median: number | null = null;
		let mode: string | null = null;

		if (sgpaValues.length > 0) {
			// Median
			const sorted = [...sgpaValues].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			const medianValue = sorted.length % 2 === 0
				? (sorted[mid - 1]! + sorted[mid]!) / 2
				: sorted[mid]!;
			median = Math.round(medianValue * 100) / 100;

			// Mode (most common range)
			const maxCount = Math.max(...distribution.map(d => d.count));
			const modeRange = distribution.find(d => d.count === maxCount);
			mode = modeRange ? modeRange.range : null;
		}

		return c.json(
			{
				success: true,
				data: {
					ranges: distribution,
					median,
					mode,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("SGPA range distribution error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/backlog-analysis
 * Returns backlog statistics for stacked bar chart
 * 
 * Query Params:
 * - year (required): Filter by year (required to avoid heavy full-dataset scans)
 * - branch (optional): Filter by branch
 * - groupBy (optional): "semester" | "subject" | "branch" (default: "semester")
 */
export const getBacklogAnalysisController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");
		const branch = c.req.query("branch");
		const groupBy = c.req.query("groupBy") || "semester";

		if (!year || year === "all") {
			return c.json(
				{
					success: false,
					error: "`year` query param is required for backlog analysis.",
				},
				400,
			);
		}

		const yearNum = parseInt(year, 10);
		if (Number.isNaN(yearNum)) {
			return c.json(
				{
					success: false,
					error: "Invalid `year` query param.",
				},
				400,
			);
		}

		// Build filter
		const where: any = { year: yearNum };

		// Get students with subjects
		let students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				CarryOvers: true,
				latestCOP: true,
				latestResultStatus: true,
			},
		});

		// Filter by branch
		if (branch && branch !== "all") {
			students = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		let analysisData: any[] = [];
		let totals = {
			students: students.length,
			studentsWithBacklogs: 0,
			activeBacklogs: 0,
			clearedBacklogs: 0,
			totalBacklogs: 0,
		};

		const studentBacklogSummaries = students.map((s) => {
			const records = getCarryOverHistoryRecords(s.CarryOvers as any[]);
			const latestActiveCodes = getLatestCopCodeSet(s.latestCOP);

			let active = 0;
			let cleared = 0;

			records.forEach((record) => {
				record.codes.forEach((code) => {
					if (latestActiveCodes.has(code)) active += 1;
					else cleared += 1;
				});
			});

			const total = active + cleared;
			if (total > 0) {
				totals.studentsWithBacklogs += 1;
			}

			totals.activeBacklogs += active;
			totals.clearedBacklogs += cleared;
			totals.totalBacklogs += total;

			return {
				branch: normalizeBranchName(s.branch),
				records,
				latestActiveCodes,
				active,
				cleared,
				total,
			};
		});

		if (groupBy === "branch") {
			const branchData: Record<string, { active: number; cleared: number; total: number }> = {};

			studentBacklogSummaries.forEach((summary) => {
				const bucket = (branchData[summary.branch] ??= {
					active: 0,
					cleared: 0,
					total: 0,
				});
				bucket.active += summary.active;
				bucket.cleared += summary.cleared;
				bucket.total += summary.total;
			});

			analysisData = Object.entries(branchData).map(([branchName, data]) => ({
				category: branchName,
				activeBacklogs: data.active,
				clearedBacklogs: data.cleared,
				totalBacklogs: data.total,
				clearanceRate: data.total > 0 
					? Math.round((data.cleared / data.total) * 100 * 10) / 10
					: 0,
			}));

		} else if (groupBy === "semester") {
			const semesterData: Record<number, { active: number; cleared: number; total: number }> = {};

			studentBacklogSummaries.forEach((summary) => {
				summary.records.forEach((record) => {
					const sems = record.sems.length > 0 ? record.sems : [1];
					record.codes.forEach((code) => {
						sems.forEach((sem) => {
							if (!semesterData[sem]) {
								semesterData[sem] = { active: 0, cleared: 0, total: 0 };
							}

							semesterData[sem].total += 1;
							if (summary.latestActiveCodes.has(code)) {
								semesterData[sem].active += 1;
							} else {
								semesterData[sem].cleared += 1;
							}
						});
					});
				});
			});

			analysisData = Object.entries(semesterData)
				.filter(([_, data]) => data.total > 0)
				.map(([sem, data]) => ({
					category: `Semester ${sem}`,
					activeBacklogs: data.active,
					clearedBacklogs: data.cleared,
					totalBacklogs: data.total,
					clearanceRate: data.total > 0 
						? Math.round((data.cleared / data.total) * 100 * 10) / 10
						: 0,
				}));

		} else if (groupBy === "subject") {
			const subjectData: Record<string, { active: number; cleared: number; total: number }> = {};

			studentBacklogSummaries.forEach((summary) => {
				summary.records.forEach((record) => {
					record.codes.forEach((code) => {
						if (!subjectData[code]) {
							subjectData[code] = { active: 0, cleared: 0, total: 0 };
						}
						subjectData[code].total += 1;
						if (summary.latestActiveCodes.has(code)) subjectData[code].active += 1;
						else subjectData[code].cleared += 1;
					});
				});
			});

			analysisData = Object.entries(subjectData)
				.map(([subject, data]) => ({
					category: subject,
					activeBacklogs: data.active,
					clearedBacklogs: data.cleared,
					totalBacklogs: data.total,
					clearanceRate: data.total > 0 
						? Math.round((data.cleared / data.total) * 100 * 10) / 10
						: 0,
				}))
				.sort((a, b) => b.totalBacklogs - a.totalBacklogs)
				.slice(0, 10); // Top 10 subjects
		}

		return c.json(
			{
				success: true,
				data: analysisData,
				meta: {
					year: yearNum,
					groupBy,
					...totals,
					clearanceRate:
						totals.totalBacklogs > 0
							? Math.round((totals.clearedBacklogs / totals.totalBacklogs) * 1000) / 10
							: 0,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("Backlog analysis error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/branch-performance-radar
 * Returns multi-dimensional performance metrics for each branch (radar chart)
 * 
 * Query Params:
 * - year (optional): Filter by year
 */
export const getBranchPerformanceRadarController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get all students
		const students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
				latestResultStatus: true,
				CarryOvers: true,
				latestCOP: true,
				totalMarksObtained: true,
			},
		});

		// Group by branch
		const branchData: Record<string, {
			students: any[];
			totalStudents: number;
			passCount: number;
			avgSgpa: number;
			avgMarks: number;
			backlogCount: number;
		}> = {};

		students.forEach((s) => {
			const normalizedBranch = normalizeBranchName(s.branch);
			
			if (!branchData[normalizedBranch]) {
				branchData[normalizedBranch] = {
					students: [],
					totalStudents: 0,
					passCount: 0,
					avgSgpa: 0,
					avgMarks: 0,
					backlogCount: 0,
				};
			}

			branchData[normalizedBranch].students.push(s);
			branchData[normalizedBranch].totalStudents++;

			// Count passes
			const status = classifyStudentStatus(s.CarryOvers as any[]);
			if (status === "Pass") {
				branchData[normalizedBranch].passCount++;
			}

			// Add backlogs
			const carryOverCount = getCarryOverCount(s.CarryOvers as any[]);
			if (carryOverCount > 0) {
				branchData[normalizedBranch].backlogCount += carryOverCount;
			}
		});

		// Calculate averages and normalize for radar chart
		const radarData = Object.entries(branchData).map(([branchName, data]) => {
			// Calculate average SGPA
			const sgpaValues: number[] = [];
			data.students.forEach((s) => {
				const avgSgpa = calculateAverageSGPA(s.semesters);
				if (avgSgpa !== null) {
					sgpaValues.push(avgSgpa);
				}
			});
			const avgSgpa = sgpaValues.length > 0
				? sgpaValues.reduce((acc, val) => acc + val, 0) / sgpaValues.length
				: 0;

			// Calculate average marks
			const markValues = data.students
				.filter(s => s.totalMarksObtained !== null)
				.map(s => Number(s.totalMarksObtained));
			const avgMarks = markValues.length > 0
				? markValues.reduce((acc, val) => acc + val, 0) / markValues.length
				: 0;

			// Calculate metrics (normalized to 0-100 scale for radar chart)
			const passRate = (data.passCount / data.totalStudents) * 100;
			const sgpaScore = (avgSgpa / 10) * 100; // Normalize SGPA (0-10) to 0-100
			const backlogRate = data.backlogCount > 0
				? Math.max(0, 100 - (data.backlogCount / data.totalStudents) * 10)
				: 100;

			return {
				branch: branchName,
				passRate: Math.round(passRate * 10) / 10,
				academicPerformance: Math.round(sgpaScore * 10) / 10,
				backlogManagement: Math.round(backlogRate * 10) / 10,
				totalStudents: data.totalStudents,
				avgSgpa: Math.round(avgSgpa * 100) / 100,
				avgMarks: Math.round(avgMarks),
			};
		});

		return c.json(
			{
				success: true,
				data: radarData,
			},
			200,
		);
	} catch (error: any) {
		console.error("Branch performance radar error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

/**
 * GET /api/analytics/top-performers
 * Returns top N performing students for radial bar chart or leaderboard
 * 
 * Query Params:
 * - limit (optional): Number of students to return (default: 10)
 * - year (optional): Filter by year
 * - branch (optional): Filter by branch
 * - metric (optional): "sgpa" | "marks" (default: "sgpa")
 */
export const getTopPerformersController = async (
	c: Context<HonoContext>,
) => {
	try {
		const limit = parseInt(c.req.query("limit") || "10", 10);
		const year = c.req.query("year");
		const branch = c.req.query("branch");
		const metric = c.req.query("metric") || "sgpa";

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get students
		let students = await prisma.result.findMany({
			where,
			select: {
				rollNo: true,
				enrollmentNo: true,
				fullName: true,
				branch: true,
				year: true,
				semesters: {
					select: {
						semester: true,
						SGPA: true,
					},
				},
				totalMarksObtained: true,
				latestResultStatus: true,
				CarryOvers: true,
				latestCOP: true,
			},
		});

		// Filter by branch if provided
		if (branch && branch !== "all") {
			students = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		// Calculate performance metric for each student
		const studentsWithMetric = students.map((s) => {
			const avgSgpa = calculateAverageSGPA(s.semesters);
			const latestSgpa = getLatestSGPA(s.semesters);
			const marks = s.totalMarksObtained ? Number(s.totalMarksObtained) : 0;
			const status = classifyStudentStatus(s.CarryOvers as any[]);
			const backlogCount = getCarryOverCount(s.CarryOvers as any[]);

			return {
				rollNo: s.rollNo,
				enrollmentNo: s.enrollmentNo,
				name: s.fullName,
				branch: normalizeBranchName(s.branch),
				year: s.year,
				avgSgpa: avgSgpa || 0,
				latestSgpa: latestSgpa || 0,
				totalMarks: marks,
				status,
				backlogCount,
				// Performance score (for sorting)
				performanceScore: metric === "marks" ? marks : (avgSgpa || 0),
			};
		});

		// Sort by performance metric
		studentsWithMetric.sort((a, b) => b.performanceScore - a.performanceScore);

		// Take top N
		const topPerformers = studentsWithMetric.slice(0, limit).map((s, index) => ({
			rank: index + 1,
			rollNo: s.rollNo,
			enrollmentNo: s.enrollmentNo,
			name: s.name,
			branch: s.branch,
			year: s.year,
			avgSgpa: Math.round(s.avgSgpa * 100) / 100,
			latestSgpa: Math.round(s.latestSgpa * 100) / 100,
			totalMarks: s.totalMarks,
			status: s.status,
			backlogCount: s.backlogCount,
			performanceScore: Math.round(s.performanceScore * 100) / 100,
			// Chart value (normalized to 0-100 for radial bar chart)
			chartValue: metric === "marks"
				? Math.min(100, (s.performanceScore / 1000) * 100) // Assuming max marks ~1000
				: (s.performanceScore / 10) * 100, // SGPA 0-10 to 0-100
		}));

		return c.json(
			{
				success: true,
				data: {
					topPerformers,
					metric,
					totalStudents: students.length,
				},
			},
			200,
		);
	} catch (error: any) {
		console.error("Top performers error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};

