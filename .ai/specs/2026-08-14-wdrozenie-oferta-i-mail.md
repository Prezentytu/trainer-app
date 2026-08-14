# `/wdrozenie`: sesja robocza, mail, 390 zł

## TLDR

`/wdrozenie` umawia 30 minut wdrożenia (nie demo): jeden CTA, agenda, chipy okna, Peak-End po zapisie. Mail do trenera w tym samym requeście (Resend). Rok z góry = **390 zł** (dwa miesiące w cenie), karta pod formularzem — nigdy równy wybór 0 vs prepaid i nigdy Stripe przed rozmową jako pierwszy krok. Bez Cal.com i bez nowej encji.

## Problem

CTA landingu obiecuje slot. Strona prosiła o wybór 0 zł vs 490 zł i kończyła się na „oddzwonimy”. Mail szedł tylko do foundera. 490 zł > 39×12 (468 zł), więc prepaid był irracjonalny. Dwie równe karty (Hick) spychały wszystkich na 0 zł.

## Proponowane rozwiązanie

Wzorzec Superhuman 1:1: sesja robocza z agendą i prepem. Linear/Attio: krótki formularz + e-mail, bez widgetu kalendarza. Kwota roku = 390 zł (15–20% / dwa miesiące w cenie). Cal.com dopiero przy >15 zgłoszeniach / miesiąc — i wtedy link w mailu.

Flow: submit → mail do trenera + mail do foundera → ekran „co dalej”. Track `founding` = Stripe 390 zł **po** wypełnieniu tych samych pól, z copy że godzinę ustalamy w mailu.

## Model danych

Bez nowej encji i bez migracji. `FoundingApplyInput` dostaje opcjonalne `PreferredSlot`. Lead nie ląduje w bazie — sekwencja T−24 h jest ręczna (szablony `.ai/gtm/wdrozenie-maile.md`).

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/founding/apply` | `{ name, email, phone?, preferredSlot?, track: "whiteglove" \| "founding" }` | `{ ok, checkoutUrl?, message, emailSent }` — publiczny, rate limit `founding` |

`emailSent` = czy poszedł mail **do trenera** (Resend). Gdy brak klucza: `false`, `message` każe odpisać na `kontakt@repmaxer.pl`. `FoundingAmountGrosze` = 39000. Stripe product: „RepMaxer — rok, do 15 osób (dwa miesiące w cenie)”. Typy w `apps/web/lib/api.ts` lustrzane.

## UI

[`apps/web/app/wdrozenie/page.tsx`](apps/web/app/wdrozenie/page.tsx) — serwer: eyebrow, H1, lead, gwarancja, agenda 01–04, FAQ ×5. Formularz: [`WdrozenieForm.tsx`](apps/web/app/wdrozenie/WdrozenieForm.tsx). Shell: `MarketingShell action="konto"`. Tokeny mono v2, `ux-writing`.

- CTA primary: „Umów 30 minut wdrożenia”.
- Chipy okna: wtorek 18:00 / środa 18:00 / czwartek 10:00 / inna godzina.
- Karta 390 pod formularzem (468 przekreślone). CTA: „Zapłać 390 zł”.
- Sukces: timeline + prep + karta 390 (jeśli nie zapłacono). `?status=ok`: płatność przyjęta, godzinę w mailu.
- Zakaz: founding/white-glove/call w UI, „oddzwonimy” jako jedyny next step, „ta stawka zostaje”, fałszywa pilność, fake social proof.

## Fazy implementacji

- [x] Faza 0 — ten spec
- [x] Faza 1 — strona (agenda, 1 CTA, karta 390, FAQ, Peak-End, chipy)
- [x] Faza 2 — maile + slot + 390 + testy
- [x] Faza 3 — FAQ landingu, GTM, lekcja, bramka

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Resend no-op | `emailSent: false`; copy „odpisz na kontakt@” |
| Kolizja chipów | Preferencja, founder potwierdza |
| 390 vs stary brief 490 | 490 > 468 nie sprzedaje; lock 390 |
| Stripe przed rozmową | Karta wtórna; success wraca na Peak-End |

## Changelog

- 2026-08-14 — utworzono spec: 390, mail do trenera, brak Cal.com/encji.
- 2026-08-14 — wdrożono: `/wdrozenie` (agenda, chipy, karta 390, Peak-End), `preferredSlot` + `emailSent`, maile Resend, FAQ/GTM/lekcja.
