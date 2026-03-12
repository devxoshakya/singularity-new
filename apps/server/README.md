# Singularity Server

Cloudflare Workers backend for Singularity AKTU result analysis platform.

**Production Server:** https://singularity-server.devxoshakya.workers.dev/

## Environment Variables

Create a `.env` file in this directory with the following variables:

```bash
# Database
DATABASE_URL=your_mongodb_connection_string

# Better Auth Configuration
BETTER_AUTH_SECRET=your_random_secret_key_here
BETTER_AUTH_URL=https://your-worker-url.workers.dev

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Setting Up Environment Variables

### Local Development

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Production (Cloudflare Workers)

Use Wrangler to set secrets for production:

```bash
# Set all secrets
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL
wrangler secret put CORS_ORIGIN
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

Or set them via the Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings > Variables
4. Add each environment variable as a secret

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `https://your-worker-url.workers.dev/api/auth/callback/google`
   - `http://localhost:8787/api/auth/callback/google` (for local dev)
7. Copy Client ID and Client Secret to your environment variables

## API Routes

### Result Endpoints

#### 1. Get Result by Roll Number

Returns detailed result information for a specific student by their roll number.

**Endpoint:** `GET /api/result/by-rollno`

**Query Parameters:**
- `rollNo` (required) - Student's roll number (must be numeric digits only)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/result/by-rollno?rollNo=1234567890123
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "rollNo": "1234567890123",
    "enrollmentNo": "EN123456789",
    "fullName": "John Doe",
    "blocked": false,
    "fatherName": "Father Name",
    "course": "B.Tech",
    "branch": "Computer Science",
    "year": 2,
    "SGPA": [8.5, 8.7],
    "CarryOvers": [],
    "divison": "First Division",
    "cgpa": "8.6",
    "instituteName": "MIET",
    "latestResultStatus": "Pass",
    "totalMarksObtained": 850,
    "latestCOP": "8.7",
    "Subjects": [
      {
        "id": "507f1f77bcf86cd799439012",
        "subject": "Data Structures",
        "code": "CS201",
        "type": "Theory",
        "internal": "20",
        "external": "75",
        "resultId": "507f1f77bcf86cd799439011"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or missing roll number
  ```json
  {
    "error": "Roll number is required"
  }
  ```
  Or with validation details:
  ```json
  {
    "error": "Validation failed",
    "details": [...]
  }
  ```
- `404 Not Found` - Result not found
  ```json
  {
    "error": "Result not found for the provided roll number"
  }
  ```
- `500 Internal Server Error` - Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

#### 2. Get Results by Year (Paginated)

Returns all student results for a specific year.

**Endpoint:** `GET /api/result/by-year`

**Query Parameters:**
- `year` (required) - Academic year (1-4)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/result/by-year?year=2
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "rollNo": "1234567890123",
      "enrollmentNo": "EN123456789",
      "fullName": "John Doe",
      "blocked": false,
      "fatherName": "Father Name",
      "course": "B.Tech",
      "branch": "Computer Science",
      "year": 2,
      "SGPA": [8.5, 8.7],
      "CarryOvers": [],
      "divison": "First Division",
      "cgpa": "8.6",
      "instituteName": "MIET",
      "latestResultStatus": "Pass",
      "totalMarksObtained": 850,
      "latestCOP": "8.7",
      "Subjects": [...]
    }
  ],
  "totalCount": 150
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
  ```json
  {
    "error": "Year is required"
  }
  ```
  Or with validation details:
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "message": "Year must be between 1 and 4",
        "path": ["year"]
      }
    ]
  }
  ```
- `500 Internal Server Error` - Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

**Notes:**
- Results are ordered by roll number in ascending order
- Endpoint uses Prisma Accelerate caching for optimized performance

---

## Analytics Endpoints

Comprehensive analytics API for student performance visualization and insights. All endpoints support optional filtering by year and branch.

### Phase 1: Core Analytics

#### 1. Student Status Distribution

Returns Pass/PCP/Fail distribution for pie chart visualization.

**Endpoint:** `GET /api/analytics/student-status-distribution`

**Query Parameters:**
- `year` (optional) - Filter by year (1-4)
- `branch` (optional) - Filter by normalized branch name (e.g., "CSE", "ECE")

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/student-status-distribution?year=2
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 1500,
    "distribution": [
      {
        "status": "Pass",
        "count": 1200,
        "percentage": 80.0,
        "fill": "var(--chart-1)"
      },
      {
        "status": "PCP",
        "count": 250,
        "percentage": 16.67,
        "fill": "var(--chart-2)"
      },
      {
        "status": "Fail",
        "count": 50,
        "percentage": 3.33,
        "fill": "var(--chart-3)"
      }
    ]
  }
}
```

---

#### 2. Branch Status Breakdown

Returns branch-wise Pass/PCP/Fail breakdown for grouped bar chart.

**Endpoint:** `GET /api/analytics/branch-status-breakdown`

**Query Parameters:**
- `year` (optional) - Filter by year (1-4)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/branch-status-breakdown?year=2
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "branch": "CSE",
      "totalStudents": 500,
      "pass": 420,
      "pcp": 70,
      "fail": 10,
      "passRate": 84.0
    },
    {
      "branch": "ECE",
      "totalStudents": 300,
      "pass": 250,
      "pcp": 40,
      "fail": 10,
      "passRate": 83.33
    }
  ]
}
```

---

#### 3. Year-Branch Comparison

Returns multi-year branch comparison data for area chart visualization.

**Endpoint:** `GET /api/analytics/year-branch-comparison`

**Query Parameters:**
- `metric` (optional) - Comparison metric: "avgSgpa" | "passRate" | "avgMarks" (default: "avgSgpa")

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/year-branch-comparison?metric=avgSgpa
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "years": [1, 2, 3, 4],
    "branches": [
      {
        "branch": "CSE",
        "data": [
          { "year": 1, "value": 7.8, "students": 500 },
          { "year": 2, "value": 8.1, "students": 480 },
          { "year": 3, "value": 8.3, "students": 460 },
          { "year": 4, "value": 8.5, "students": 450 }
        ]
      },
      {
        "branch": "ECE",
        "data": [
          { "year": 1, "value": 7.5, "students": 300 },
          { "year": 2, "value": 7.8, "students": 290 }
        ]
      }
    ],
    "metric": "avgSgpa"
  }
}
```

---

#### 4. Performance Metrics

Returns key performance indicators for dashboard stats cards with optional year-over-year comparison.

**Endpoint:** `GET /api/analytics/performance-metrics`

**Query Parameters:**
- `year` (optional) - Filter by specific year
- `branch` (optional) - Filter by branch
- `compareYear` (optional) - Previous year for comparison

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/performance-metrics?year=2&compareYear=1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 1500,
    "passRate": 84.5,
    "averageSgpa": 7.85,
    "averageMarks": 685,
    "studentsWithBacklogs": 320,
    "backlogRate": 21.33,
    "totalBacklogs": 450,
    "comparison": {
      "sgpaChange": "+5.2%",
      "passRateChange": "+3.1%",
      "trend": "up"
    },
    "insights": [
      "Pass rate increased by 3.1% compared to previous year",
      "Average SGPA improved to 7.85",
      "21.33% students have active backlogs"
    ]
  }
}
```

---

### Phase 2: Advanced Visualizations

#### 5. Semester Progression

Returns semester-wise SGPA progression for line chart visualization.

**Endpoint:** `GET /api/analytics/semester-progression`

**Query Parameters:**
- `year` (optional) - Filter by year (1-4)
- `branch` (optional) - Filter by branch

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/semester-progression?branch=CSE
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "semesters": [
      {
        "semester": 1,
        "avgSgpa": 7.45,
        "maxSgpa": 9.82,
        "minSgpa": 5.12,
        "students": 500,
        "passRate": 92.5
      },
      {
        "semester": 2,
        "avgSgpa": 7.68,
        "maxSgpa": 9.85,
        "minSgpa": 5.34,
        "students": 498,
        "passRate": 93.8
      },
      {
        "semester": 3,
        "avgSgpa": 7.89,
        "maxSgpa": 9.91,
        "minSgpa": 5.45,
        "students": 495,
        "passRate": 94.2
      }
    ],
    "improvement": "+5.9%"
  }
}
```

---

#### 6. SGPA Range Distribution

Returns SGPA distribution across ranges for histogram visualization.

**Endpoint:** `GET /api/analytics/sgpa-range-distribution`

**Query Parameters:**
- `year` (optional) - Filter by year (1-4)
- `branch` (optional) - Filter by branch
- `semester` (optional) - "latest" or semester number (1-8, default: "latest")

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/sgpa-range-distribution?semester=latest
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ranges": [
      {
        "range": "9.0-10.0",
        "count": 150,
        "label": "Outstanding",
        "fill": "var(--chart-1)"
      },
      {
        "range": "8.0-8.9",
        "count": 320,
        "label": "Excellent",
        "fill": "var(--chart-2)"
      },
      {
        "range": "7.0-7.9",
        "count": 580,
        "label": "Very Good",
        "fill": "var(--chart-3)"
      },
      {
        "range": "6.0-6.9",
        "count": 280,
        "label": "Good",
        "fill": "var(--chart-4)"
      },
      {
        "range": "5.0-5.9",
        "count": 120,
        "label": "Average",
        "fill": "var(--chart-5)"
      },
      {
        "range": "0.0-4.9",
        "count": 50,
        "label": "Below Average",
        "fill": "var(--chart-6)"
      }
    ],
    "median": 7.65,
    "mode": "7.0-7.9"
  }
}
```

---

#### 7. Backlog Analysis

Returns backlog statistics grouped by semester, branch, or subject for stacked bar chart.

**Endpoint:** `GET /api/analytics/backlog-analysis`

**Query Parameters:**
- `year` (optional) - Filter by year (1-4)
- `branch` (optional) - Filter by branch
- `groupBy` (optional) - "semester" | "subject" | "branch" (default: "semester")

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/backlog-analysis?groupBy=branch
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "category": "CSE",
      "activeBacklogs": 120,
      "clearedBacklogs": 280,
      "totalBacklogs": 400,
      "clearanceRate": 70.0
    },
    {
      "category": "ECE",
      "activeBacklogs": 80,
      "clearedBacklogs": 150,
      "totalBacklogs": 230,
      "clearanceRate": 65.22
    },
    {
      "category": "ME",
      "activeBacklogs": 45,
      "clearedBacklogs": 95,
      "totalBacklogs": 140,
      "clearanceRate": 67.86
    }
  ]
}
```

**With groupBy=subject (Top 10 subjects):**
```json
{
  "success": true,
  "data": [
    {
      "category": "Data Structures",
      "activeBacklogs": 45,
      "clearedBacklogs": 89,
      "totalBacklogs": 134,
      "clearanceRate": 66.42
    },
    {
      "category": "Analog Electronics",
      "activeBacklogs": 38,
      "clearedBacklogs": 72,
      "totalBacklogs": 110,
      "clearanceRate": 65.45
    }
  ]
}
```

---

### Phase 3: AI-Powered & Advanced Analytics

#### 8. Branch Performance Radar

Returns multi-dimensional performance metrics for each branch for radar chart visualization.

**Endpoint:** `GET /api/analytics/branch-performance-radar`

**Query Parameters:**
- `year` (optional) - Filter by year (1-4)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/branch-performance-radar
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "branch": "CSE",
      "passRate": 85.5,
      "academicPerformance": 78.2,
      "backlogManagement": 92.0,
      "totalStudents": 1200,
      "avgSgpa": 7.82,
      "avgMarks": 689
    },
    {
      "branch": "ECE",
      "passRate": 82.3,
      "academicPerformance": 75.8,
      "backlogManagement": 88.5,
      "totalStudents": 800,
      "avgSgpa": 7.58,
      "avgMarks": 672
    },
    {
      "branch": "ME",
      "passRate": 79.1,
      "academicPerformance": 72.4,
      "backlogManagement": 85.3,
      "totalStudents": 600,
      "avgSgpa": 7.24,
      "avgMarks": 658
    }
  ]
}
```

**Metrics Explanation:**
- `passRate`: Percentage of students who passed (0-100)
- `academicPerformance`: SGPA normalized to 0-100 scale
- `backlogManagement`: Inverse backlog rate (higher is better, 0-100)

---

#### 9. Top Performers

Returns top N performing students for radial bar chart or leaderboard.

**Endpoint:** `GET /api/analytics/top-performers`

**Query Parameters:**
- `limit` (optional) - Number of students (default: 10, max: 100)
- `year` (optional) - Filter by year (1-4)
- `branch` (optional) - Filter by branch
- `metric` (optional) - "sgpa" | "marks" (default: "sgpa")

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/analytics/top-performers?limit=5&metric=sgpa
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topPerformers": [
      {
        "rank": 1,
        "rollNo": "2400680100123",
        "enrollmentNo": "EN2024001",
        "name": "Rahul Kumar",
        "branch": "CSE",
        "year": 3,
        "avgSgpa": 9.45,
        "latestSgpa": 9.52,
        "totalMarks": 892,
        "status": "Pass",
        "backlogCount": 0,
        "performanceScore": 9.45,
        "chartValue": 94.5
      },
      {
        "rank": 2,
        "rollNo": "2400680100245",
        "enrollmentNo": "EN2024002",
        "name": "Priya Sharma",
        "branch": "CSE-AI",
        "year": 3,
        "avgSgpa": 9.38,
        "latestSgpa": 9.41,
        "totalMarks": 885,
        "status": "Pass",
        "backlogCount": 0,
        "performanceScore": 9.38,
        "chartValue": 93.8
      },
      {
        "rank": 3,
        "rollNo": "2400681540067",
        "enrollmentNo": "EN2024003",
        "name": "Arjun Patel",
        "branch": "CSE-DS",
        "year": 2,
        "avgSgpa": 9.32,
        "latestSgpa": 9.35,
        "totalMarks": 878,
        "status": "Pass",
        "backlogCount": 0,
        "performanceScore": 9.32,
        "chartValue": 93.2
      }
    ],
    "metric": "sgpa",
    "totalStudents": 5724
  }
}
```

---

#### 10. Natural Language Query (LLM-Powered)

AI-powered endpoint that accepts natural language queries and returns contextual analytics insights.

**Endpoint:** `POST /api/analytics/query`

**Request Body:**
```json
{
  "query": "What is the pass rate for CSE students?",
  "year": "2",
  "branch": "CSE"
}
```

**Supported Query Patterns:**
- Pass rate queries: "What is the pass rate?", "How many students passed?"
- Average SGPA: "What is the average SGPA?", "Show me average performance"
- Backlog analysis: "Tell me about backlogs", "How many carry overs?"
- Best branch: "Which branch is best?", "Top performing branch"
- Fail count: "How many students failed?"
- General summary: Any other query returns comprehensive summary

**Example Request:**
```bash
POST https://singularity-server.devxoshakya.workers.dev/api/analytics/query
Content-Type: application/json

{
  "query": "What is the pass rate for CSE students in year 2?",
  "year": "2",
  "branch": "CSE"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "query": "What is the pass rate for CSE students in year 2?",
  "type": "pass_rate",
  "data": {
    "totalStudents": 500,
    "passCount": 427,
    "passRate": 85.4
  },
  "insight": "Out of 500 students, 427 have passed with a pass rate of 85.4%."
}
```

**Example: Average SGPA Query**
```bash
POST /api/analytics/query
{
  "query": "Show me the average SGPA"
}
```

**Response:**
```json
{
  "success": true,
  "query": "Show me the average SGPA",
  "type": "average_sgpa",
  "data": {
    "totalStudents": 5724,
    "studentsWithSgpa": 5680,
    "averageSgpa": 7.65
  },
  "insight": "The average SGPA across 5680 students is 7.65."
}
```

**Example: Best Branch Query**
```bash
POST /api/analytics/query
{
  "query": "Which branch is performing best?"
}
```

**Response:**
```json
{
  "success": true,
  "query": "Which branch is performing best?",
  "type": "top_branch",
  "data": {
    "topBranch": "CSE",
    "avgSgpa": 7.94,
    "students": 1200,
    "allBranches": [
      { "branch": "CSE", "avgSgpa": 7.94, "students": 1200 },
      { "branch": "CSE-AI", "avgSgpa": 7.88, "students": 450 },
      { "branch": "ECE", "avgSgpa": 7.62, "students": 800 }
    ]
  },
  "insight": "CSE is the best performing branch with an average SGPA of 7.94."
}
```

**Example: Backlog Analysis Query**
```bash
POST /api/analytics/query
{
  "query": "Tell me about carry overs and backlogs"
}
```

**Response:**
```json
{
  "success": true,
  "query": "Tell me about carry overs and backlogs",
  "type": "backlog_analysis",
  "data": {
    "totalStudents": 5724,
    "studentsWithBacklogs": 1245,
    "totalBacklogs": 2890,
    "backlogRate": 21.75,
    "avgBacklogsPerStudent": 2.3
  },
  "insight": "1245 students (21.75%) have backlogs, with a total of 2890 carry-over subjects."
}
```

**Example: General Summary (Unrecognized Query)**
```bash
POST /api/analytics/query
{
  "query": "Give me a summary"
}
```

**Response:**
```json
{
  "success": true,
  "query": "Give me a summary",
  "type": "general_summary",
  "data": {
    "totalStudents": 5724,
    "statusDistribution": {
      "Pass": 4850,
      "PCP": 780,
      "Fail": 94
    },
    "averageSgpa": 7.65
  },
  "insight": "Summary of 5724 students: 4850 passed, 780 with carry-overs, 94 failed. Average SGPA is 7.65.",
  "suggestion": "Try asking about 'pass rate', 'average SGPA', 'backlogs', 'best branch', or 'fail count'."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Query parameter is required"
}
```

---

## Analytics API Summary

| Endpoint | Method | Purpose | Chart Type |
|----------|--------|---------|------------|
| `/api/analytics/student-status-distribution` | GET | Pass/PCP/Fail counts | Pie Chart |
| `/api/analytics/branch-status-breakdown` | GET | Branch-wise performance | Grouped Bar Chart |
| `/api/analytics/year-branch-comparison` | GET | Multi-year comparison | Area Chart |
| `/api/analytics/performance-metrics` | GET | Dashboard KPIs | Stats Cards |
| `/api/analytics/semester-progression` | GET | Semester-wise trends | Line Chart |
| `/api/analytics/sgpa-range-distribution` | GET | SGPA distribution | Histogram |
| `/api/analytics/backlog-analysis` | GET | Backlog statistics | Stacked Bar Chart |
| `/api/analytics/branch-performance-radar` | GET | Multi-dimensional metrics | Radar Chart |
| `/api/analytics/top-performers` | GET | Top students leaderboard | Radial Bar / Table |
| `/api/analytics/query` | POST | Natural language analytics | AI-Powered Insights |

---

## Development

```bash
bun run dev
```

## Deployment

```bash
bun run deploy
```
