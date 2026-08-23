# PocketCheck

PocketCheck is an intelligent everyday carry (EDC) and departure checklist platform designed to ensure you never leave essential gear behind. It features real-time synchronization, destination routines, departure intelligence, weather-aware packing suggestions, and keyboard-first accessibility.

## Repository Overview

This repository is organized as a monorepo containing the web application, mobile app, and backend definitions:

```
pocket-check/
├── apps/
│   ├── website/        # Next.js 16 web application (React 19, Tailwind CSS v4, Base UI)
│   └── mobile/         # Expo SDK 54 mobile application (React Native, Expo Router)
├── docs/               # Architecture and design documentation
└── .github/
    └── workflows/      # GitHub Actions CI/CD pipelines
```

## Features

- **Destination Routines**: Custom checklists tailored for Work, Campus, Travel, Gym, or daily outings.
- **Departure Intelligence**: Smart assistant highlighting remaining items before stepping out.
- **Free Weather Suggestions**: Contextual alerts powered by the open-source Open-Meteo API suggesting gear like umbrellas based on daily rain forecasts.
- **Custom Auto-Reset Schedules**: User-scheduled reset times and active weekdays to automatically refresh checklists each morning.
- **Keyboard-First Workflow**: Fast keyboard navigation (`Space` to toggle, `J`/`K` to move, `1`-`9` for routines, `Shift+U` to reset).
- **Multi-Item Quick Add**: Bulk comma and newline parser to paste complete checklists from notes in seconds.
- **Smart Icon Auto-Detection**: Real-time keyword matching that automatically assigns icons to items while typing.
- **Universal Export & Share**: 1-click export to Markdown, JSON, or printable view, with shareable routine import links.

## Tech Stack

- **Frontend (Web)**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Base UI / Radix primitives, Lucide Icons
- **Mobile**: React Native 0.81, Expo SDK 54, Expo Router v6
- **Database & Realtime**: Convex Cloud
- **Authentication**: Clerk
- **CI/CD**: GitHub Actions with path-based change detection

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Web Application Setup

1. Navigate to the website directory:
   ```bash
   cd apps/website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `apps/website/.env.local`:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://<your-convex-app>.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<your-clerk-key>
   CLERK_SECRET_KEY=sk_test_<your-clerk-key>
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Mobile Application Setup

1. Navigate to the mobile directory:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Expo:
   ```bash
   npm run start
   ```

## CI/CD Workflow

The repository includes GitHub Actions workflows configured in `.github/workflows/ci.yml`:
- Path-based filtering triggers validation only on relevant directory changes (`apps/website/**` or `apps/mobile/**`).
- Automated typechecking (`tsc --noEmit`), linting (`eslint`), and production builds (`next build`).

## License

MIT
