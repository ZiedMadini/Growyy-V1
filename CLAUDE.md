# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 5000 (http://localhost:5000)
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier (run this after any file edits — project enforces no CRLF)
```

> On Windows, prettier will flag CRLF line endings. Always run `npm run format` after editing files.

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **TanStack Router** (file-based routing, SSR-capable via `@tanstack/react-start`)
- **Tailwind CSS v4** — config is entirely in `src/styles.css` via `@theme inline {}`, no `tailwind.config.ts`
- **Framer Motion** for all animations
- **Recharts 2** for charts (AreaChart, ComposedChart)
- **shadcn/ui** components in `src/components/ui/` (do not modify these)
- All data is static mock data in `src/lib/mockData.ts` — there is no backend

## Routing

Routes live in `src/routes/` and are file-based (TanStack Router codegen writes `src/routeTree.gen.ts` automatically — never edit that file manually).

| File                                                                                                              | Path                                |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `__root.tsx`                                                                                                      | Shell + first-launch redirect logic |
| `index.tsx`                                                                                                       | `/` — Home dashboard                |
| `rooms.$roomId.tsx`                                                                                               | `/rooms/:roomId` — Room detail      |
| `welcome.tsx`                                                                                                     | `/welcome` — Onboarding flow        |
| `profile.tsx`, `chat.tsx`, `nutrients.tsx`, `disease.tsx`, `notifications.tsx`, `setpoints.tsx`, `active-run.tsx` | Feature pages                       |

**First-launch redirect:** `__root.tsx` reads `useOnboarded()` and redirects from `/` → `/welcome` when `localStorage.growy_onboarded !== "true"`. To reset onboarding during dev, clear that key in DevTools.

## Layout Pattern

Every page that has the bottom nav wraps its content in `<MobileShell>`:

```tsx
<MobileShell bgVariant="leaves">
  {" "}
  {/* or "pipes" or "none" */}
  <AppHeader title="..." subtitle="..." showBack showNotifications showProfile />
  <section className="px-5 mt-5">{/* content */}</section>
</MobileShell>
```

- `MobileShell` caps width at `max-w-[440px]`, centers on wide screens, applies `.bg-breathe`, and renders the fixed bottom nav
- `pb-32` is baked into `MobileShell` so content isn't hidden behind the nav — do not add extra bottom padding
- `AppHeader` handles `pt-12` top safe area, back button, notification bell, and profile avatar

## Design System

All tokens are CSS custom properties in `src/styles.css`. Key ones:

| Token            | Value     | Usage                          |
| ---------------- | --------- | ------------------------------ |
| `--background`   | `#182810` | Warm olive-green base          |
| `--primary`      | `#2ea84a` | Green CTA, active states       |
| `--primary-glow` | `#5fd47e` | Icon color, chart strokes      |
| `--warning`      | `#ffd166` | Yellow accents, forecast lines |
| `--destructive`  | `#ff6b6b` | Alerts, critical states        |

**Utility classes to use (not Tailwind equivalents):**

- `.glass` — frosted card surface (bg + blur + border + shadow)
- `.glass-strong` — slightly more opaque variant, used for the bottom nav
- `.text-ink` — primary text (`#e8f5ec`)
- `.text-ink-dim` — secondary text (`#8ab894`)
- `.text-ink-soft` — tertiary text (`#6a9778`)
- `.bg-breathe` — slow 8s breathing animation on the root background color
- `.font-num` — JetBrains Mono with tabular numerics, use for all numeric values
- `.dot-healthy` / `.dot-warning` / `.dot-critical` — animated status dot colors

**Section header pattern** (used consistently on every page):

```tsx
<h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">Label</h3>
```

**Card pattern:**

```tsx
<div className="glass rounded-3xl p-4">...</div>   {/* large card */}
<div className="glass rounded-2xl p-3">...</div>   {/* small card */}
```

**Primary button:**

```tsx
<button style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }} className="rounded-full ...">
```

## Key Components

- **`GreenhouseBg`** — absolute-positioned SVG leaf/pipe silhouettes behind page content, rendered by `MobileShell`. `bgVariant="none"` skips it. Opacity 0.07 with 1.5px blur.
- **`AnimatedNumber`** — count-up animation for sensor values. Takes `value`, `decimals`, `duration`.
- **`WaterTank`** — animated water tank SVG with wave animation. Takes `level` (0–100) and `height`.
- **`StatusDot`** — pulsing dot using `.dot-healthy/warning/critical` CSS classes.
- **`GrowyBot`** — the app mascot SVG with idle blink/sway animations.
- **`GrowBar`** — SVG plant progress bar for the home room cards. Takes `pct` (0–100), `stage`, `day`, `totalDays`. Renders a stage-aware plant SVG (seedling/bush/flower) that grows along the bar with Framer Motion animation.
- **`FloatingParticles`** — 18 floating green particle divs using CSS `float-up` keyframe. File exists at `src/components/FloatingParticles.tsx` but is **not currently rendered** (removed from `MobileShell`).

## Chat — Markdown Stripping

`src/routes/chat.tsx` defines `stripMarkdown()` which is applied to every AI reply before display. It strips `**bold**`, `*italic*`, `__underline__`, `_italic_`, `## headers`, `` `code` ``, and converts `- list items` to `•`. This prevents raw asterisks/hashes from appearing in bot messages.

## Welcome / Onboarding Flow

`src/components/welcome/WelcomeScene.tsx` orchestrates 5 scenes with `AnimatePresence` slide transitions. Each scene is a self-contained component in `src/components/welcome/scenes/`:

1. `MonitoringScene` — arc gauges (SVG `<path>` half-circles, same pattern as `rooms.$roomId.tsx`)
2. `ControlScene` — dosing progress bars + toggle cards
3. `DataVizScene` — Recharts `AreaChart` (7-day history)
4. `PredictionScene` — Recharts `ComposedChart` (solid history `Area` + dashed forecast `Line`)
5. `CelebrationScene` — GrowyBot hero + sparkle particles

Completing the flow calls `setOnboarded(true)` and navigates to `/`.

## Arc Gauge Pattern

The half-circle gauge used in `MonitoringScene` and `rooms.$roomId.tsx`:

```tsx
const CIRC = 188; // approximate arc length for the SVG path below
const offset = CIRC - (pct / 100) * CIRC;

<svg viewBox="0 0 100 60">
  {/* Track */}
  <path
    d="M 10 55 A 40 40 0 1 1 90 55"
    fill="none"
    stroke="rgba(255,255,255,0.08)"
    strokeWidth="7"
    strokeLinecap="round"
  />
  {/* Animated fill */}
  <motion.path
    d="M 10 55 A 40 40 0 1 1 90 55"
    stroke={color}
    strokeWidth="7"
    strokeLinecap="round"
    strokeDasharray={CIRC}
    animate={{ strokeDashoffset: offset }}
  />
</svg>;
```

## Mock Data

`src/lib/mockData.ts` exports everything the app renders:

- `rooms` — 4 grow rooms with metrics, targets, and status
- `tanks` — 6 nutrient/pH reservoirs
- `history7d` — 7-day arrays for temp/humidity/pH/EC (used by charts)
- `forecastData` — history + 5-day forecast per metric with alert messages
- `recipes`, `dosingLog`, `notifications`, `chatHistory`, `devicesMock`, etc.

When adding new UI features, add the corresponding mock data here rather than inlining it in components.
