# Singualrity Feature README (Landing App Focus)

This document captures the **student and analytics features** used by the landing app.

The landing app does not consume raw data directly.  
It works through a FastAPI backend layer, and that FastAPI layer calls these APIs from `apps/server` to power dashboards, insights, comparisons, and student lookup experiences.

---

## 1) Student Lookup Features

These two APIs are the foundation of all student-facing and analytics-facing experiences.

### A. Student Profile by Roll Number
- **API:** `GET /api/result/by-rollno`
- **Primary query params:** `rollNo` (required), `sem` (`1..8`, `latest`, or `all`)

**Feature value for landing app**
- Enables instant student search and profile opening.
- Supports semester-specific snapshots (latest or a selected semester) for focused academic storytelling.
- Provides rich student-level context (identity, branch, year, result status, SGPA view, subjects, carry-over context), enabling detailed academic cards in UI.

**Typical landing experiences powered**
- Student search bar → profile panel.
- “Latest semester at a glance” highlight cards.
- Subject-level drill-down when semester-specific mode is selected.

---

### B. Student Collections by Year
- **API:** `GET /api/result/by-year`
- **Primary query params:** `year` (required), `sem` (`1..8`, `latest`, or `all`)

**Feature value for landing app**
- Powers cohort-level browsing by academic year.
- Enables year-level lists and aggregate overview panels.
- Supports “latest-semester cohort quality view” by excluding incomplete progression for `sem=latest`, keeping comparisons meaningful.

**Typical landing experiences powered**
- Year tabs (1st/2nd/3rd/4th year) with student cohorts.
- Cohort search and filtering in year-specific views.
- Year-specific ranking/insight modules downstream.

---

## 2) Analytics Features (All APIs)

These APIs are designed for visual, decision-friendly insights and are directly aligned with landing dashboard patterns.

### Shared Analytics Status Logic
Across analytics endpoints, student status is interpreted as:
- **Pass:** 0 carry overs
- **PCP:** 1–2 carry overs
- **Fail:** 3+ carry overs

This gives the landing app a consistent academic-health language for every chart.

---

### 1. Student Status Distribution
- **API:** `GET /api/analytics/student-status-distribution`
- **Filters:** `year` (optional), `branch` (optional)

**Landing feature impact**
- Pie/distribution view of Pass vs PCP vs Fail.
- Quick academic-health pulse for selected cohorts.

---

### 2. Branch Status Breakdown
- **API:** `GET /api/analytics/branch-status-breakdown`
- **Filters:** `year` (optional)

**Landing feature impact**
- Branch-by-branch pass/pcp/fail comparison.
- Helps identify strongest and most at-risk branches at a glance.

---

### 3. Year-Branch Comparison
- **API:** `GET /api/analytics/year-branch-comparison`
- **Filters:** `years` (optional, default `1,2,3,4`), `branches` (optional), `metric` (`avgSgpa` | `passRate` | `avgMarks`)

**Landing feature impact**
- Multi-year trend storytelling per branch.
- Enables comparative charts for academic trajectory across cohorts.

---

### 4. Performance Metrics (2-Year Comparative KPI)
- **API:** `GET /api/analytics/performance-metrics`
- **Filters:** preferred `years=Y1,Y2`; backward compatible `year` + `compareWith`; `branch` (optional)
- **Important rule:** exactly 2 years are required.

**Landing feature impact**
- KPI card engine for “current vs comparison year”.
- Produces comparative metrics (SGPA shift, pass-rate movement, trend direction) and insight text.
- Supports executive-style summary sections in dashboard hero areas.

---

### 5. Semester Progression
- **API:** `GET /api/analytics/semester-progression`
- **Filters:** `year` (optional), `branch` (optional)

**Landing feature impact**
- Semester-by-semester learning curve and progression analytics.
- Shows growth/decline signal for academic continuity narratives.

---

### 6. SGPA Range Distribution
- **API:** `GET /api/analytics/sgpa-range-distribution`
- **Filters:** `year` (optional), `branch` (optional), `semester` (`latest` or `1..8`)

**Landing feature impact**
- Performance band visualization (outstanding to below-average ranges).
- Great for showing spread and concentration of performance quality.

---

### 7. Backlog Analysis
- **API:** `GET /api/analytics/backlog-analysis`
- **Filters:** `year` (required), `branch` (optional), `groupBy` (`semester` | `subject` | `branch`)

**Landing feature impact**
- Deep backlog intelligence with active vs cleared perspective.
- Enables “where backlog pressure exists” and “where clearance is improving” views.
- Supports intervention-focused analytics sections.

---

### 8. Branch Performance Radar
- **API:** `GET /api/analytics/branch-performance-radar`
- **Filters:** `year` (optional)

**Landing feature impact**
- Multi-dimensional branch comparison in one visual layer.
- Useful for quick branch benchmarking (pass behavior, academic quality, backlog handling).

---

### 9. Top Performers
- **API:** `GET /api/analytics/top-performers`
- **Filters:** `limit` (optional), `year` (optional), `branch` (optional), `metric` (`sgpa` | `marks`)

**Landing feature impact**
- Leaderboard and achiever spotlight modules.
- Supports both SGPA-centric and marks-centric excellence narratives.

---

## 3) How This Powers the Landing Experience End-to-End

1. Landing app requests insight/feature data through FastAPI.
2. FastAPI orchestrates and calls the relevant `apps/server` result/analytics APIs.
3. Landing app receives curated responses ready for cards, charts, comparisons, and leaderboards.

This architecture keeps the landing experience:
- **Insight-first** (feature-rich academic narratives)
- **Consistent** (shared status logic and comparable filters)
- **Scalable** (same analytics layer supports multiple views and cohorts)

