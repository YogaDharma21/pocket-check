# PocketCheck Architecture

## Overview

PocketCheck is an everyday carry (EDC) and departure checklist application built as a TypeScript monorepo orchestrated with **Turborepo** and **pnpm workspaces**. It delivers cross-platform applications across Web, Desktop, and Mobile, powered by shared TypeScript domain libraries and a Convex backend.

```
pocket-check/
├── apps/
│   ├── web/            # Next.js 15 web application (React 19, Tailwind CSS v4)
│   ├── desktop/        # Electron desktop application (React 19, Vite, offline-first)
│   └── mobile/         # Mobile application (Expo, React Native, Expo Router)
├── packages/
│   ├── presets/        # @pocket-check/presets (smart routines, multi-item parser, URL codecs)
│   ├── weather/        # @pocket-check/weather (Open-Meteo client, advisories, SWR cache)
│   ├── types/          # @pocket-check/types (shared TypeScript interfaces & models)
│   └── convex/         # @pocket-check/convex (backend schema, mutations, queries)
├── docs/               # Architecture and project specifications
└── turbo.json          # Turborepo task pipeline configuration
```

---

## Workspaces and Applications

### Apps (`apps/`)

- **`apps/web`**: Next.js 15 App Router application with React 19, Tailwind CSS v4, Radix UI primitives, Lucide icons, and Convex real-time subscriptions.
- **`apps/desktop`**: Electron cross-platform desktop wrapper with a React 19 + Vite renderer. Features persistent window state bounds, system tray support, global keyboard shortcuts, and offline-first local storage with Convex synchronization.
- **`apps/mobile`**: Universal iOS and Android client powered by Expo and React Native, featuring native haptic feedback, Expo Router file-based navigation, and offline persistence.

### Shared Packages (`packages/`)

PocketCheck shares domain logic, types, and services across all clients via internal packages linked through `workspace:*` dependencies:

- **`@pocket-check/presets`**:
  - Curated routine presets (Work, Gym, Campus, Travel, Errand, Night Out, Hike).
  - Multi-item quick-add parser supporting comma, newline, semicolon, and bullet delimiters with trailing whitespace trimming and empty token filtering.
  - Automatic keyword-based icon detection.
  - URL-safe base64 routine payload encoder and decoder (`encodeRoutinePayload`, `decodeRoutinePayload`) with unpadded base64url compatibility and structured schema validation.

- **`@pocket-check/weather`**:
  - Open-Meteo API weather forecasting and packing advisory rules (rain, wind, extreme cold/heat).
  - Persistent stale-while-revalidate (SWR) cache with 30-minute TTL, coordinate rounding (2 decimals), and cross-platform storage adapter (localStorage / AsyncStorage).

- **`@pocket-check/types`**:
  - Shared TypeScript data contracts for routines, items, schedules, preferences, and sync payloads.

- **`@pocket-check/convex`**:
  - Backend schema definitions, Convex queries, mutations, and generated API types (`Id<"items">`, `Id<"routines">`).

---

## Dependency Management & Import Architecture

Apps consume domain packages directly via their package names:
```typescript
import { SMART_PRESETS, parseMultiItemInput, encodeRoutinePayload } from "@pocket-check/presets";
import { getWeatherWithCache, getWeatherAdvisory } from "@pocket-check/weather";
```

Local re-export wrappers (`lib/presets.ts`, `lib/weather.ts`) have been eliminated in favor of direct `@pocket-check/*` package references, ensuring a single source of truth and predictable bundler tree-shaking across Vite, Next.js, and Metro.

---

## Build Pipelines & Tooling

Turborepo orchestrates build, lint, typecheck, and test tasks across the workspace:

- **`pnpm run build`**: Runs `turbo run build`, compiling shared packages and building production bundles for web, desktop, and mobile.
- **`pnpm run typecheck`**: Runs `tsc --noEmit` across all workspaces topologically.
- **`pnpm run test`**: Executes unit test suites (Vitest / Jest) across shared packages and apps.
- **`pnpm run lint`**: Runs ESLint across all packages and applications.
