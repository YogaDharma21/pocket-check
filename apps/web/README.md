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
pnpm install
```

2. Configure environment variables in `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<your-clerk-publishable-key>
```

3. Run the development server:
```bash
pnpm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `pnpm run dev`: Start Next.js development server
- `pnpm run build`: Build production application
- `pnpm run start`: Run production build
- `pnpm run typecheck`: Type check TypeScript files
- `pnpm run lint`: Lint source files with ESLint
- `pnpm run format`: Format code with Prettier
