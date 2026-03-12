import type { Context } from "hono";
import prisma from "@singularity/db";
import type { HonoContext } from "@/types/context";

/**
 * Helper function to classify student status
 * @param latestResultStatus - "Clear", "PCP", or "Fail"
 * @param carryOvers - Array of carry over subjects
 * @param latestCOP - Latest Carry Over Position
 * @returns "Pass" | "PCP" | "Fail"
 */
const classifyStudentStatus = (
	latestResultStatus: string,
	carryOvers: any[],
	latestCOP: string,
): "Pass" | "PCP" | "Fail" => {
	// Fail: latestResultStatus === "Fail" OR latestCOP === "FAIL"
	if (latestResultStatus === "Fail" || latestCOP === "FAIL") {
		return "Fail";
	}

	// Pass: latestResultStatus === "Clear" OR CarryOvers.length === 0
	if (latestResultStatus === "Clear" || carryOvers.length === 0) {
		return "Pass";
	}

	// PCP: latestResultStatus === "PCP" OR (CarryOvers.length > 0 AND latestCOP !== "FAIL")
	if (latestResultStatus === "PCP" || (carryOvers.length > 0 && latestCOP !== "FAIL")) {
		return "PCP";
	}

	// Default to Pass if none of the above conditions match
	return "Pass";
};

/**
 * Helper function to get the latest semester SGPA
 * Checks all semesters from sem8 down to sem1
 */
const getLatestSGPA = (sgpaData: any): number | null => {
	if (!sgpaData) return null;

	for (let sem = 8; sem >= 1; sem--) {
		const semKey = `sem${sem}`;
		if (sgpaData[semKey] !== undefined && sgpaData[semKey] !== null) {
			return Number(sgpaData[semKey]);
		}
	}
	return null;
};

/**
 * Helper function to calculate average SGPA
 * Takes the average of all non-null semester SGPAs
 */
const calculateAverageSGPA = (sgpaData: any): number | null => {
	if (!sgpaData) return null;

	const sgpaValues: number[] = [];
	for (let sem = 1; sem <= 8; sem++) {
		const semKey = `sem${sem}`;
		const value = sgpaData[semKey];
		if (value !== undefined && value !== null) {
			sgpaValues.push(Number(value));
		}
	}

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
			const status = classifyStudentStatus(
				student.latestResultStatus,
				student.CarryOvers as any[],
				student.latestCOP,
			);
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
			const status = classifyStudentStatus(
				student.latestResultStatus,
				student.CarryOvers as any[],
				student.latestCOP,
			);

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
				SGPA: true,
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
						const avgSgpa = calculateAverageSGPA(s.SGPA);
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
						const status = classifyStudentStatus(
							s.latestResultStatus,
							s.CarryOvers as any[],
							s.latestCOP,
						);
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
 * - year (optional): Filter by year
 * - branch (optional): Filter by branch
 * - compareWith (optional): Year or branch to compare with
 */
export const getPerformanceMetricsController = async (
	c: Context<HonoContext>,
) => {
	try {
		const year = c.req.query("year");
		const branch = c.req.query("branch");
		const compareWith = c.req.query("compareWith");

		// Build filter for current data
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get current students
		let students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				year: true,
				SGPA: true,
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

		// Calculate current metrics
		const totalStudents = students.length;

		// Calculate average SGPA
		const sgpaValues: number[] = [];
		students.forEach((s) => {
			const avgSgpa = calculateAverageSGPA(s.SGPA);
			if (avgSgpa !== null) sgpaValues.push(avgSgpa);
		});
		const avgSgpa =
			sgpaValues.length > 0
				? sgpaValues.reduce((acc, val) => acc + val, 0) / sgpaValues.length
				: 0;

		// Calculate average total marks
		const validMarks = students
			.map((s) => s.totalMarksObtained)
			.filter((m) => m > 0);
		const avgMarks =
			validMarks.length > 0
				? validMarks.reduce((acc, val) => acc + val, 0) / validMarks.length
				: 0;

		// Classify students
		let passCount = 0;
		let pcpCount = 0;
		let failCount = 0;
		let topPerformers = 0;
		let withBacklogs = 0;

		students.forEach((s) => {
			const status = classifyStudentStatus(
				s.latestResultStatus,
				s.CarryOvers as any[],
				s.latestCOP,
			);

			if (status === "Pass") passCount++;
			else if (status === "PCP") pcpCount++;
			else if (status === "Fail") failCount++;

			// Top performers (SGPA > 9.0)
			const avgStudentSgpa = calculateAverageSGPA(s.SGPA);
			if (avgStudentSgpa && avgStudentSgpa > 9.0) topPerformers++;

			// With backlogs
			const carryOvers = s.CarryOvers as any[];
			if (carryOvers && carryOvers.length > 0) withBacklogs++;
		});

		const passRate = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;

		const currentMetrics = {
			avgSgpa: Math.round(avgSgpa * 100) / 100,
			avgMarks: Math.round(avgMarks * 100) / 100,
			passRate: Math.round(passRate * 100) / 100,
			totalStudents,
			topPerformers,
			withBacklogs,
		};

		// Comparison logic (if compareWith is provided)
		let comparison: any = null;
		let insights: string[] = [];

		if (compareWith) {
			// Get comparison data
			const compareWhere: any = {};
			const compareNum = parseInt(compareWith, 10);

			if (!isNaN(compareNum)) {
				// Assume it's a year comparison
				compareWhere.year = compareNum;
			}

			let compareStudents = await prisma.result.findMany({
				where: compareWhere,
				select: {
					branch: true,
					year: true,
					SGPA: true,
					totalMarksObtained: true,
					latestResultStatus: true,
					CarryOvers: true,
					latestCOP: true,
				},
			});

			// Filter by branch if provided
			if (branch && branch !== "all") {
				compareStudents = compareStudents.filter(
					(s) => normalizeBranchName(s.branch) === branch,
				);
			}

			// Calculate comparison metrics
			const compareSgpaValues: number[] = [];
			compareStudents.forEach((s) => {
				const avgSgpa = calculateAverageSGPA(s.SGPA);
				if (avgSgpa !== null) compareSgpaValues.push(avgSgpa);
			});
			const compareAvgSgpa =
				compareSgpaValues.length > 0
					? compareSgpaValues.reduce((acc, val) => acc + val, 0) /
						compareSgpaValues.length
					: 0;

			const comparePassCount = compareStudents.filter((s) => {
				const status = classifyStudentStatus(
					s.latestResultStatus,
					s.CarryOvers as any[],
					s.latestCOP,
				);
				return status === "Pass";
			}).length;

			const comparePassRate =
				compareStudents.length > 0
					? (comparePassCount / compareStudents.length) * 100
					: 0;

			// Calculate percentage changes
			const sgpaChange = compareAvgSgpa > 0
				? ((avgSgpa - compareAvgSgpa) / compareAvgSgpa) * 100
				: 0;
			const passRateChange = comparePassRate > 0
				? ((passRate - comparePassRate) / comparePassRate) * 100
				: 0;

			comparison = {
				avgSgpa: `${sgpaChange > 0 ? "+" : ""}${Math.round(sgpaChange * 10) / 10}%`,
				passRate: `${passRateChange > 0 ? "+" : ""}${Math.round(passRateChange * 10) / 10}%`,
				trend: sgpaChange > 0 ? "up" : sgpaChange < 0 ? "down" : "stable",
			};

			// Generate insights
			if (sgpaChange > 0) {
				insights.push(
					`Average SGPA improved by ${Math.round(sgpaChange * 10) / 10}% compared to year ${compareWith}`,
				);
			} else if (sgpaChange < 0) {
				insights.push(
					`Average SGPA decreased by ${Math.round(Math.abs(sgpaChange) * 10) / 10}% compared to year ${compareWith}`,
				);
			}

			if (passRateChange > 0) {
				insights.push(
					`Pass rate increased by ${Math.round(passRateChange * 10) / 10}%`,
				);
			} else if (passRateChange < 0) {
				insights.push(
					`Pass rate decreased by ${Math.round(Math.abs(passRateChange) * 10) / 10}%`,
				);
			}
		} else {
			// Default insights without comparison
			insights.push(
				`Overall pass rate: ${Math.round(passRate * 10) / 10}%`,
			);
			insights.push(
				`${topPerformers} students scoring above 9.0 SGPA`,
			);
			if (withBacklogs > 0) {
				insights.push(
					`${withBacklogs} students have active backlogs`,
				);
			}
		}

		return c.json(
			{
				success: true,
				data: {
					current: currentMetrics,
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
				SGPA: true,
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
			const semKey = `sem${sem}` as keyof typeof students[0]["SGPA"];
			
			// Get all SGPA values for this semester
			const sgpaValues: number[] = [];
			students.forEach((s) => {
				if (s.SGPA && typeof s.SGPA === 'object') {
					const sgpaObj = s.SGPA as any;
					const value = sgpaObj[semKey];
					if (value !== undefined && value !== null) {
						sgpaValues.push(Number(value));
					}
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
				SGPA: true,
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
				sgpaValue = getLatestSGPA(s.SGPA);
			} else {
				const semNum = parseInt(semester, 10);
				if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
					const semKey = `sem${semNum}`;
					if (s.SGPA && typeof s.SGPA === 'object') {
						const sgpaObj = s.SGPA as any;
						if (sgpaObj[semKey] !== undefined && sgpaObj[semKey] !== null) {
							sgpaValue = Number(sgpaObj[semKey]);
						}
					}
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
 * - year (optional): Filter by year
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

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get students with subjects
		let students = await prisma.result.findMany({
			where,
			select: {
				branch: true,
				CarryOvers: true,
				latestCOP: true,
				latestResultStatus: true,
				Subjects: true,
			},
		});

		// Filter by branch
		if (branch && branch !== "all") {
			students = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		let analysisData: any[] = [];

		if (groupBy === "branch") {
			// Group by branch
			const branchData: Record<string, { active: number; cleared: number; total: number }> = {};

			students.forEach((s) => {
				const normalizedBranch = normalizeBranchName(s.branch);
				const carryOvers = s.CarryOvers as any[];
				
				if (!branchData[normalizedBranch]) {
					branchData[normalizedBranch] = { active: 0, cleared: 0, total: 0 };
				}

				if (carryOvers && carryOvers.length > 0) {
					branchData[normalizedBranch].total += carryOvers.length;
					
					// Active backlogs (student still has them)
					if (s.latestResultStatus === "PCP" || s.latestResultStatus === "Fail") {
						branchData[normalizedBranch].active += carryOvers.length;
					} else {
						// Cleared backlogs
						branchData[normalizedBranch].cleared += carryOvers.length;
					}
				}
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
			// Group by semester (estimate from student year)
			const semesterData: Record<number, { active: number; cleared: number; total: number }> = {};

			students.forEach((s) => {
				const carryOvers = s.CarryOvers as any[];
				
				if (carryOvers && carryOvers.length > 0) {
					// Estimate semester from carry over subjects
					// This is a simplified approach - in real scenario, you'd extract semester from subject data
					carryOvers.forEach((_co: any) => {
						// For now, we'll distribute backlogs across semesters 1-8
						// You can enhance this based on your actual data structure
						for (let sem = 1; sem <= 8; sem++) {
							if (!semesterData[sem]) {
								semesterData[sem] = { active: 0, cleared: 0, total: 0 };
							}
						}
						
						// Simplified: add to current year's relevant semesters
						const relevantSem = 1; // You can enhance this logic
						if (semesterData[relevantSem]) {
							semesterData[relevantSem].total += 1;
							
							if (s.latestResultStatus === "PCP" || s.latestResultStatus === "Fail") {
								semesterData[relevantSem].active += 1;
							} else {
								semesterData[relevantSem].cleared += 1;
							}
						}
					});
				}
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
			// Group by subject (if subject data is available)
			const subjectData: Record<string, { active: number; cleared: number; total: number }> = {};

			students.forEach((s) => {
				const carryOvers = s.CarryOvers as any[];
				
				if (carryOvers && Array.isArray(carryOvers)) {
					carryOvers.forEach((co: any) => {
						const subjectName = typeof co === 'string' ? co : co.subject || "Unknown";
						
						if (!subjectData[subjectName]) {
							subjectData[subjectName] = { active: 0, cleared: 0, total: 0 };
						}

						subjectData[subjectName].total += 1;
						
						if (s.latestResultStatus === "PCP" || s.latestResultStatus === "Fail") {
							subjectData[subjectName].active += 1;
						} else {
							subjectData[subjectName].cleared += 1;
						}
					});
				}
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
				SGPA: true,
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
			const status = classifyStudentStatus(
				s.latestResultStatus,
				s.CarryOvers,
				s.latestCOP,
			);
			if (status === "Pass") {
				branchData[normalizedBranch].passCount++;
			}

			// Add backlogs
			const carryOvers = s.CarryOvers as any[];
			if (carryOvers && carryOvers.length > 0) {
				branchData[normalizedBranch].backlogCount += carryOvers.length;
			}
		});

		// Calculate averages and normalize for radar chart
		const radarData = Object.entries(branchData).map(([branchName, data]) => {
			// Calculate average SGPA
			const sgpaValues: number[] = [];
			data.students.forEach((s) => {
				const avgSgpa = calculateAverageSGPA(s.SGPA);
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
				SGPA: true,
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
			const avgSgpa = calculateAverageSGPA(s.SGPA);
			const latestSgpa = getLatestSGPA(s.SGPA);
			const marks = s.totalMarksObtained ? Number(s.totalMarksObtained) : 0;
			const status = classifyStudentStatus(
				s.latestResultStatus,
				s.CarryOvers,
				s.latestCOP,
			);
			const carryOvers = s.CarryOvers as any[];
			const backlogCount = carryOvers ? carryOvers.length : 0;

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

/**
 * POST /api/analytics/query
 * LLM-powered analytics query endpoint that returns insights based on natural language
 * 
 * Body:
 * - query: Natural language query string
 * - year (optional): Filter by year
 * - branch (optional): Filter by branch
 */
export const getAnalyticsQueryController = async (
	c: Context<HonoContext>,
) => {
	try {
		const { query, year, branch } = await c.req.json();

		if (!query || typeof query !== "string") {
			return c.json(
				{ success: false, error: "Query parameter is required" },
				400,
			);
		}

		// Build filter
		const where: any = {};
		if (year && year !== "all") {
			const yearNum = parseInt(year, 10);
			if (!isNaN(yearNum)) {
				where.year = yearNum;
			}
		}

		// Get students based on filters
		let students = await prisma.result.findMany({
			where,
			select: {
				rollNo: true,
				enrollmentNo: true,
				fullName: true,
				branch: true,
				year: true,
				SGPA: true,
				CarryOvers: true,
				latestResultStatus: true,
				latestCOP: true,
				totalMarksObtained: true,
			},
		});

		// Filter by branch if provided
		if (branch && branch !== "all") {
			students = students.filter(
				(s) => normalizeBranchName(s.branch) === branch,
			);
		}

		// Parse query and determine what analytics to return
		const queryLower = query.toLowerCase();
		let response: any = {};

		// Query patterns and corresponding analytics
		if (queryLower.includes("pass") && (queryLower.includes("rate") || queryLower.includes("percentage"))) {
			// Pass rate query
			const totalStudents = students.length;
			const passCount = students.filter((s) =>
				classifyStudentStatus(s.latestResultStatus, s.CarryOvers, s.latestCOP) === "Pass"
			).length;
			const passRate = (passCount / totalStudents) * 100;

			response = {
				type: "pass_rate",
				data: {
					totalStudents,
					passCount,
					passRate: Math.round(passRate * 10) / 10,
				},
				insight: `Out of ${totalStudents} students, ${passCount} have passed with a pass rate of ${Math.round(passRate * 10) / 10}%.`,
			};

		} else if (queryLower.includes("average") && queryLower.includes("sgpa")) {
			// Average SGPA query
			const sgpaValues: number[] = [];
			students.forEach((s) => {
				const avgSgpa = calculateAverageSGPA(s.SGPA);
				if (avgSgpa !== null) {
					sgpaValues.push(avgSgpa);
				}
			});

			const avgSgpa = sgpaValues.length > 0
				? sgpaValues.reduce((acc, val) => acc + val, 0) / sgpaValues.length
				: 0;

			response = {
				type: "average_sgpa",
				data: {
					totalStudents: students.length,
					studentsWithSgpa: sgpaValues.length,
					averageSgpa: Math.round(avgSgpa * 100) / 100,
				},
				insight: `The average SGPA across ${sgpaValues.length} students is ${Math.round(avgSgpa * 100) / 100}.`,
			};

		} else if (queryLower.includes("backlog") || queryLower.includes("carry over")) {
			// Backlog analysis query
			let totalBacklogs = 0;
			let studentsWithBacklogs = 0;

			students.forEach((s) => {
				const carryOvers = s.CarryOvers as any[];
				if (carryOvers && carryOvers.length > 0) {
					totalBacklogs += carryOvers.length;
					studentsWithBacklogs++;
				}
			});

			const backlogRate = (studentsWithBacklogs / students.length) * 100;

			response = {
				type: "backlog_analysis",
				data: {
					totalStudents: students.length,
					studentsWithBacklogs,
					totalBacklogs,
					backlogRate: Math.round(backlogRate * 10) / 10,
					avgBacklogsPerStudent: studentsWithBacklogs > 0
						? Math.round((totalBacklogs / studentsWithBacklogs) * 10) / 10
						: 0,
				},
				insight: `${studentsWithBacklogs} students (${Math.round(backlogRate * 10) / 10}%) have backlogs, with a total of ${totalBacklogs} carry-over subjects.`,
			};

		} else if (queryLower.includes("branch") && (queryLower.includes("best") || queryLower.includes("top"))) {
			// Best performing branch query
			const branchData: Record<string, { sgpaValues: number[] }> = {};

			students.forEach((s) => {
				const normalizedBranch = normalizeBranchName(s.branch);
				if (!branchData[normalizedBranch]) {
					branchData[normalizedBranch] = { sgpaValues: [] };
				}

				const avgSgpa = calculateAverageSGPA(s.SGPA);
				if (avgSgpa !== null) {
					branchData[normalizedBranch].sgpaValues.push(avgSgpa);
				}
			});

			const branchAverages = Object.entries(branchData)
				.map(([branch, data]) => ({
					branch,
					avgSgpa: data.sgpaValues.length > 0
						? data.sgpaValues.reduce((acc, val) => acc + val, 0) / data.sgpaValues.length
						: 0,
					students: data.sgpaValues.length,
				}))
				.sort((a, b) => b.avgSgpa - a.avgSgpa);

			const topBranch = branchAverages[0];

			if (!topBranch) {
				response = {
					type: "top_branch",
					data: { message: "No branch data available" },
					insight: "No branch performance data is available for the given filters.",
				};
			} else {
				response = {
					type: "top_branch",
					data: {
						topBranch: topBranch.branch,
						avgSgpa: Math.round(topBranch.avgSgpa * 100) / 100,
						students: topBranch.students,
						allBranches: branchAverages.map((b) => ({
							branch: b.branch,
							avgSgpa: Math.round(b.avgSgpa * 100) / 100,
							students: b.students,
						})),
					},
					insight: `${topBranch.branch} is the best performing branch with an average SGPA of ${Math.round(topBranch.avgSgpa * 100) / 100}.`,
				};
			}

		} else if (queryLower.includes("fail") && (queryLower.includes("how many") || queryLower.includes("count"))) {
			// Fail count query
			const failCount = students.filter((s) =>
				classifyStudentStatus(s.latestResultStatus, s.CarryOvers, s.latestCOP) === "Fail"
			).length;
			const failRate = (failCount / students.length) * 100;

			response = {
				type: "fail_count",
				data: {
					totalStudents: students.length,
					failCount,
					failRate: Math.round(failRate * 10) / 10,
				},
				insight: `${failCount} students (${Math.round(failRate * 10) / 10}%) have failed.`,
			};

		} else {
			// General summary for unrecognized queries
			const statusCounts = { Pass: 0, PCP: 0, Fail: 0 };
			const sgpaValues: number[] = [];

			students.forEach((s) => {
				const status = classifyStudentStatus(
					s.latestResultStatus,
					s.CarryOvers,
					s.latestCOP,
				);
				statusCounts[status]++;

				const avgSgpa = calculateAverageSGPA(s.SGPA);
				if (avgSgpa !== null) {
					sgpaValues.push(avgSgpa);
				}
			});

			const avgSgpa = sgpaValues.length > 0
				? sgpaValues.reduce((acc, val) => acc + val, 0) / sgpaValues.length
				: 0;

			response = {
				type: "general_summary",
				data: {
					totalStudents: students.length,
					statusDistribution: statusCounts,
					averageSgpa: Math.round(avgSgpa * 100) / 100,
				},
				insight: `Summary of ${students.length} students: ${statusCounts.Pass} passed, ${statusCounts.PCP} with carry-overs, ${statusCounts.Fail} failed. Average SGPA is ${Math.round(avgSgpa * 100) / 100}.`,
				suggestion: "Try asking about 'pass rate', 'average SGPA', 'backlogs', 'best branch', or 'fail count'.",
			};
		}

		return c.json(
			{
				success: true,
				query,
				...response,
			},
			200,
		);
	} catch (error: any) {
		console.error("Analytics query error:", error);
		return c.json(
			{ success: false, error: "Internal server error" },
			500,
		);
	}
};
