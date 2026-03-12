import { Hono } from "hono";
import {
	getStudentStatusDistributionController,
	getBranchStatusBreakdownController,
	getYearBranchComparisonController,
	getPerformanceMetricsController,
	getSemesterProgressionController,
	getSgpaRangeDistributionController,
	getBacklogAnalysisController,
	getBranchPerformanceRadarController,
	getTopPerformersController,
	getAnalyticsQueryController,
} from "../controllers/analytics.controller";

const analyticsRouter = new Hono();

// GET /api/analytics/student-status-distribution - Pass/PCP/Fail distribution for pie chart
analyticsRouter.get("/student-status-distribution", getStudentStatusDistributionController);

// GET /api/analytics/branch-status-breakdown - Branch-wise Pass/PCP/Fail breakdown for grouped bar chart
analyticsRouter.get("/branch-status-breakdown", getBranchStatusBreakdownController);

// GET /api/analytics/year-branch-comparison - Year-wise branch comparison for area chart
analyticsRouter.get("/year-branch-comparison", getYearBranchComparisonController);

// GET /api/analytics/performance-metrics - Key performance indicators for dashboard stats cards
analyticsRouter.get("/performance-metrics", getPerformanceMetricsController);

// GET /api/analytics/semester-progression - Semester-wise SGPA progression for line chart
analyticsRouter.get("/semester-progression", getSemesterProgressionController);

// GET /api/analytics/sgpa-range-distribution - SGPA distribution in ranges for histogram
analyticsRouter.get("/sgpa-range-distribution", getSgpaRangeDistributionController);

// GET /api/analytics/backlog-analysis - Backlog statistics for stacked bar chart
analyticsRouter.get("/backlog-analysis", getBacklogAnalysisController);

// GET /api/analytics/branch-performance-radar - Multi-dimensional branch comparison for radar chart
analyticsRouter.get("/branch-performance-radar", getBranchPerformanceRadarController);

// GET /api/analytics/top-performers - Top N performing students for radial bar chart or leaderboard
analyticsRouter.get("/top-performers", getTopPerformersController);

// POST /api/analytics/query - LLM-powered natural language analytics query endpoint
analyticsRouter.post("/query", getAnalyticsQueryController);

export default analyticsRouter;
