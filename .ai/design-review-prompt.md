# Prompt: audyt / generowanie UI wg naszej palety (Trainer App)

Samodzielna kopia prompta z `.cursor/skills/design-system/SKILL.md` — do wklejenia w innej sesji Claude/Cursor/Claude Design, gdy nie masz pod ręką repo z zainstalowanymi skillami. Zawiera pełny kontekst palety, więc działa również bez dostępu do kodu (choć z dostępem do repo działa lepiej — agent może sam zweryfikować zgodność).

## Kontekst projektu

Trainer App — portal trenera personalnego (Next.js 16 + React 19 + Tailwind 4, App Router). Jeden, ciemny motyw. Cały UI po polsku. Prymitywy UI w `apps/web/components/ui.tsx` (`PageHeader`, `Card`, `Button`, `Field` + `inputClass`, `ErrorBanner`, `EmptyState`, `Badge`, `Pill`, `IconButton`).

## Nasza paleta (tokeny semantyczne)

Zdefiniowane w `apps/web/app/globals.css` blokiem `@theme`, na bazie wbudowanej skali Tailwind (zinc/yellow/red/emerald). Komponenty odwołują się **wyłącznie** do tokenów poniżej — nigdy do surowych `zinc-*`/`yellow-*`/`red-*`/`emerald-*`.

| Token | Prymityw | Rola |
|---|---|---|
| `background` | zinc-950 | tło strony |
| `surface` | zinc-900 | karty, popovery (często z `/60`) |
| `surface-sunken` | zinc-950 | zagnieżdżone ciemniejsze panele |
| `surface-hover` | zinc-800 | tło inputów, ghost button, hover |
| `surface-active` | zinc-700 | mocniejsze tło/obramowanie, hover-na-hover |
| `border` | zinc-800 | domyślne obramowanie |
| `border-strong` | zinc-700 | obramowanie inputów |
| `foreground` | zinc-100 | główny tekst |
| `foreground-secondary` | zinc-300 | tekst na `surface-hover` (nav, ghost button, badge neutralny) |
| `muted-strong` | zinc-400 | etykiety, podtytuły |
| `muted` | zinc-500 | meta, podpisy, „Ładowanie…” |
| `muted-faint` | zinc-600 | najsłabszy kontrast (ikony pomocnicze) |
| `accent` | yellow-400 | marka / akcja główna / aktywny stan |
| `accent-strong` | yellow-300 | hover akcentu |
| `accent-foreground` | zinc-950 | tekst na żółtym tle |
| `danger` | red-300 | tekst błędu |
| `danger-bg` | red-950 | tło banera/przycisku błędu |
| `danger-border` | red-900 | obramowanie błędu |
| `success` | emerald-300 | tekst sukcesu |
| `success-bg` | emerald-400 | tło badge sukcesu (z `/15`) |

Tailwind generuje klasy automatycznie: `bg-accent`, `text-foreground-secondary`, `border-border-strong`, wraz z modyfikatorem opacity (`bg-accent/15`, `bg-surface/60`).

## Typografia, spacing, hierarchia (skala)

- **Typografia**: `text-xs` 12px (meta/uppercase) → `text-sm` 14px (body/etykiety, domyślny rozmiar UI) → `text-lg` 18px (nagłówek karty) → `text-xl`/`2xl` 20–24px (tytuł strony, jeden na ekran). Maks. 3 wagi: `font-normal`/`font-medium`/`font-semibold` — `font-bold`/`font-black` tylko dla h1 i logo. Zero arbitralnych rozmiarów (`text-[11px]` itd.).
- **Spacing**: siatka 4/8/12/16/24/32px — zero wartości poza nią (`gap-5`, `p-[13px]`).
- **Radius**: `rounded-lg` (interaktywne: przyciski/inputy), `rounded-xl` (kontenery: karty/panele), `rounded-full` (tylko okrągłe: badge/avatar).
- **Hierarchia**: max 3 poziomy na ekran — primary (tytuł/CTA), secondary (nagłówki/kluczowe liczby), tertiary (etykiety/meta).

Pełne uzasadnienie i tabela ról: `.cursor/skills/design-system/SKILL.md`. Prompt skupiony wyłącznie na tej osi (nie na zgodności z tokenami) — `.ai/design-quality-prompt.md`.

## Prompt (wklej i uzupełnij `{{ }}`)

```
Jesteś senior frontend architektem współpracującym z projektantem światowej klasy.
Pracujesz w Trainer App (Next.js 16 + Tailwind 4, ciemny motyw, UI po polsku).

<design_tokens>
Warstwa 1 (prymitywy Tailwind, NIE używać w komponentach): zinc, yellow, red, emerald.
Warstwa 2 (tokeny semantyczne, JEDYNE dozwolone w komponentach):
background, surface, surface-sunken, surface-hover, surface-active,
border, border-strong,
foreground, foreground-secondary, muted-strong, muted, muted-faint,
accent, accent-strong, accent-foreground,
danger, danger-bg, danger-border, success, success-bg.
(Pełny opis ról i mapowanie na prymitywy — patrz tabela wyżej.)
</design_tokens>

<design_scale>
Typografia (maks. 3 wagi: normal/medium/semibold; bold/black tylko h1 i logo):
text-xs 12px (meta/uppercase) → text-sm 14px (body/etykiety) → text-lg 18px (nagłówek karty) → text-xl/2xl 20-24px (tytuł strony).
Zero arbitralnych rozmiarów (text-[11px] itd.) — zawsze najbliższy krok skali Tailwind.
Spacing — siatka 4/8/12/16/24/32px, zero wartości poza siatką (brak gap-5, p-[13px]).
Radius: rounded-lg (interaktywne), rounded-xl (kontenery), rounded-full (okrągłe) — tylko te trzy.
Hierarchia: 3 poziomy (primary = tytuł/CTA, secondary = nagłówki/kluczowe liczby, tertiary = etykiety/meta) — nie twórz czwartego.
</design_scale>

<component_spec>
Zadanie: {{opisz co budujesz albo które pliki audytujesz}}.
Wymagania:
- Zero surowych klas zinc-*/yellow-*/red-*/emerald-* — wyłącznie tokeny z <design_tokens>.
- Trzymaj się <design_scale> — typografia, spacing, radius, hierarchia.
- Mobile-first: bazowe klasy Tailwind = telefon, sm:/md:/lg: dodają gęstość.
- Żadna nazwa kluczowego bytu (plan/ćwiczenie/klient/dzień) nie może być ucięta (truncate) — zawsze break-words.
- Nic nie wychodzi poza kontener: gęste tabele/siatki w overflow-x-auto.
- Reużyj gotowe prymitywy UI (Button, Card, Field, Badge, IconButton, inputClass) — nie duplikuj stylów.
- Cele dotykowe ≥ 40px na mobile, kontrast tekstu ≥ 4,5:1.
</component_spec>

<audit_checklist>
Dla każdego wskazanego pliku sprawdź i zgłoś:
1. Surowe klasy zinc-*/yellow-*/red-*/emerald-* — zamień na token semantyczny z tabeli.
2. Arbitralne rozmiary tekstu/spacingu (text-[Npx], p-[Npx], gap-5, mb-7...) — zamień na krok skali z <design_scale>.
3. Więcej niż 3 wagi fontu na ekranie, albo font-bold/font-black poza h1/logo.
4. Ucinane nazwy kluczowych bytów (truncate/overflow-hidden bez zawijania).
5. Elementy mogące wyjść poza kontener (grid/table bez overflow-x-auto).
6. Duplikowane style przycisków/pól, które powinny użyć wspólnych prymitywów.
7. Cele dotykowe i kontrast poniżej normy.
8. Więcej niż 3 poziomy hierarchii wizualnej na jednym ekranie/karcie.
</audit_checklist>

Zwróć: listę konkretnych zmian (plik + linia + przed/po), bez zmiany zachowania aplikacji.
```

## Skąd to się wzięło

Metodyka oparta na praktykach pracy z Claude Design / Claude Code w systemach projektowych (2026): tokeny w trzech warstwach (prymityw → semantyczny → komponent, tu uproszczone do dwóch warstw bo jeden motyw), strukturyzowany prompt z tagami XML (`<design_tokens>`, `<component_spec>`), rola „Senior UI Engineer / Design Systems” w system prompcie, oraz reguła „druga warstwa wymuszania” — token wpisany do konfiguracji frameworka (tu: `@theme` w `globals.css`) ogranicza dryf nawet gdy instrukcja w rozmowie jest niedokładna.

## Zobacz też

- `.cursor/skills/design-system/SKILL.md` — wersja tego dokumentu jako skill agenta (używana automatycznie w tym repo).
- `.cursor/skills/responsive-ui/SKILL.md` — zasady responsywności.
- `.cursor/skills/fitness-ui-ux/SKILL.md` — domenowe UX kreatora planów i logowania.
