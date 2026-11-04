# Apple Design — sekcje rzadziej potrzebne

Wyjęte z `SKILL.md` bez zmian treści. Czytaj tylko sekcję, której dotyczy zmiana.

## 4. Ask First — springi i gesty ciągłe

**Nie implementuj** springów, velocity handoff, momentum projection ani rubber-bandingu bez zgody. W `apps/web` nie ma biblioteki motion; nowa zależność npm = Ask First (`AGENTS.md`).

Sięgnij po springi / Pointer Events + capture **dopiero** gdy pojawia się realny gest ciągły: bottom sheet / drawer z przeciąganiem, swipe wiersza serii, karuzela z flickiem. Sam fade/slide Dialoga lub AppShell drawer **nie** uzasadnia nowej libki — wystarczą tokeny z §3.

Gdy (i tylko gdy) dostaniesz zgodę, zachowaj te reguły:

1. **Przerywalność** — nigdy nie blokuj inputu na czas transition; nowy gest przejmuje od wartości *presentation* (live transform), nie od targetu.
2. **Velocity handoff** — po release spring startuje z velocity palca (brak „szwu" drag → animate).
3. **Projekcja pędu** — target = snap nearest do `current + (v/1000)·d/(1−d)` przy `d ≈ 0.998`, nie nearest do punktu puszczenia.
4. **Rubber-band** na krawędzi — progresywny opór, nie twardy stop.
5. **2D = osobne osie** X/Y (nie jeden spring na dystans).
6. Bounce / under-damping **tylko** po geście z momentum (flick); menu/fade → critically damped / jak dziś: **bez bounce**.

Do tego czasu: CSS transitions + istniejący press feedback.

---

## 6. Materiały i głębia

Translucentne warstwy = struktura bez kradzieży focusu. Mapowanie na istniejące:

| Element | Gdzie |
|---|---|
| `.session-chrome` | `backdrop-filter: blur(16px) saturate(160%)` — sticky header/footer sesji |
| `.session-chrome-edge::after` | gradient fade na krawędzi scrolla — zamiast twardego 1px dividera pod floating chrome |
| `--overlay-scrim` | dimming pod `Dialog` (modal = fokus; panel równoległy = bez scrimu) |
| `--shadow-card` / `--shadow-raised` / `--shadow-modal` | wsparcie elewacji; na Acid głębia głównie **luminancją** (`surface-sunken` → `surface` → `surface-hover`) |
| `--glow-accent` | **jedyny** glow — focus-visible ring; CTA/PR bloom = `none` |

Twarde reguły:

- **Nigdy szkło na szkle** — legibility pada.
- Treść przewija się **pod** translucentnym chrome, nie pod nieprzezroczystym paskiem bez potrzeby.
- Większa powierzchnia = mocniejszy blur / głębszy shadow niż mały chip.
- Vibrancy: tekst na blurze → wyższy kontrast, nieco cięższa waga, lekki bump tracking; kolor marki na solidnej warstwie, nie na samym glass.
- Materialize: przy enter/exit glass animuj blur + scale razem z opacity (gdy w ogóle animujesz) — nie sam fade.
- `prefers-reduced-transparency: reduce` → solidniejszy background, bez blur (już w `globals.css` dla `.session-chrome`).

---

## 10. Osiem zasad (słownik decyzji)

Używaj tych nazw przy uzasadnianiu UI:

1. **Purpose** — decyzja, czego *nie* budować; każda funkcja kosztuje uwagę.
2. **Agency** — kontrola u użytkownika; undo > modal; confirm tylko przy nieodwracalnym.
3. **Responsibility** — interes użytkownika; privacy i safety (zwłaszcza AI).
4. **Familiarity** — metafory i fizyka, które ludzie znają; to samo wygląda = to samo zachowanie.
5. **Flexibility** — kontekst (mobile sesja vs desktop kreator), zdolności, personalizacja gdy jeden layout nie wystarczy.
6. **Simplicity** — nie minimalizm: usuń zbędne, pokaż wspólną ścieżkę najpierw; czasem *dodanie* kontekstu upraszcza.
7. **Craft** — każdy spacing, timing, alignment ma uzasadnienie; jitter i krzywe layouty = niedbałość.
8. **Delight** — skutek siedmiu poprzednich, nie confetti na wierzchu; ton Acid: spokojny coach (`design-system`).

Dodatkowo:

- **Feedback w 4 rodzajach:** status, completion, warning, error — inline, nie tylko na submit.
- **Wayfinding:** każdy ekran odpowiada: gdzie jestem? dokąd? co tam jest? jak wyjść?
- **Grouping & mapping:** kontrolka blisko tego, co zmienia; proximity = związek.
- **Konkretne etykiety** nawigacji („Postęp", „Biblioteka") zamiast mglistych („Home").
