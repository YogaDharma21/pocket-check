# PocketCheck Website (Next.js + shadcn/ui + Convex + Clerk)

The Next.js web application for PocketCheck, built with shadcn/ui (Base UI Vega preset), Tailwind CSS v4, Convex backend, and Clerk authentication.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui (Base UI Vega style)
- **Styling**: Tailwind CSS v4
- **Backend & Database**: Convex
- **Authentication**: Clerk (`@clerk/nextjs`)
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<your-clerk-publishable-key>
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev`: Start Next.js development server
- `npm run build`: Build production application
- `npm run start`: Run production build
- `npm run typecheck`: Type check TypeScript files
- `npm run lint`: Lint source files with ESLint
- `npm run format`: Format code with Prettier
