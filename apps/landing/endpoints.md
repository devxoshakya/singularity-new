Analytics Endpoints
Comprehensive analytics API for student performance visualization.

Status Rules Used Across Analytics
Student status is now derived from carry-over count only:

Pass: 0 carry overs
PCP: 1 to 2 carry overs
Fail: >= 3 carry overs
Carry-over parsing supports both payload shapes:

Historical object records: { session, sem, cop }
No-backlog marker: ["No Backlogs"]
1. Student Status Distribution
Endpoint: GET /api/analytics/student-status-distribution

Query Params:

year (optional)
branch (optional, normalized branch code such as CSE, ECE)
Response shape:

{
  "success": true,
  "data": {
    "total": 1500,
    "distribution": [
      { "status": "Pass", "count": 1200, "percentage": 80, "fill": "var(--chart-1)" },
      { "status": "PCP", "count": 250, "percentage": 16.67, "fill": "var(--chart-2)" },
      { "status": "Fail", "count": 50, "percentage": 3.33, "fill": "var(--chart-3)" }
    ]
  }
}
2. Branch Status Breakdown
Endpoint: GET /api/analytics/branch-status-breakdown

Query Params:

year (optional)
Returns branch-wise pass/pcp/fail counts and pass rate.

3. Year-Branch Comparison
Endpoint: GET /api/analytics/year-branch-comparison

Query Params:

years (optional, default 1,2,3,4)
branches (optional)
metric (optional: avgSgpa | passRate | avgMarks)
4. Performance Metrics
Endpoint: GET /api/analytics/performance-metrics

Important: this endpoint now requires exactly two years for comparison.

Accepted query formats:

Preferred: years=2,1
Backward compatible: year=2&compareWith=1
Query Params:

years (required unless using backward-compatible pair)
year + compareWith (backward-compatible pair)
branch (optional)
Error response:

{
  "success": false,
  "error": "Please provide exactly 2 years using `years=Y1,Y2` (or `year` and `compareWith`)."
}
Success response includes both years:

{
  "success": true,
  "data": {
    "current": {
      "year": 2,
      "avgSgpa": 7.82,
      "avgMarks": 684.2,
      "passRate": 81.4,
      "totalStudents": 1400,
      "topPerformers": 120,
      "withBacklogs": 322,
      "statusDistribution": { "Pass": 1078, "PCP": 250, "Fail": 72 }
    },
    "compare": {
      "year": 1,
      "avgSgpa": 7.55,
      "avgMarks": 663.1,
      "passRate": 78.9,
      "totalStudents": 1360,
      "topPerformers": 98,
      "withBacklogs": 351,
      "statusDistribution": { "Pass": 1073, "PCP": 210, "Fail": 77 }
    },
    "comparison": {
      "baseYear": 2,
      "compareYear": 1,
      "metrics": {
        "avgSgpa": "+3.6%",
        "passRate": "+3.2%",
        "trend": "up"
      }
    },
    "insights": ["..."]
  }
}
5. Semester Progression
Endpoint: GET /api/analytics/semester-progression

Query Params:

year (optional)
branch (optional)
6. SGPA Range Distribution
Endpoint: GET /api/analytics/sgpa-range-distribution

Query Params:

year (optional)
branch (optional)
semester (optional: latest or 1..8)
7. Backlog Analysis
Endpoint: GET /api/analytics/backlog-analysis

Important: year is now mandatory to avoid expensive full-dataset scans.

Query Params:

year (required)
branch (optional)
groupBy (optional: semester | subject | branch, default semester)
Backlog active/cleared computation now uses carry-over history + latest COP codes:

Active backlog code: still present in latestCOP
Cleared backlog code: present in history but not in latestCOP
Error response:

{
  "success": false,
  "error": "`year` query param is required for backlog analysis."
}
Success response now includes meta:

{
  "success": true,
  "data": [
    {
      "category": "CSE",
      "activeBacklogs": 120,
      "clearedBacklogs": 280,
      "totalBacklogs": 400,
      "clearanceRate": 70
    }
  ],
  "meta": {
    "year": 2,
    "groupBy": "branch",
    "students": 1500,
    "studentsWithBacklogs": 325,
    "activeBacklogs": 240,
    "clearedBacklogs": 510,
    "totalBacklogs": 750,
    "clearanceRate": 68
  }
}
8. Branch Performance Radar
Endpoint: GET /api/analytics/branch-performance-radar

Query Params:

year (optional)
9. Top Performers
Endpoint: GET /api/analytics/top-performers

Query Params:

limit (optional, default 10)
year (optional)
branch (optional)
metric (optional: sgpa | marks)
Analytics API Summary
Endpoint	Method	Purpose	Chart Type
/api/analytics/student-status-distribution	GET	Pass/PCP/Fail counts	Pie Chart
/api/analytics/branch-status-breakdown	GET	Branch-wise status breakdown	Grouped Bar Chart
/api/analytics/year-branch-comparison	GET	Multi-year branch comparison	Area Chart
/api/analytics/performance-metrics	GET	KPI cards + mandatory 2-year comparison	Stats Cards
/api/analytics/semester-progression	GET	Semester trends	Line Chart
/api/analytics/sgpa-range-distribution	GET	SGPA distribution	Histogram
/api/analytics/backlog-analysis	GET	Backlog active/cleared analysis	Stacked Bar Chart
/api/analytics/branch-performance-radar	GET	Multi-dimensional branch metrics	Radar Chart
/api/analytics/top-performers	GET	Top students leaderboard	Radial Bar / Table

Playground Integration Contract
The admin playground in `apps/landing` uses two internal endpoints:

1) POST /api/playground/optimize
Body:
{
  "text": "natural language query"
}

Response:
{
  "optimizedQuery": "instruction grounded in analytics endpoints",
  "intentHint": "student_status_distribution",
  "paramsHint": { "year": 3, "branch": "CSE" },
  "fallback": false
}

2) GET /api/playground/query?text=<optimized_query>
Response:
{
  "intent": "get_student_status",
  "params": { "year": 3, "branch": "CSE" },
  "data": { ... },
  "cached": false,
  "raw": { ...original-analysis-payload }
}

Required env vars for playground:
- GEMINI_API_KEY (server-side, used by optimize API)
- NEXT_PUBLIC_ANALYSIS_URL (base URL for external analysis service, e.g. https://host.workers.dev)