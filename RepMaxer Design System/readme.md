# RepMaxer — Design System

A personal-training platform: the trainer builds plans in a desktop panel, the client logs sets on their phone. Polish UI (`pl_PL`).

This system is a **deliberate reset**, now in its second pass. The first version of it mirrored the product's current "Acid" styling — charcoal surfaces, acid-lime accent, four typefaces, gold PR highlights. That was rejected in favour of radical simplification. The second pass then went too literal on the *Styrka Gym Tracker* reference and inherited its weaknesses: near-invisible grey elements, 10px labels, and hairline type. This version keeps the minimalism and fixes the legibility.

- **No brand colour in the chrome.** Near-black, white, and the greys between; emphasis is an inverted fill, never a hue. Three quiet accents exist and live **only on data**: gold for a personal record, green for an improving number, red for a declining one.
- **Two typefaces**, down from four: **Instrument Sans** (narrow grotesque with real character) for words, **Geist Mono** for numbers and labels.
- **Controls are deliberately low.** A field is 34px, a button 38px, a chip 28px. Minimalism here means a control never eats a band of the screen; the tap area comes from the row or grid cell around it (`min-height: 44px`), not from the control's own height.
- **Phosphor icons**, not Lucide — a distinct hand rather than the generic thin-stroke set every tracker ships with.
- **Accessibility is a constraint, not a pass.** Every text grey clears WCAG AA 4.5:1, every hairline and non-text grey clears 3:1, nothing renders below 12px or under weight 400, and no state is signalled by colour alone.
- **No shadows, no gradients, no glows, no blur.** Depth is a grey step *plus* a visible 1px hairline — cards have both, so they never dissolve into the page.
- **Light and dark are equals**, and `prefers-contrast: more` pushes every secondary value to full contrast.
- **19 components**, down from 26, and each is simpler.

### What changed from the Styrka-literal pass

| | before | now |
|---|---|---|
| page / card | `#000000` / `#0E0E0E`, no border | `#0B0C0D` / `#17191B` + `--line-faint` border |
| body text | `#A3A3A3` (7.4:1) | `#C9CED4` (12.6:1) |
| labels | `#6B6B6B`, 10px, mono 400 | `#9AA1A8` (7.2:1), 12px, mono 500 |
| hairlines | `#242424` (1.4:1 — invisible) | `#33373B` (3.4:1) |
| placeholders / ticks | `#454545` (2.2:1) | `#6E767E` (3.6:1) |
| display type | Jost 300 | Instrument Sans 600 |
| focus | 2px ring, lost on cards | 2px `--bg` + 4px `--fg` two-tone ring |
| controls | 32 / 40 / 44px | 28 / 30 / 34 / 38 / 46px — lower, tap area from the container |
| icons | Lucide 1.5 | Phosphor regular (web font) |
| chart line | 1.5px, ghost axis labels | 2px, `--fg-faint` 10px labels |

## Reference & sources

- **Feel reference (not a template):** *Styrka Gym Tracker* App Store screenshots — `uploads/pasted-1785933646142-0.png`, `uploads/pasted-1785933677526-0.png`, `uploads/composite-6761281378-3-en-1x1.png`, `uploads/460x996bb.webp`, `uploads/230x498bb.webp`, and <https://apps.apple.com/pl/app/styrka-gym-tracker/id6761281378>. Used only as evidence that a gym tracker can be monochrome and dense: mono numerals over tracked caps labels, filled/outlined pill chips, a four-column set grid, a floating pill nav, a single-line chart, light-and-dark parity. **This is deliberately not a clone** — the palette is a cool near-black rather than pure black, cards carry both a fill and a hairline, type is a high-legibility grotesque rather than a geometric light, labels are 12px rather than 10px, and every grey is chosen against a contrast floor. None of Styrka's branding, copy, layout or artwork was copied.
- **Product context:** the attached read-only folder `trainer-app/` — a monorepo with `apps/web` (Next.js 16 App Router, Tailwind 4, Clerk, lucide-react) and `apps/api` (.NET 10 + EF Core + SQLite). Screen inventory, domain language, Polish copy and flows come from there: `components/ui.tsx`, `components/SessionLogger.tsx`, `components/plan-builder/*`, `components/portal/*`, `app/portal/[token]/*`, `components/landing/*`.
  **Its visual tokens (`app/globals.css`) were intentionally *not* carried over** — that is the styling being replaced.
## Brand assets

**There are none, by design.** No logo, no mark, no illustration, no photography, no product screenshots in this system. The brand is the product name set in type (`Wordmark`): **RepMaxer**, Instrument Sans / display caps, tracked. Compact mark for icons/PWA: **RM**. Never draw, reconstruct, or approximate a pictorial logo.

---

## CONTENT FUNDAMENTALS

**Language.** Polish. Second person, informal *ty*: "Wysyłasz klientowi jeden link", "Zacznij z pierwszym klientem". Never *my/we* about the product. Voice and microcopy: skill `ux-writing` — clarity before brevity; no English calques, no telegram fragments.

**Clarity is the house style.** Titles name the thing: "Progres", "Ustawienia", "Ostatnie treningi", "Do zrobienia". Supporting copy is a complete sentence. Extra words stay if they make the line understandable. Do not strip verbs until the line sounds like a slogan.

**Casing.** Sentence case for everything readable. UPPERCASE only in mono micro-labels — section labels (`CIAŁO`, `PROFIL`), field labels (`WAGA`, `WZROST`), stat labels (`REKORD`, `SESJE`), dates (`ŚRODA, 25 MAR 2026`), and the one commit button (`FINISH`).

**Numbers lead.** A metric is always the number first, label under it: `85,5 kg` / `WAGA`. Mono, tabular, decimal comma, thin-space thousands (`1 280 kg`). Never spell a quantity out.

**Em dash, not exclamation.** "Log every set—even without internet." Zero exclamation marks. Zero emoji. No hype adjectives, no "Ups!", no metaphors, no alchemy vocabulary — the name is the only flourish.

**Empty states** are two lines and a button: *"Brak treningów. Dodaj pierwszy."* Errors state the fact and the fix. Destructive actions ask once, in a small centred dialog, with the destructive verb in `--danger`.

**Only these symbols** may stand in for words: `×` (multiply / close), `·` (separator), `—` (em dash), `+` (add), `←` (back), `✓` (done).

---

## VISUAL FOUNDATIONS

**Mood.** A quiet instrument. Almost nothing on screen but numbers, hairlines and space. If an element isn't a number, a label, a hairline or a control, it probably shouldn't exist.

**Colour.** A single neutral ramp, cool rather than pure grey. Dark: `--bg #0B0C0D`, `--surface-sunken #121415`, `--surface #17191B` (cards), `--surface-raised`/`--field #212427`, `--line-faint #2B2F33`, `--line #33373B`; text `#FFFFFF → #C9CED4 → #9AA1A8 → #6E767E`. Light inverts the structure: `#FFFFFF` page, `#F2F4F6` cards, `#EDEFF2` fields, `#ADB4BB` lines, `#0B0C0D → #40464C → #5B6268 → #7D858C` text. Every component reads from tokens, so `data-theme="light"` on `<html>` is the entire theme switch, and `prefers-contrast: more` lifts `--line`, `--fg-muted` and `--fg-faint` to full contrast automatically.

**Contrast floors (non-negotiable).** Body and label text ≥ 4.5:1 against its own background. Large text, icons and UI graphics ≥ 3:1. Hairlines, placeholders, disabled states and chart ticks ≥ 3:1 — which is why `--line` is `#33373B` and not the `#242424` of the previous pass. `--fg-ghost` is the only token below 4.5:1 and it is **never** used for text a user has to read: placeholders, axis ticks and disabled labels only.

**No accent in the chrome.** Emphasis comes from the `--invert-bg / --invert-fg` pair: a white pill on black (black on white in light theme). That's the primary button, the active chip, the active segment. Secondary is a hairline. Tertiary is grey text. Buttons, navigation, surfaces and chrome icons are never coloured.

**Three data accents — and nothing else.** Colour is reserved for the moments where the number itself has meaning:

| token | dark | light | means |
|---|---|---|---|
| `--pr` | `#E0B13F` (10.2:1) | `#8A6200` (6.4:1) | personal record |
| `--gain` | `#57BF82` (9.4:1) | `#1B7A45` (5.4:1) | progress, improvement |
| `--loss` | `#EF7A70` (7.0:1) | `#BD2A22` (5.8:1) | regression, decline |
| `--danger` | `#FF6B6B` (6.1:1) | `#C0271F` (5.9:1) | destructive action — not data |

Each has a `-quiet` companion used as the marker background. They appear on a stat's value (`tone="pr"`), on its delta line, and in `Marker` badges inside list rows — never on a button, a nav item, a chrome icon, a card fill or a chart line. **Every coloured element also carries a glyph (★ ▲ ▼ –) and a sign**, so the meaning survives colour-blindness and `forced-colors`.

Direction and valence are **separate channels**, and merging them is a bug: the arrow is read off the number's own sign (`-1,2 kg` is always ▼), while `deltaTone` sets only the colour. That is how a cut shows a *green* ▼ — falling weight is progress — without the glyph contradicting the minus beside it. Left alone, the colour is inferred from the sign. Two accents never appear in the same tile.

**Type.** Two families, five roles, no weight below 400 and no size below 12px:
- **Instrument Sans** — `.t-display` (600, 40px), `.t-title` (600, 25px), `.t-heading` (500, 18px), `.t-body` (400, 15px), `.t-small` (400, 13px, `--fg-muted`). A narrow grotesque: high x-height and open apertures like a neutral UI face, but with angled terminals and tighter proportions that give it a hand of its own — and it fits more words per line on dense data screens.
- **Geist Mono** — `.t-label` (500, 12px, uppercase, 0.1em, `--fg-faint`) for every label, `.t-num` (700, tabular) for every number. Geometric and technical rather than typewriter-ish: unambiguous 0/O and 1/l, tall figures, no decorative quirks competing with the data.

Never more than three weights on a screen. Weight and grey level carry hierarchy; size steps are large when they happen (13 → 25 → 40), never incremental.

**Backgrounds.** Flat fills only. No gradient anywhere in the system — not even a subtle one. No texture, no noise, no pattern, no imagery. Screens sit on `--bg` with cards floating as slightly lighter blocks.

**Cards.** `--surface` fill **and** a 1px `--line-faint` border, `--r-card` 12px, 14px padding, no shadow. Fill alone was the mistake of the previous pass: on a black page a 14-point luminance step reads as nothing in bright light. `flat` variant drops the fill and strengthens the border to `--line`. Cards contain type, stats, pills and hairlines — nothing else. 12px between stacked cards.

**Lists instead of cards.** Repeating content is hairline-separated rows on the bare background (`ListRow`), not a stack of cards. The last row drops its rule.

**Radii.** 8px fields · 12px cards · 18px sheets · pill for anything tappable (buttons, chips, nav, switch). Nothing is square-cornered.

**Control sizes — small on purpose.** 28px chips · 30px small buttons · 34px fields · 38px standard buttons · 46px large · 24px switch. These are visual heights, not tap targets: `ListRow` and the set grid carry `min-height: 44px`, and icon buttons sit in 38px boxes with the glyph at 18px, so the touchable area always clears the 44px floor even though nothing looks chunky. **Never widen or heighten a control to "make it easier to hit" — enlarge its container instead.**

**Spacing.** 4px scale. Card padding 16, screen gutter 20 (mobile) / 32 (desktop), card gap 12, section gap 32. Phone column 390px, desktop content 1080px.

**Borders & hairlines.** Always exactly 1px. `--line` for structural edges and flat cards, `--line-faint` for row dividers. There are no thick rules, no double rules, no dashed borders.

**Shadows.** None. Zero. The system has no shadow tokens. The only "elevation" cues are: a lighter grey fill, a hairline, or a scrim behind a sheet.

**States.** Hover: solid controls shift to `--fg-muted`, outline controls and cards step up one grey and strengthen their border, rows gain a `--surface` fill. Opacity is no longer used for hover — dimming a control to signal interactivity works against contrast. Press: `scale(0.97)`. Focus-visible: a two-tone ring (2px `--bg`, then 4px `--fg`) so it survives on cards, on the page and on top of an inverted fill. Disabled: `opacity: 0.45`.

**Never colour alone.** Data accents always pair with a glyph and a sign. Links keep a permanent underline. The switch draws a check inside its knob when on, so state is a shape as well as a fill. Active nav, chips and segments invert their fill rather than tinting. Destructive actions pair `--danger` text with the word ("Usuń", "Odrzuć") — never a red dot on its own.

**Motion.** One duration and one curve for state (`150ms`, `cubic-bezier(0.2,0,0.2,1)`), `260ms` for entrances (fade + 6px translateY). No bounce, no spring, no parallax, no colour transitions, no layout animation. Charts don't animate.

**Transparency & blur.** Only the sheet scrim (`--scrim`). Nothing else is translucent; **no backdrop blur anywhere** — the previous system's blurred docks were removed as decoration.

**Layout rules.** The phone nav is a *floating pill*, centred, 20px off the bottom edge, not a full-width bar. The logging screen is a full-screen takeover with its own top bar. Desktop has a hairline top nav, no sidebar. Sheets rise from the bottom; confirms are small centred dialogs.

**Charts.** One `--fg` polyline at 2px — the line itself is never coloured; the trend is stated as a `Marker` beside the chart title, optional dots ringed in `--bg` so they read against the line, and sparse 10px `--fg-faint` mono ticks on the right with dates below. No grid, no axis lines, no fill, no second series, no legend. Sparkline mode drops the axes entirely. A chart never carries information that isn't also available as a number.

---

## ICONOGRAPHY

- **Phosphor**, loaded as a **web font** from `https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css` and wrapped by `Icon`. Because it's a font, an icon is text: it inherits `currentColor`, scales with `font-size`, and needs no per-icon JavaScript or SVG inlining.
- **Why not Lucide.** Lucide (and Feather, and Tabler) is the default thin-stroke set on every fitness tracker, including the reference app — using it made the system look like a clone. Phosphor's slightly rounded terminals and geometric construction read as a deliberate choice.
- **Regular weight** everywhere. `light` only above 24px; never `fill`, `bold` or `duotone`.
- Sizes: 18px inline in rows, 20px in navigation, 15px for chevrons and inside small icon buttons.
- Icons are never coloured and never filled: `currentColor`, inheriting `--fg-muted` (never `--fg-ghost` — icons are UI graphics and must clear 3:1). An active nav icon inherits `--invert-fg` from its filled pill.
- An icon is never the only label for an action: every icon-only control carries a `title` that doubles as its `aria-label`.
- Glyphs in use: `barbell person-simple-run trend-up gear plus caret-left caret-right trash x-circle calendar-blank check magnifying-glass pencil-simple clock-countdown`. `Icon` also accepts plain-English aliases (`dumbbell`, `workout`, `progress`, `settings`, `back`, `forward`, `delete`, `search`, `edit`). Keep the vocabulary this small — if a concept needs a new glyph, ask whether a mono label would say it better.
- **No emoji, ever.** No custom SVG illustration.

## FONTS — SUBSTITUTION FLAG

No font files were supplied. The pairing is **Instrument Sans** + **Geist Mono**, both Google Fonts, loaded by CDN `@import` in `tokens/fonts.css`.

This is the third pairing. Jost + Space Mono (pass 2) was too light and too Styrka-adjacent; Public Sans + JetBrains Mono (pass 3) fixed legibility but read as neutral-by-committee. Instrument Sans keeps the accessibility properties that mattered — tall x-height, open apertures, unambiguous I/l/1 — while its narrower proportions and angled terminals give the product its own voice and fit more data per line. Geist Mono is the technical counterpart: clearly separated 0/O and 1/l, tall figures, no typewriter mannerisms.

If real typefaces exist — or you want another pairing — send them and I'll swap the `@import` for `@font-face`; nothing else in the system changes.

---

## INDEX

**Root** — `styles.css` (the only file consumers link), `readme.md`, `SKILL.md`, `thumbnail.html`.

**`tokens/`** — `fonts.css`, `colors.css` (dark + `[data-theme="light"]`), `typography.css`, `spacing.css`, `motion.css`, `base.css`.

**`components/components.css`** — the class layer the React primitives use; imported by `styles.css`.

**`guidelines/`** — 18 specimen cards: Colors (surfaces dark, surfaces light, text ramp & contrast, no-accent-in-chrome, data accents, accessibility rules), Type (display, titles & body, labels, numerals), Spacing (scale, radii, control heights), Brand (surfaces & hairlines, states, motion, icons, voice).

**Components**
- `components/core/` — **Button**, **IconButton**, **Pill** (+ `PillRow`), **Input**, **Field**, **Switch**, **Icon**
- `components/display/` — **Card**, **StatTile** (+ `Marker`), **SectionLabel** (+ `Divider`), **ListRow**, **Wordmark**
- `components/navigation/` — **TopBar**, **SegmentedControl**, **BottomNav**
- `components/session/` — **SetRow** (+ `SetRowHeader`), **ExerciseBlock**
- `components/feedback/` — **Sheet**
- `components/charts/` — **LineChart**

*Dropped from the previous version and not replaced:* Badge, Tag, Avatar, ProgressRing, Tabs, Dialog (now `Sheet`), Toast, ErrorBanner, EmptyState, Skeleton, PageHeader, RestTimer, SessionDock, SetValueInput. Status is now a mono label, feedback is inline text, and there is one overlay instead of four.

**UI kits**
- `ui_kits/client_app/` — Treningi → logowanie serii → Progres → Ustawienia, with a live light/dark switch.
- `ui_kits/trainer_panel/` — Klienci → profil klienta (Historia / Plan).

The marketing landing kit from the previous version was removed — it was built in the old visual language. Say the word and I'll rebuild it in this one.
