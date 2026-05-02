# Growyy Onboarding — Welcome Flow Design

**Date:** 2026-05-02
**Status:** Approved (pending spec review)
**Owner:** Sriha

## 1. Goal

Create an immersive, animated welcome flow that introduces new users to Growyy's four core features — **Monitoring**, **Control**, **Data Visualization**, and **Prediction** — through a single continuous narrative: a plant growing from seed to harvest. The flow ends with a satisfied farmer scene that emotionally connects the product's value (greenhouse insights) to the user's reward (a successful harvest).

The flow shows **once per user** on first launch, persists via `localStorage`, and is **rewatchable** from the Profile screen. Users tap a **Continue** button to advance through scenes; the final scene auto-plays a "harvest" sequence ending with a **Get Started** CTA into the dashboard.

## 2. Narrative Arc

A single tall SVG "world" depicts a growing plant from roots-in-water at the bottom to ripe vegetables at the top. The camera (a viewport overlay) pans **upward** through the world as the user advances, with each Continue tap moving to the next altitude. The fifth scene reverses direction — a vegetable detaches and the camera **follows it down** to a farmer holding a bucket below.

| #   | Scene name | Camera position             | Visual focus                                                                                                                                                                                                                                                                                   | Feature label                |
| --- | ---------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | Roots      | Bottom — roots in reservoir | Tiny seedling drinks from reservoir; ripple animation on water; floating sensor icons (temp, pH, EC, humidity) orbit the stem                                                                                                                                                                  | **Monitoring**               |
| 2   | Buds       | Mid plant                   | Stem grows tall; leaves unfurl; tiny green vegetables bud on branches; a dosing droplet falls into the reservoir                                                                                                                                                                               | **Control**                  |
| 3   | Foliage    | Mid-upper                   | Leaves expand fully; a faint chart line draws across them in primary green; data ticks pulse around them                                                                                                                                                                                       | **Data Visualization**       |
| 4   | Crown      | Top — full plant            | Vegetables ripen (green → red); a faint "future ghost" of larger vegetables shimmers above them, suggesting predicted growth                                                                                                                                                                   | **Prediction**               |
| 5   | Harvest    | Falling, then farmer        | A ripe vegetable detaches from a top branch and falls. The camera locks onto it and descends through the plant world we already climbed. Plant fades out as a farmer scene fades in below; vegetable lands in the farmer's bucket; farmer smiles; sparkle effect; **Get Started** button rises | (no card — emotional payoff) |

### Continuity rules

- The plant **never resets** — whatever has grown stays grown. Re-watching from Profile renders the world in its final state from the start of scene 1, then animates the camera pan only.
- **Camera Y is the single source of truth** for position; scene transitions animate `cameraY` between scene anchor points.
- **Soft parallax**: the existing `GreenhouseBg` behind the plant pans at 0.4× camera speed; foreground accents (floating sensor icons, droplets, sparkles) at 1.2×.

## 3. Component Architecture

### New files

```
src/
├─ routes/
│   └─ welcome.tsx                ← new TanStack Router route
├─ components/
│   └─ welcome/
│       ├─ WelcomeScene.tsx       ← orchestrates 5 scenes + camera state + Continue button
│       ├─ PlantWorld.tsx         ← the tall SVG world (scenes 1-4 backdrop)
│       ├─ FarmerScene.tsx        ← the farmer + bucket scene (scene 5 reveal)
│       └─ FeatureCard.tsx        ← reusable glass card (icon + title + 1-line copy)
└─ hooks/
    └─ useOnboarded.ts            ← localStorage hook for "growy_onboarded" flag
```

### Modified files

- `src/router.tsx` — register the `/welcome` route, no other changes.
- `src/routes/__root.tsx` — first-launch redirect: if the path is `/` and `useOnboarded()` returns `false`, navigate to `/welcome`.
- `src/routes/profile.tsx` — add a "🌱 Replay tour" link that navigates to `/welcome` (the link does not clear the onboarded flag; rewatching is harmless).

### Component responsibilities

**`WelcomeScene.tsx`** — Top-level component for the route.

- Holds `sceneIndex` state (0 through 4) and `cameraY` derived motion value
- Renders `PlantWorld` and `FarmerScene` stacked, with the `cameraY` controlling which is visible
- Renders the active `FeatureCard` for the current scene
- Renders the `Continue` button (auto-fades in after each scene's animations land)
- On scene 5 completion, renders the `Get Started` button → calls `setOnboarded(true)` + navigates to `/`
- Wires the falling-vegetable choreography (binds vegetable Y to camera Y during the fall)

**`PlantWorld.tsx`** — The SVG illustration of the growing plant.

- One tall SVG, conceptually `viewBox="0 0 400 2400"` (4 scenes × ~600 units each, exact numbers tunable)
- Exposes anchor Y coordinates per scene as a constant export (e.g., `SCENE_ANCHORS = [2100, 1500, 900, 300]`)
- Each plant element (roots, stem, leaves, vegetables) is its own `<g>` with a `data-scene` attribute and entry animation
- "Vegetables ripen" effect uses CSS `fill` transitions on the vegetable `<g>`s
- The "future ghost" prediction shimmer uses `<g>` opacity oscillation via Framer Motion

**`FarmerScene.tsx`** — Bottom-of-flow scene.

- Sits below `PlantWorld` in the DOM; opacity fades from 0 → 1 during the fall
- A flat-illustration farmer (round body, simple face, holding a bucket)
- Bucket has a few vegetables already inside (suggesting prior harvest)
- Animations: smile curve (mouth `<path>` morph), sparkle particles burst, idle gentle bob

**`FeatureCard.tsx`** — Floating glass card with feature info.

- Props: `icon` (Lucide icon component), `title`, `description`, `accentColor`
- Uses existing `glass` and `text-ink` utility classes for visual consistency
- Animates in with `fade-in-up` style (opacity + 8px Y) on scene change

**`useOnboarded.ts`** — Tiny localStorage hook.

- Returns `[isOnboarded: boolean, setOnboarded: (v: boolean) => void]`
- Reads `localStorage.getItem("growy_onboarded") === "true"` on mount (SSR-safe: defaults to `true` during SSR to avoid a flash)
- Setter writes the string `"true"` or removes the key

## 4. Animation Choreography

### Total duration

~25-28 seconds if the user lets every scene fully play without tapping Continue early. Skipping early at any scene is fine — Continue button always works.

### Per-scene timing template (scenes 1-4)

| Time     | Event                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| 0.0s     | Camera starts panning to scene's anchor Y                                      |
| 0.0-1.0s | Camera ease-out cubic (0.22, 1, 0.36, 1)                                       |
| 0.5-2.5s | Scene-specific accents play (leaves unfurl, chart draws, vegetables bud, etc.) |
| 2.0s     | `FeatureCard` fades in (opacity + Y translate, 0.5s)                           |
| 3.0s     | `Continue` button materializes with soft pulse                                 |
| ∞        | Holds until user taps Continue                                                 |

### Scene 5 — the harvest sequence (auto-plays in full)

| Time     | Event                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------- |
| 0.0s     | One ripe vegetable detaches from a top branch (small wobble, rotation begins)                   |
| 0.3s     | Camera locks onto vegetable's Y position (`cameraY = vegetableY - viewportHeight/2`)            |
| 0.3-3.0s | Camera + vegetable descend together through the plant world (we see in reverse what we climbed) |
| 3.0s     | Plant world fades out (opacity 1 → 0); FarmerScene fades in (0 → 1)                             |
| 3.0-3.5s | Vegetable arcs gracefully into the bucket with a slight overshoot/squash easing                 |
| 4.0s     | Farmer's smile curve animates from neutral to wide; sparkle particles burst from bucket         |
| 4.0-5.0s | Hold celebration                                                                                |
| 5.0s     | `Get Started` button rises from bottom with primary-green glow                                  |
| ∞        | Holds until tap                                                                                 |

### Technical notes

- All camera and vegetable animations use Framer Motion `useMotionValue` + `animate()` for shared springs.
- Scene transitions trigger via `useEffect` on `sceneIndex` change.
- The vegetable-fall-camera-follow uses two motion values bound by `useTransform`.
- All animations respect `prefers-reduced-motion`: when set, scenes auto-advance via a 4s timer, parallax disables, and feature cards cross-fade instead of slide.

## 5. Routing & Persistence

### First-launch redirect

In `__root.tsx` (which wraps all routes), add a top-level effect:

```ts
const onboarded = useOnboarded();
const router = useRouter();
useEffect(() => {
  if (!onboarded[0] && location.pathname === "/") {
    router.navigate({ to: "/welcome" });
  }
}, [onboarded[0]]);
```

This avoids any flicker on the home page — the redirect happens before the first paint of the home content.

### Completion

When the user taps **Get Started** on scene 5:

```ts
setOnboarded(true);
router.navigate({ to: "/" });
```

### Rewatch

Profile screen adds:

```tsx
<Link to="/welcome" className="...">
  🌱 Replay product tour
</Link>
```

No flag manipulation; the tour just plays again.

## 6. Feature Copy

Drafted copy for each `FeatureCard`. Short, sensory, benefit-focused. Tweak before/during implementation as desired.

| Scene | Title                  | Description                                                                                             |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| 1     | **Live Monitoring**    | Every sensor in your greenhouse, breathing live. Temperature, pH, EC, humidity — always in your pocket. |
| 2     | **Smart Control**      | Dose nutrients, switch lights, run irrigation — from anywhere. Your greenhouse, on your terms.          |
| 3     | **Data Visualization** | Watch trends unfold. Beautiful charts that make sense of every leaf, every drop.                        |
| 4     | **AI Prediction**      | See tomorrow before it arrives. Catch problems early and grow with confidence.                          |

Scene 5 has no card — only the visual scene + Get Started button. Optional small caption above the button: "Welcome to Growyy."

## 7. Design Tokens & Styling

Reuses the existing palette and utility classes from `src/styles.css`:

- Dark greenhouse-at-night background (`--background: #0a1a0f`)
- Primary green (`--primary: #2EA84A`) and glow (`--primary-glow: #5fd47e`)
- `glass` and `glass-strong` utilities for feature cards and CTA
- `text-ink`, `text-ink-dim` for typography
- `transition-smooth` cubic-bezier(0.22, 1, 0.36, 1) for all camera and accent eases

No new tokens or palette changes. Onboarding sits inside the existing aesthetic.

## 8. Out of Scope

- Auth / account creation (no sign-in screens — flow goes directly to dashboard)
- Per-feature deep-dive screens (one card per feature is enough)
- Localization / multi-language (English only for v1)
- Animation timeline editor / scrubber for development (use Framer Motion devtools as needed)
- Telemetry / analytics events for onboarding completion (can be added later)
- Lottie or external animation files (everything is bespoke SVG + Framer Motion)
- Sound design (no audio — animations carry the emotional load)

## 9. Success Criteria

- New users see the welcome flow exactly once on their first session
- The flow reads as a single continuous "growing journey" — no scene transitions feel jarring or slide-deck-like
- The final harvest moment lands emotionally — the vegetable falling and being caught is the visual climax
- Replaying from Profile works identically with no state leaks
- 60fps smooth animation on a mid-range mobile browser (tested in Chrome DevTools mobile mode)
- All interactive elements (Continue, Get Started, Replay) have clear hit targets ≥44×44 px

## 10. Open Risks

- **SVG complexity**: drawing a believable growing plant + farmer in stylized flat illustration is artistic work. If the result doesn't match the intended visual quality, fallback is to commission or source one stylized illustration set later and swap the SVG paths in `PlantWorld.tsx` and `FarmerScene.tsx`.
- **Scene 5 choreography**: the camera-follows-falling-vegetable is the highest-risk animation. Mitigation: build it last, after the simpler scenes 1-4 are working, so we have a confident foundation.
- **First-paint flash**: if the localStorage check happens after the home page renders, users could see a flash of the dashboard before the redirect. Mitigated by checking inside `__root.tsx` and using a SSR-safe default.
