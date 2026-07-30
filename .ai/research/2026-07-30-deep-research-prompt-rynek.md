# Deep Research — prompt: rynek softu dla trenerów personalnych (PL + zagranica)

Gotowy prompt do wklejenia w tryb Deep Research (ChatGPT / Gemini / Perplexity). Zbudowany wg standardów z lipca 2026: persona → decyzja → kontekst → sub-pytania → rygor źródeł → format wyjścia → weryfikacja.

**Jak użyć (ważne, nie pomijać):**

1. Wklej cały prompt poniżej linii, włącz Deep Research.
2. **Zanim research ruszy, przejrzyj i edytuj plan**, który zaproponuje model — dopnij źródła, wytnij zbędne wątki, doprecyzuj geografię.
3. Pierwszy raport traktuj jako draft: sprawdź ręcznie min. 5 cytowań, dopytaj o „cienkie" sekcje.
4. Na koniec zapytaj: „Czego ten raport unika, na co wskazałby krytyk?" — to wyciąga wygładzone słabości.

---

## PROMPT (kopiuj od tego miejsca)

Działaj jako senior analityk rynku SaaS i strateg biznesowy na poziomie due-diligence funduszu VC — sceptyczny, liczbowy, bez marketingowego optymizmu. Twoim odbiorcą jest founder-inżynier podejmujący decyzję biznesową. Raport napisz **po polsku**, ale źródła przeszukuj **po polsku i po angielsku** (rynek globalny wymaga źródeł EN).

### Decyzja, którą ten research ma wesprzeć

Czy i jak komercjalizować istniejącą aplikację dla trenerów personalnych: (a) na którym rynku zacząć (Polska vs zagranica), (b) w którym segmencie są największe i najłatwiejsze do zgarnięcia pieniądze, (c) jaki model cenowy i jaki zestaw funkcji sprawi, że trenerowi będzie „głupio nie zapłacić", (d) jakich przychodów można realistycznie oczekiwać w horyzoncie 12 / 24 / 36 miesięcy.

### Kontekst produktu (stan faktyczny — nie researchuj tego, przyjmij jako dane)

**Produkt:** „Workout Alchemist" — web-first portal trenera personalnego + PWA dla klienta, UI w całości po polsku, ciemny motyw. Solo-founder, koszt infrastruktury bliski zeru.

**Stack:** backend .NET 10 Minimal API + EF Core + SQLite (docelowo Postgres na VPS/Fly.io), frontend Next.js 16 + React 19 + Tailwind 4, klient = PWA (bez app store). Wniosek dla researchu: marginalny koszt jednego klienta ~0, brak prowizji sklepów mobilnych, szybkie iteracje jednoosobowo.

**Co już działa (przewagi):**

- Portal klienta przez **magic-link bez zakładania konta** (token w URL), instalowalna PWA, kolejka offline + autosave (zero utraty danych na siłowni).
- Logger treningu w stylu Gravitus/Hevy: kolumna „poprzednio", checkmarki serii, auto-timer przerw, wykrywanie PR, RIR/RPE.
- Keyboard-first kreator planów (składnia typu „3x8 rir2"), szablony + plany klientów, biblioteka ćwiczeń z wideo.
- Statystyki evidence-based: maxy, %1RM, trend e1RM, sparkline'y, dashboard trenera z kolejką „Wymaga uwagi".

**W roadmapie (zaplanowane, nie zbudowane):** radar churnu klienta (alarm przy ciszy treningowej), auto-raport postępów dla klienta, podmiana ćwiczenia w trakcie sesji („zajęta maszyna"), check-iny między sesjami, komunikacja in-app (MVP), eksport danych (anti lock-in); dalej: auth, deploy, kalendarz/pakiety/płatności (BLIK), faktury KSeF.

**Czego świadomie NIE budujemy:** karzącej gamifikacji (streaki), social feedu, pełnego modułu diety na start, klona all-in-one typu Mindbody.

**Zdiagnozowane pain pointy (nasz wewnętrzny research — zweryfikuj i pogłęb):**

- Trenerzy: ukryte/rosnące opłaty softu (add-ony $20–45/mies., do 5% surcharge na płatnościach u TrueCoach), data lock-in (migracja 8–12 h ręcznego przepisywania), wolne „klikaczowe" programowanie, fragmentacja narzędzi (WhatsApp + Excel + osobna apka płatności), brak wglądu w churn klienta (trener dowiaduje się przy „kończę współpracę"), burnout przy skali >30 klientów.
- Klienci trenerów: nie widzą postępu (okno rezygnacji tydz. 8–16), tarcie logowania (~68% porzuceń logowania przez „za długo/za dużo kroków"), sztywne plany nieadaptujące się do życia, ~20 dni ciszy ≈ +68% ryzyka churnu.

**Znane benchmarki cenowe (punkt startowy, zweryfikuj aktualność):** WodGuru 5 zł/klient z capem 499 zł/mies.; Trainero ~30 USD/mies.; TrueCoach/Trainerize/Everfit — tiery per liczba klientów + płatne add-ony; rynek PL: CoachPro, Fitebo, CoachGuru, Sportpilot, Trainomi.

### Zakres

- **Geografia:** Polska (priorytet, pełna głębia), następnie rynki ekspansji: DACH, UK, USA, Skandynawia — porównawczo (płycej, ale z liczbami).
- **Segmenty:** solo trenerzy personalni (online, hybrydowi, na siłowni), małe studia PT (2–10 trenerów), trenerzy przygotowania siłowego. **Wyklucz:** sieci siłowni enterprise, aplikacje B2C bez trenera (chyba że jako zagrożenie konkurencyjne), soft do zarządzania klubami fitness jako główny temat.
- **Okno czasowe:** źródła publikowane lub aktualizowane po styczniu 2024; dane rynkowe preferuj z ostatnich 12 miesięcy. Przy każdej liczbie podaj datę źródła.

### Sub-pytania badawcze (struktura raportu — jedna sekcja na pytanie)

1. **Wielkość rynku:** Ilu jest aktywnych trenerów personalnych w Polsce (GUS, rejestry, szacunki branżowe — porównaj kilka źródeł) i na rynkach ekspansji? Jaki odsetek prowadzi coaching online/hybrydowy? Jaki odsetek płaci dziś za jakikolwiek soft trenerski?
2. **Konkurencja i pieniądze w niej:** Aktualne cenniki, modele (per klient / flat / % od płatności), szacunkowe przychody, finansowanie i tempo wzrostu głównych graczy globalnych (Trainerize, TrueCoach, Everfit, Hevy Coach, CoachRx i in.) i polskich (WodGuru, CoachPro, Fitebo, Trainero i in.). Kto zarabia najwięcej i na czym dokładnie (subskrypcja vs take-rate od płatności)?
3. **Głos trenerów:** Na co trenerzy realnie narzekają w 2025–2026 (Reddit r/personaltraining, grupy FB PL, G2/Capterra — najniższe oceny i powtarzające się skargi)? Zestaw z naszą listą pain pointów: co potwierdzasz, co obalasz, czego nam brakuje na liście.
4. **Głos trenujących siłowo:** Na co narzekają klienci w treningu siłowym i aplikacjach do logowania (recenzje Hevy, Strong, Gravitus, Boostcamp; wątki o rezygnacji ze współpracy z trenerem)? Które frustracje przekładają się na churn płacącego klienta trenera?
5. **Skłonność do płacenia:** Ile trener wydaje miesięcznie na narzędzia (PL vs Zachód)? Jaki próg cenowy jest „no-brainer" przy przychodzie trenera (podaj typowe przychody trenera PL vs USA/UK/DACH)? Jakie modele cenowe mają najniższy churn w vertical SaaS dla mikroprzedsiębiorców?
6. **TAM / SAM / SOM z jawnym łańcuchem założeń** — policz osobno dla Polski i dla rynków ekspansji, wg schematu (przykład metody, podstaw realne liczby ze źródłami):
   - TAM PL = liczba aktywnych trenerów × 12 × realny ARPU rynkowy;
   - SAM = TAM × % prowadzących coaching z programowaniem siłowym × % skłonnych płacić za soft;
   - SOM (36 mies.) = SAM × osiągalny udział dla bootstrapped solo-foundera (uzasadnij benchmarkiem, np. ile klientów zdobyły WodGuru/CoachPro w pierwszych latach).
   - Przedstaw 3 scenariusze (pesymistyczny / bazowy / optymistyczny) z wrażliwością na 2 kluczowe założenia (adopcja, ARPU). Każde założenie: źródło albo wprost „szacunek własny".
7. **Gdzie są pieniądze naprawdę:** Porównaj potencjał monetyzacji: (a) czysty SaaS za coaching loop, (b) take-rate od płatności klientów trenera (model WodGuru/BLIK), (c) freemium → upsell pakietów/rezerwacji, (d) rynek EN od pierwszego dnia. Który wektor daje najwyższy realny przychód na godzinę pracy foundera?
8. **„Głupio nie zapłacić":** Na podstawie pkt 3–5 wskaż minimalny zestaw funkcji + cenę + komunikat wartości, przy którym decyzja trenera jest oczywista (np. „odzyskujesz X h/tydz. i zatrzymujesz 1 klienta = soft zwraca się Yx"). Policz ten ROI trenera jawnie na liczbach.
9. **Ryzyka i zagrożenia:** AI-coaching apps zjadające trenerów od dołu, darmowe alternatywy (Hevy Coach free tier, arkusze), konsolidacja rynku, bariery regulacyjne PL (KSeF, status agenta rozliczeniowego przy płatnościach przez platformę). Co musiałoby być prawdą, żeby cały ten biznes nie miał sensu?
10. **Rekomendacja go-to-market:** rynek startowy, segment, cena startowa, 3 kanały dystrybucji o najlepszym CAC dla solo-foundera (z benchmarkami CAC jeśli dostępne), kolejność budowy funkcji z roadmapy pod kątem sprzedawalności.

### Rygor źródeł

- **Priorytet:** raporty branżowe (IHSA/IHRSA, Statista, Grand View/Fortune Business Insights — z ostrożnością), dane publiczne (GUS, rejestry), cenniki wprost ze stron konkurentów, G2/Capterra, Crunchbase/PitchBook, oficjalne blogi firmowe z danymi, agregaty Reddit/forów jako głos użytkownika (oznaczaj jako anegdotyczne).
- **Unikaj:** listicle „top 10 apps", treści SEO bez danych pierwotnych, raportów rynkowych sprzed 2024.
- Każda liczba musi mieć źródło z datą; jeśli danych brak — napisz wprost **„nie znaleziono"** zamiast szacować bez oznaczenia.
- Każde istotne twierdzenie oznacz: **[potwierdzone]** (2+ niezależne źródła), **[sporne]** (źródła się różnią — pokaż rozbieżność), **[niepewne]** (1 słabe źródło).

### Format wyjścia

1. **Executive summary** (max 300 słów): werdykt biznesowy + 3 najważniejsze liczby + rekomendacja pierwszego ruchu.
2. Sekcje 1–10 wg sub-pytań; max ~600 słów na sekcję; tabele dla porównań cen, TAM/SAM/SOM i scenariuszy.
3. **Tabela założeń** do wyliczeń: założenie → wartość → źródło/„szacunek własny" → wpływ na wynik.
4. **Sekcja niepewności:** czego nie udało się ustalić i jak to zbadać taniej (np. 10 rozmów z trenerami zamiast raportu za $3000).
5. **Bibliografia:** link + data publikacji + typ źródła (raport / cennik / forum / blog firmowy).

Zanim zaczniesz research, przedstaw plan: listę sub-pytań, planowane typy źródeł per pytanie oraz 3 rzeczy, które mogą unieważnić wnioski — i poczekaj na moją akceptację planu.

## KONIEC PROMPTU

---

## Notatki (poza promptem)

- Prompt celowo każe modelowi **zatrzymać się na planie** — to najtańszy moment na korektę kursu (standard 2026: edytuj plan przed startem).
- Liczby „68% friction" i „20 dni ciszy" pochodzą z blogów branżowych ([pain pointy](../specs/2026-07-30-pain-pointy-i-killer-features.md)) — prompt każe je zweryfikować, nie przyjąć.
- Jeśli tool ma limit długości promptu, sekcje do skrócenia w pierwszej kolejności: „Notatki", potem skróć kontekst produktu do przewag + roadmapy (sub-pytania i rygor źródeł zostawić w całości).
- Po otrzymaniu raportu: sprawdź 5 losowych cytowań, dopytaj o cienkie sekcje, na koniec zadaj pytanie o blind spots.
