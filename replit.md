# Growy - Smart Indoor Farming Dashboard

## Overview

Growy is a mobile-first hydroponics/indoor farming monitoring application. It provides a dashboard to monitor and control grow room conditions (temperature, humidity, pH, EC/PPM) with an AI-powered "GrowyBot" copilot.

## Tech Stack

- **Framework**: React 19 + TanStack Start (SSR-capable React framework)
- **Router**: TanStack Router (file-based, type-safe)
- **Build**: Vite 7 with `@lovable.dev/vite-tanstack-config`
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Language**: TypeScript

## Project Structure

- `src/routes/` — File-based routing (TanStack Router)
  - `__root.tsx` — App shell and layout
  - `index.tsx` — Home dashboard
  - `rooms.$roomId.tsx` — Individual grow room detail view
  - `chat.tsx` — GrowyBot AI copilot
  - `disease.tsx` — Leaf disease scanner
- `src/components/` — React components
  - `ui/` — shadcn/ui reusable components
  - `GrowyBot.tsx` — Animated SVG mascot
  - `WaterTank.tsx` — Visual tank level component
  - `GreenhouseBg.tsx` — Ambient background
- `src/lib/mockData.ts` — Application state (rooms, metrics, tanks)
- `src/hooks/` — Custom React hooks
- `src/styles.css` — Global styles
- `routeTree.gen.ts` — Auto-generated TanStack Router type tree

## Development

- **Dev server**: `npm run dev` on port 5000
- **Build**: `npm run build`

## Replit Configuration

- Dev workflow runs on `0.0.0.0:5000` with `allowedHosts: true` for proxy compatibility
- Deployment configured as static site with `npm run build` → `dist/client`
