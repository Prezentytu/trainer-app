# Workout Alchemist — Design System

**Workout Alchemist** is a personal-training platform built on full personalization. Trainers compose and assign training plans; clients receive them in a mobile app and know exactly what to do and when — a set-by-set tracker in the spirit of Gravitus.

**Products**
1. **Trainer studio** (desktop web) — client roster, plan builder, assignment.
2. **Client app** (mobile) — today's workout, live set logging, progress.

**Sources provided:** none (no Figma, codebase, or brand files). This system was authored from scratch from the company description. No logo was provided — the brand renders as the wordmark "Workout Alchemist" in plain display type; never draw a mark.

## CONTENT FUNDAMENTALS
- **Voice:** the calm, exacting coach. Confident, second person ("Your next session", "You lifted 12% more this month"). The trainer is addressed as the author: "Assign to Maya".
- **Alchemy is seasoning, not costume.** One themed word where it earns its place ("Formula" = a plan template, "Gold" = a PR). Never stacked; UI chrome stays literal: "Clients", "Plans", "Sets", "Rest".
- **Casing:** sentence case everywhere, including buttons ("Start workout", "Add exercise"). ALL-CAPS only for tiny labels/eyebrows (SETS, REST, WEEK 3) with `--tracking-caps`.
- **Numbers do the talking:** copy leads with concrete numbers in mono ("3 × 8 @ 62.5 kg", "Rest 90s"). No hype adjectives, no exclamation marks, no emoji.
- **Empty states** instruct, never apologize: "No plan assigned yet. Build one from a formula or start blank."

## VISUAL FOUNDATIONS
- **Mood:** a night lab — warm charcoal neutrals (`--ink-*`), parchment text (`--bone-*`), and **exactly one working accent: teal `--accent` (#3E9C8F)** for primary actions, focus rings and active nav. `--teal-300` is the lighter "done / on-track" step. **Gold (`--pr`, #E8BB4F) is reserved for personal bests only** — never buttons, never nav; its scarcity is what makes a PR feel earned. Terracotta (`--danger`, #CF6B4B) for destructive actions and missed sessions.
- **Ratio rule:** ~90% neutral surface + text, ~8% teal, ~2% gold/clay. One teal element per screen region; never two primaries in view. Nothing above ~60% saturation except PR gold.
- **Type:** Bricolage Grotesque (display/headings, tight leading), Instrument Sans (body), IBM Plex Mono (all numerals that matter: weights, reps, timers, stats — semantic ramps in `tokens/typography.css`, e.g. `--type-stat`).
- **Backgrounds:** flat solid inks, no gradients, no textures, no imagery. Hierarchy = 3 surface steps (`--bg-app` → `--surface-card` → `--surface-hover`).
- **Cards:** `--surface-card`, 1px `--border-subtle`, `--radius-lg` (16px), `--shadow-card` (faint inner top highlight + 1px drop). Depth comes from borders and highlight, not big shadows.
- **Radii:** controls 10px (`--radius-md`), cards 16px, sheets/modals 24px, pills/badges `--radius-pill`.
- **Spacing:** 4px scale (`--space-*`); card padding 20–24px; mobile screen gutter 20px; tap targets ≥44px.
- **Borders:** 1px always; `--border-strong` for interactive rest states, teal only at focus (`--glow-accent` ring).
- **Hover:** surface lightens one step (`--surface-hover`); teal buttons lighten to `--accent-hover`. **Press:** darken one step + `transform:scale(0.98)`. Focus-visible: teal ring.
- **Motion:** fast and physical — 120ms/220ms, `--ease-out`; fades + small translate-Y; no bounces. Timers/progress animate continuously.
- **Transparency/blur:** only the modal scrim (`--overlay-scrim`) and mobile sticky bars (`backdrop-filter:blur(12px)` over app bg at 80%).
- **Imagery:** none in-product; exercise media are user/library photos in 10px-radius wells, shown desaturated-warm.

## ICONOGRAPHY
- **Lucide** via CDN (`https://unpkg.com/lucide@latest`) — 1.75px stroke, `currentColor`, 20px in controls, 24px in nav. Teal when active; gold only on a PR glyph. This is a substitution: no icon assets were provided. No emoji, ever. Unicode glyphs allowed only for × (close) and · (dot separators).
- No logo asset exists; wordmark = "Workout Alchemist" set in Bricolage Grotesque 700, or "WA" monogram in type for tight spaces (documented absence — do not invent a drawn mark).

## FONTS — SUBSTITUTION FLAG
No font files were provided. Google Fonts are loaded by CDN `@import` in `tokens/fonts.css`: Bricolage Grotesque, Instrument Sans, IBM Plex Mono. If the brand has real typefaces, supply the files and we'll swap in `@font-face` rules.

## INDEX
- `styles.css` — global entry (imports everything under `tokens/`).
- `tokens/` — colors, typography, spacing, effects, fonts, base.
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/forms/` — Button, IconButton, Input, Select, Checkbox, Radio, Switch.
- `components/display/` — Card, Badge, Tag, StatBlock, Icon.
- `components/navigation/` — Tabs, SegmentedControl.
- `components/feedback/` — Dialog, Toast, Tooltip, ProgressRing.
- `ui_kits/trainer_studio/` — desktop web: roster + plan builder (index.html interactive).
- `ui_kits/client_app/` — mobile: today / live logging / progress (index.html interactive).
- `SKILL.md` — agent skill entry point.

**Intentional additions** (no source defined an inventory): StatBlock, SegmentedControl, ProgressRing, Icon — required by the tracker product (stats, view switching, set progress, Lucide wrapper).
