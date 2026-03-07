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

Returns all student results for a specific year with pagination support.

**Endpoint:** `GET /api/result/by-year`

**Query Parameters:**
- `year` (required) - Academic year (1-4)
- `page` (optional) - Page number (default: 1, minimum: 1)
- `perPage` (optional) - Results per page (default: 10, minimum: 1, maximum: 100)

**Example Request:**
```bash
GET https://singularity-server.devxoshakya.workers.dev/api/result/by-year?year=2&page=1&perPage=20
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
  "pagination": {
    "currentPage": 1,
    "perPage": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Pagination Metadata:**
- `currentPage` - Current page number
- `perPage` - Number of results per page
- `totalCount` - Total number of results available
- `totalPages` - Total number of pages
- `hasNextPage` - Boolean indicating if next page exists
- `hasPreviousPage` - Boolean indicating if previous page exists

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
- Maximum `perPage` value is 100 to prevent performance issues
- Both endpoints use Prisma Accelerate caching for optimized performance

## Development

```bash
bun run dev
```

## Deployment

```bash
bun run deploy
```
