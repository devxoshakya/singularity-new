# Singularity - The AI Brain for Institutions

Singularity is a comprehensive, AI-driven platform designed specifically for educational institutions. It provides instant answers to student queries, real-time results, and powerful administrative insights, all within a modern, highly interactive interface.

## 🚀 Key Features

- **AI-Powered Chat**: A 24/7 intelligent assistant that provides instant answers to students and staff based on institutional knowledge.
- **Admin Dashboard**: Comprehensive analytics and management tools for administrators to monitor engagement and system performance.
- **Organization Management**: Multi-tenant architecture allowing multiple institutions to manage their own users and data.
- **Knowledge Base Submission**: Simple document upload system for indexing institutional data into the AI's knowledge base.
- **AI Playground**: A dedicated space for testing and fine-tuning AI responses in real-time.
- **Comprehensive Analytics API**: Robust backend for tracking student performance, including status distribution (Pass, PCP, Fail) and branch-wise breakdown.
- **Institutional Results Tracking**: Seamlessly integrate and display academic results (e.g., MIET results) directly within the platform.
- **Interactive Visuals**: Immersive experience with 3D backgrounds, animated transitions, and a modern "Black Hole" theme.
- **Documentation System**: Full-featured documentation site built with Fumadocs, including search and MDX support.

## 🛠️ Tech Stack

- **Frontend**: 
  - [Next.js 15](https://nextjs.org/) (App Router)
  - [React 19](https://react.dev/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Framer Motion](https://www.framer.com/motion/) (Animations)
  - [Radix UI](https://www.radix-ui.com/) (Accessible Components)
  - [Three.js](https://threejs.org/) & [OGL](https://github.com/o-g-l/ogl) (3D Visuals)
- **Backend**:
  - [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
  - [Prisma](https://www.prisma.io/) with PostgreSQL (via `@singularity/db`)
  - [Clerk](https://clerk.com/) (Authentication)
  - [Dodo Payments](https://dodopayments.com/) (Billing & Subscriptions)
- **AI/ML**:
  - [Google Gemini Pro](https://ai.google.dev/) (`@google/genai`)
- **Developer Tools**:
  - [Fumadocs](https://fumadocs.dev/) (Documentation)
  - [TanStack React Query](https://tanstack.com/query/latest) (Data Fetching)
  - [Recharts](https://recharts.org/) (Charts)
  - [TypeScript](https://www.typescriptlang.org/)

## 📂 Project Structure

```text
src/
├── app/              # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (chat)/       # AI Chat interface
│   ├── (home)/       # Landing page sections
│   ├── (admin)/      # Administrative dashboard
│   ├── api/          # Backend API endpoints
│   └── docs/         # Fumadocs-powered documentation
├── components/       # Reusable React components (UI, Auth, Dashboard, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Shared utility functions and service configurations
├── sections/         # Landing page specific sections (Hero, Features, etc.)
└── types/            # TypeScript type definitions
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ 
- npm / pnpm / yarn
- A PostgreSQL database
- Clerk Account (for Authentication)
- Google AI Studio API Key (for Gemini)
- Dodo Payments Account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd singularity-new/apps/landing
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables (create a `.env` file):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=your_postgresql_url
   GEMINI_API_KEY=your_gemini_api_key
   DODO_PAYMENTS_API_KEY=your_dodo_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:4000](http://localhost:4000) in your browser.

## 📄 Scripts

- `npm run dev`: Starts the development server on port 4000.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run postinstall`: Generates Fumadocs MDX files.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚖️ License

Private - All Rights Reserved.
