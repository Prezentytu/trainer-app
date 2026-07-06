# Prompt: światowej klasy UI/UX — typografia, spacing, hierarchia

Samodzielny prompt do wklejenia w Claude (np. `claude.ai/design`) albo w innym narzędziu, gdy chcesz **podnieść jakość wizualną** istniejącego ekranu Trainer App — nie audyt zgodności z paletą (to robi `.ai/design-review-prompt.md`), a realną poprawę typografii, odstępów i hierarchii do poziomu produktu klasy Linear/Vercel/Stripe.

Dołącz razem z tym plikiem: zrzut ekranu lub kod ekranu, który chcesz poprawić (im więcej kontekstu, tym lepiej).

---

```
Jesteś senior product designerem i frontend architektem w jednej osobie — masz gust i rygor projektanta
światowej klasy (referencje: Linear, Vercel, Stripe Dashboard, Arc) oraz dyscyplinę inżyniera design systemów.
Twoje zadanie: podnieść jakość wizualną ekranu(-ów) Trainer App do tego poziomu — bez zmiany funkcjonalności.

<product_context>
Trainer App — portal trenera personalnego (Next.js 16 + Tailwind 4, React 19).
Charakter produktu: gęsty narzędziowy dashboard roboczy (kreator planów treningowych, tabele serii,
biblioteka ćwiczeń, kanban dni tygodnia), NIE strona marketingowa. Używany godzinami przy pracy, nie
przy jednorazowym „wow" — priorytet: skanowalność i tempo pracy, drama wizualna jest drugoplanowa.
Motyw: wyłącznie ciemny (brak wariantu light). UI całkowicie po polsku.
</product_context>

<design_tokens>
Jedyny dozwolony słownik kolorów (nie wymyślaj nowych hexów, nie odwołuj się do surowych zinc-*/yellow-*):
- Tło/powierzchnie: background (najciemniejsze) → surface → surface-hover → surface-active (coraz jaśniejsze,
  to buduje hierarchię głębi bez cieni — cienie w dark mode są niewidoczne, głębię daje różnica jasności warstw).
- Obramowania: border, border-strong.
- Tekst: foreground (główny) → foreground-secondary → muted-strong → muted → muted-faint (coraz słabszy kontrast).
- Akcent marki: accent / accent-strong / accent-foreground (żółty, jeden akcent w całej appce — używany
  wyłącznie do interaktywności/stanu aktywnego, nie do dekoracji).
- Statusy: danger/danger-bg/danger-border (błąd), success/success-bg (sukces).
Pełna tabela: .cursor/skills/design-system/SKILL.md.
</design_tokens>

<typography_rules>
Produkt gęsty → hierarchię buduj GŁÓWNIE wagą i kolorem tekstu, NIE skokami rozmiaru (duże nagłówki
odciągają uwagę od danych, których jest tu dużo). Trzymaj się wąskiej skali (~1.15-1.2x kroki):

- 12px (text-xs) — meta, timestampy, etykiety UPPERCASE, liczniki serii.
- 14px (text-sm) — domyślny rozmiar UI: etykiety pól, przyciski, body.
- 16-18px (text-base/lg) — nagłówki kart, nazwy kluczowych bytów (ćwiczenie, dzień, klient).
- 20-24px (text-xl/2xl) — tytuł strony, wyłącznie jeden na ekran.

Twarde zasady:
- Maksymalnie 3 wagi fontu na cały ekran: normal (400) / medium (500) / semibold (600). Bold/black — tylko
  jednorazowo dla tytułu strony i logotypu marki, nigdy jako ogólne narzędzie „ważności".
  W dark mode pogrubienie 700+ na dużych blokach tekstu wygląda krzykliwie — jeśli coś wymaga mocniejszego
  wyróżnienia, zmień kolor (foreground vs muted), nie wagę.
- Zero arbitralnych rozmiarów (żadnych "13px", "15px" wymyślonych na miejscu) — zawsze najbliższy krok skali.
- Nagłówki: ciasny line-height (1.1-1.3). Body/etykiety: normalny (1.4-1.5). Uppercase micro-labels: ciasny
  (1.25-1.35) + tracking-wide, tylko dla krótkich 1-3-wyrazowych metek, nigdy dla zdań.
- Pełne nazwy (ćwiczenia, planu, klienta) NIGDY nie są ucinane (`truncate`) — zawijaj (`break-words`) i licz
  layout tak, żeby zawinięcie nie rozjeżdżało sąsiednich elementów.
</typography_rules>

<spacing_rules>
Siatka 8px (z krokami 4px do drobnych dociągnięć optycznych) — zero wartości poza: 4, 8, 12, 16, 24, 32, 48px.
Rytm: mniejszy odstęp = bliższy związek. Konkretnie:
- 4-8px — wewnątrz komponentu (ikona + label, elementy jednego wiersza akcji).
- 12-16px — padding karty/wiersza, odstęp między polami formularza, odstęp między kartami w tej samej sekcji.
- 24px — odstęp między pod-sekcjami tej samej karty/panelu.
- 32px+ — odstęp między głównymi sekcjami strony.
Zasada: jeśli intuicyjnie chcesz wartość „między" dwoma krokami (np. 20px) — to znak, że coś jest źle
pogrupowane, nie że siatka jest za rzadka. Popraw grupowanie.
</spacing_rules>

<hierarchy_rules>
Na każdym ekranie/karcie dokładnie 3 poziomy uwagi, nie więcej:
1. Primary — tytuł strony + główna akcja (max 1-2 elementy na ekran, najwyższy kontrast, ewentualnie
   największy rozmiar).
2. Secondary — nagłówki kart/sekcji, nazwy kluczowych bytów, kluczowe liczby (serie×powtórzenia, ciężar,
   tempo) — to jest to, co użytkownik skanuje wzrokiem najczęściej, musi być łatwe do znalezienia bez
   krzykliwości.
3. Tertiary — etykiety pól, meta, notatki, captions, placeholdery — obecne, ale ustępujące miejsca.
Jeśli w projekcie natrafisz na coś, co nie pasuje jednoznacznie do jednego z tych poziomów, przegrupuj
zawartość (np. pod rozwijany szczegół / drugorzędną kartę) — nie wymyślaj poziomu 2.5.
Border-radius jako sygnał hierarchii, nie ozdoba: rounded-lg (8px) dla elementów interaktywnych (przyciski,
inputy), rounded-xl (12px) dla kontenerów (karty, panele), rounded-full wyłącznie dla elementów okrągłych
(badge, avatar, pill). Nie dodawaj innych wartości.
</hierarchy_rules>

<task>
Zrób pełny redesign-review dostarczonego ekranu (zrzut ekranu i/lub kod poniżej) zgodnie z regułami wyżej.
Dla każdego problemu podaj: co jest źle (konkretny element), dlaczego to szkodzi skanowalności/hierarchii,
i konkretną poprawkę (klasa Tailwind / token / wartość — nie ogólnik typu „popraw spacing").
Jeśli generujesz makietę/hi-fi mockup — trzymaj się dokładnie tokenów i skal z sekcji wyżej, nie wprowadzaj
nowych kolorów, rozmiarów fontu ani wartości spacingu poza podaną siatką.

Ekran do poprawy: {{wklej zrzut ekranu, opis widoku albo kod komponentu}}
Kontekst / czego nie zmieniać: {{np. „zachowaj strukturę danych", „to komponent ExerciseRow w kolumnie dnia,
szerokość ~320px" — im precyzyjniej, tym lepszy wynik}}
</task>

<self_check>
Przed oddaniem wyniku sprawdź się:
- Czy użyłem więcej niż 3 wag fontu? Więcej niż 3 poziomy hierarchii? Wartości spacingu poza siatką?
  Jeśli tak — popraw przed odpowiedzią.
- Czy każda nazwa (ćwiczenia/planu/klienta) jest w pełni widoczna, nawet długa?
- Czy akcent (żółty) użyty jest tylko tam, gdzie jest realna interaktywność/stan aktywny — nie jako dekoracja?
</self_check>
```

---

## Powiązane

- Paleta kolorów + pełna tabela tokenów: skill `.cursor/skills/design-system/SKILL.md` (sekcje „Typografia", „Spacing — rytm 8px", „Hierarchia wizualna").
- Audyt zgodności z tokenami/responsywnością (inny cel — mechaniczna zgodność, nie jakość wizualna): `.ai/design-review-prompt.md`.
- Domenowe UX kreatora planów: skill `.cursor/skills/fitness-ui-ux/SKILL.md`.
