# Trzy pomysły i aktywa — walidacja od góry

**Data:** 21 sierpnia 2026 (przepisane rano, wieczór, potem jeszcze raz po debacie czterech soczewek)  
**Po co ten plik:** decyzja, *co sprzedawać w tym tygodniu* i *czego nie kodować*. To nie jest ranking trzech narzędzi. **Bramka / linter / „Standard jaktestowac w CI” jako produkt jest martwa** — jeden pull request Playwright i towar znika.

Poprzednia wersja skakała do abonamentu 399 dolarów plus klinika grupowa 45 minut. To jest środek drabiny. Hormozi: *„the middle is where people die”* — albo drogo dla wąskiej grupy, albo tanio dla wszystkich. Founder słusznie odrzucił klinikę jako *kierunek firmy* (sprzedaż czasu plus cienkie narzędzie). Ta wersja zostawia ten werdykt i zmienia **kolejność**: najpierw drogi, ręczny test jak Tesla Roadster, potem tańszy produkt. Klinika grupowa za 399 dolarów nie jest ani Roadsterem, ani Modelem 3.

Powiązane: [framework Siedmiu Bramek](file:///Users/adamjasinski/Downloads/framework-i-tornada.md), destylacja Hormozi [2026-08-18-100m-leads-hormozi.md](2026-08-18-100m-leads-hormozi.md), ból trenerów [2026-08-18-czego-chca-trenerzy.md](2026-08-18-czego-chca-trenerzy.md).  
Źródło ramy: Alex Hormozi, *If I Started A Business in 2026* (odcinek 977, 6 grudnia 2025).

Repo: [fizjo-app](file:///Users/adamjasinski/Documents/repos/fizjo-app), [fiziyo-admin-portal](file:///Users/adamjasinski/Documents/repos/fiziyo-admin-portal), [fiziyo-tests](file:///Users/adamjasinski/Documents/repos/fiziyo-tests), [trainer-app](file:///Users/adamjasinski/Documents/repos/trainer-app).

Oznaczenia: **Źródło** = liczba albo cytat z linkiem. **Wniosek** = nasza decyzja. **Do potwierdzenia** = nie ruszaj tego jako faktu.

---

## Jak czytać (bez pustych skrótów)

W tym pliku piszemy pełnymi zdaniami. Pięć pojęć, które wracają:

| Mówimy | Znaczy |
|---|---|
| **Roadster** | Drogi, wąski, ręczny test konceptu. Hormozi mówi „Roadster za 250 000 dolarów” — to metafora (Founders Series 2017). Historyczny Roadster z 2008 kosztował ok. 109 000. Sens zostaje: najpierw drogi, niedoskonały egzemplarz dla wąskiej grupy, potem taniej. U nas: ktoś płaci dużo *teraz*, a my dowozimy wynik rękami. |
| **Model S** | Droższy, już trochę powtarzalny produkt *po* tym, jak Roadster się sprzedał. |
| **Model 3** | Tańsza, masowa wersja *bez* kalendarza twórców. To jest destinacja firmy, nie punkt startu. |
| **List intencyjny** | „Wezmę, jak powstanie.” To nie jest sprzedaż. Tesla sprzedawała samochody, nie listy. |
| **Tornado** | Geoffrey Moore: kategoria rośnie 45%+ w sztukach i ma 2–4 lata wzrostu. Cudze tornado (sztuczna inteligencja, cyfrowa opieka mięśniowo-szkieletowa) nie jest naszym, jeśli sprzedajemy inną warstwę. |

Siedem Bramek z frameworku ocenia **destinację** (Model 3). Roadster oceniasz inaczej: czy w tym tygodniu dosięgniesz kogoś, kto ma pieniądze, nazywa ból liczbą i zapłaci z góry za wynik.

---

## 0. Werdykt — co robić w tym tygodniu

1. **Nie pisać kodu** parsera flake, bramki ani paczki dostępności. Soft powstaje dopiero po tym, jak osiem osób *zapłaci* za Roadstera, nie po dwudziestu listach intencyjnych.
2. **Nie zakładać spółki pod FiziYo.** TESTONEO już jest. FiziYo formalnie tam siedzi i nie zarabia.
3. **Dziś albo jutro — 30 minut z wspólnikiem.** Na [testoneo.pl](https://www.testoneo.pl/) wisi „Wkrótce nowość / pracujemy nad czymś dużym”. Jeśli to generator testów albo opakowanie na agentów Microsoftu — nie wchodzimy. Jeśli to puste miejsce albo warstwa *po* kursie — idziemy dalej.
4. **Jeden Roadster, ten który już jest na jaktestowac.pl:** Premium **37 974 zł**. Przestaw obietnicę z „32 godziny nauki” na **System Wydania**: releas wychodzi w terminie, lead recenzuje produkt nie styl, jeden człowiek w *ich* zespole utrzymuje rytuał. Limit: osiem miejsc. Płaci firma. Junior z webinaru nie jest płatnikiem. **Nie sprzedajesz bramki, lintera ani akcji na GitHubie.**
5. **Nie sprzedawaj trenerom przeniesienia arkusza za 2 900 zł.** To mechanizm („Excel w inne miejsce”), nie wynik. Polski trener tego nie weźmie. RepMaxer zostaje poligonem i własnym dziennikiem, nie firmą.
6. **Nie wysyłaj maila „399 dolarów, klinika 45 minut, A albo B”.** Środek drabiny.
7. **FiziYo: zamrożone 90 dni.** Poligon testów, nie biznes gabinetowy.

Zakład firmy (destinacja po zdjęciu kalendarza) wybierasz **dopiero** po tym, który Roadster się sprzedał. Debata z 21.08 wieczór (cztery soczewki, sekcja 0B): **w warstwie Playwright nie ma oprogramowania, które przeżyje jeden pull request Microsoftu.** Destinacja „licencja egzaminu / bramka w CI” jest zabita razem z kliniką 399 dolarów.

- Jeśli osiem zespołów zapłaciło 15–38 tysięcy i powtarza „releas znowu stał, bo nikt u nas nie jest właścicielem rytuału” — zostaje **usługa i retainer**, nie panel. Kwartał z gwarancją daty albo rok utrzymania procesu. To studio, nie SaaS.
- Jeśli powtarzają tylko „dajcie nam linter” — hak zadziałał na cienką rzecz. Microsoft to wyśle. Nie kodujesz.
- Jeśli żaden Roadster nie schodzi — nie ma firmy do kodowania. Zostaje mentoring 370 zł/h. Adam nie wraca do cennika 39 zł jako planu na życie.

**Wniosek:** jeden-na-jeden to test beta, nie destinacja. Na *tej* liście destinacja Modelu 3 (ten sam wynik bez kalendarza, jako produkt) **nie istnieje w 2026**, dopóki szukasz jej w ficzerze Playwright. Albo studio usług przy Testoneo za pisemnym podziałem, albo inny problem, którego Microsoft nie włoży do `npx playwright`.

---

## 0A. Co zrobiłby Hormozi na miejscu Adama (21.08 popołudnie) — *część o bramce w CI jest uchylona*

Poniżej zostaje to, co nadal jest prawdą: RepMaxer nie jest firmą, pieniądze stoją w Testoneo, Adam nie jest twarzą, bez pisemnego podziału to darowizna. **Uchylone tego samego wieczoru (sekcja 0B):** „Standard jaktestowac w CI” jako towar, licencja pakietu reguł, akcja na Marketplace, destinacja „egzamin kanonu”. Founder: *to nie może być coś, co Playwright doda jednym PR*. Cztery soczewki się zgodziły.

Założenie: jesteś fullsteckowcem bez autorytetu QA. Wspólnik ma listę, markę i Premium. Trenerzy w Polsce nie kupią przeniesienia arkusza. Pytanie nie brzmi „jaki SaaS napisać”. Brzmi: **gdzie już stoi linia budżetowa i jak Adam skraca dostawę, żeby z tego zostawał powtarzalny zysk.**

### Dlaczego nie RepMaxer

Hormozi nie sprzedaje mechanizmu. „Przeniesiemy Excel w inne miejsce” — nawet nie mówicie *gdzie* — to dół równania wartości: wysiłek, niepewność, zero wyniku. Polski trener kupuje pakiet 10 treningów za 650–1700 zł. Trzy tysiące za narzędzie, którego nie rozumie, odpada zanim otworzy maila. Amy Hoy: publiczność, która wydaje na sprzęt, nie na software, jest dyskwalifikowana. To nie jest Roadster. To jest Honda, której nikt nie chce.

RepMaxer zostaje: Twoje treningi, poligon Playwright, wzorzec płatności *do skopiowania później*. Nie GTM.

### Gdzie już są pieniądze (Testoneo, nie życzenie)

Na [jaktestowac.pl/playwright](https://jaktestowac.pl/playwright/) wisi dziś:

| Co | Kto płaci | Co dostaje | Limit |
|---|---|---|---|
| Program (zamknięty do III/IV kw. 2026, potem drożej) | Junior albo firma z budżetu szkoleniowego | Lekcje, Discord, certyfikat | Kalendarz edycji |
| Mentoring | Osoba albo firma | Godzina Krzyśka/Przemka | **370 zł/h**, dwa ciała |
| **Premium** | Firma | Program FULL + **wdrożenie frameworka w projekcie** + wsparcie zespołu + **32 godziny** | **37 974 zł brutto** |

Dziura, którą Hormozi zobaczy w trzy minuty: Program stoi. Główna kasa jest zamknięta na kwartały. Zostaje mentoring (godziny) i Premium (wdrożenie). Premium *już jest* Roadsterem — „wdrożenie w projekcie”, nie kurs. Po 32 godzinach zostaje wiedza w głowach. Copilot i juniorzy ją rozjeżdżają w następnym sprincie. Firma nie ma za co odnowić faktury, bo nie ma artefaktu.

Lekcja Gym Launch: **oddać sekrety (Program), sprzedać wdrożenie systemu**. Testoneo sprzedało sekrety. Nie sprzedało *systemu operacyjnego zespołu* (rytuał, właściciel, decyzja kwarantanny, gwarancja daty). Dlatego po 32 godzinach nie ma drugiej faktury. **System ≠ bramka w CI.** Bramkę Microsoft może dodać w piątek. Rytuału, właściciela i zwrotu 38 tysięcy — nie.

### Kim Adam jest w tej układance

Nie twarzą. Nie mentorem. Nie „trzecim jaktestowac”.

Jesteś człowiekiem, który **zostawia plik, którego Krzysiek nie napisze w niedzielę**: akcja na GitHubie, reguły kanonu, raport „te testy zjadły X złotych”, mapa fail → lekcja za paywallem. Wspólnik sprzedaje i wchodzi na ich repo. Ty budujesz to, co zostaje po nim.

Bez pisemnej umowy to darowizna. Hormozi nie buduje cudzej firmy za darmo. Zanim linijka kodu:

- nowy towar (licencja / artefakt Premium) ma **osobny podział** — nie „pomogę, potem się zobaczy”;
- albo Ty trzymasz repo narzędzia, Testoneo jest dystrybutorem i marką;
- albo udział w przychodzie z każdego Premium, które jedzie na tym artefakcie, i z odnowień licencji.

FiziYo już siedzi w KRS Testoneo. Drugiego „zrobimy na gębę” nie powtarzasz.

### Narzędzie „Standard w CI” — uchylone tego samego wieczoru

Popołudniowa wersja kazała budować bramkę, kwarantannę plikiem i licencję pakietu reguł. Founder zabił to zdaniem: Playwright doda to jednym pull requestem. Sekcja 0B. Zip i kwota CI zostają jako **wewnętrzny młotek wdrożenia**, nie jako towar na fakturze.

### Czego nie budować razem

- Generator / healer — Microsoft oddał to w Playwright. Octomind nie znalazł rynku.
- Kolejny dashboard flake — Main Street, dno ceny.
- Wrapper na Agents — wojna z kursem i z „czymś dużym” na testoneo.pl.
- Bramka, linter, akcja na Marketplace, „egzamin kanonu jako produkt”.
- Cokolwiek z logo FiziYo albo RepMaxer na fakturze Testoneo.

### Rozmowa z wspólnikiem — inna niż „A albo B”

Nie pytasz „czy robimy tool”. Pytasz:

1. Czy „Wkrótce nowość” to generator albo linter? Jeśli tak — wychodzisz. Nie kodujesz.
2. Ile Premium sprzedaliście w 12 miesiącach i co klient mówił *po* 32 godzinach?
3. Czy wolno w 14 dni przestawić kolejne Premium z „godzin” na System Wydania (właściciel rytuału, gwarancja daty, zwrot jeśli merge stoi)?
4. Jaki podział od *tej* faktury i od retainera, zanim Adam otworzy jakiekolwiek repo — plus gwarantowany draw, inaczej to darowizna.

Hak, który wspólnik może wysłać *ręcznie* jutro, bez kodu Adama:

> Program stoi do jesieni. Wasze testy nie. W 30 minut mówimy, ile z nich przeżyje następny deploy. W 14 dniach: releas nie stoi na tych samych trzech testach, jeden człowiek u Was powtarza rytuał. Osiem miejsc. 37 974 zł. Płaci firma. Jeśli merge nadal stoi — zwrot albo pracujemy, aż nie stoi.

Jeśli na to nie ma odpowiedzi — nie ma firmy do budowania. Jest mentoring.

---

## 0B. Debata czterech soczewek (21.08, późny wieczór)

Founder: *nie może to być coś, co Playwright doda jednym PR i nam zniknie produkt*. Odpowiedź nie jest „inny linter”. Odpowiedź jest: **w warstwie Playwright nie ma produktu-narzędzia**. Cztery niezależne soczewki — oferta, kasa, fosa Cohena, tornada Moore’a — zeszły się w jednym zdaniu.

### Co jest naprawdę mocne (nie iluzja fullstack)

Liczy się tylko to, czego nie kupisz w weekend **i** czego Microsoft nie zmerguje w dwanaście miesięcy.

| Aktyw | Test Cohena | Czy to Twoje |
|---|---|---|
| Lista ludzi, którzy już zapłacili za *ten* kanon (1000+ Program, 4000+ kurs) | Nie skopiujesz zaufania w weekend. Możesz teoretycznie kupić reklamę — nie kupisz sześciu lat. | Wspólnika |
| Dwaj Microsoft MVP, głos, mentoring 370 zł/h | Microsoft nie kupi Krzyśka. Mergują każdy artefakt, który da się opisać w pull requestcie. | Wspólnika |
| Premium 37 974 zł już na stronie | Cena i linia budżetowa istnieją. Nie wymyślasz 399 dolarów. | Wspólnika |
| Wejście na *ich* repo + gwarancja w złotówkach | Support Playwright tego nie zrobi. | Sprzedaż wspólnika, dowóz wspólnika |
| Adam składa powtarzalność (checklista, raport, poligon `fiziyo-tests`) | Weekend skopiuje checklistę. Nie skopiuje tego, że już siedzisz w żywym SaaS. To przyspiesza dostawę, nie jest fosą. | Twoje — tylko z pisemnym podziałem |

Nie liczy się: „umiemy fullstack”, parser JSON, linter `waitForTimeout`, design system, biblioteka ćwiczeń, trzy marki na jednym landingu, 23 organizacje FiziYo, cennik 39 zł.

**Cohen:** kiedy jedyna rzecz, której nie da się skopiować, należy do wspólnika, kodowanie „instalatora” bez udziału to praca na cudzy moat.

### Tornada 21.08 — które idą *przez* listę, które *obok*, które zjada platforma

Moore: tornado = 45%+ w sztukach przez 2–4 lata. Hormozi: cudze tornado nie jest twoim, jeśli inny kupujący albo inna warstwa.

| Kategoria | Klasa | Przez naszą listę? | Platforma zje? |
|---|---|---|---|
| Agenci piszący kod (Cursor ~2 mld run-rate, Copilot 4,7 mln +75%) | Tornado platformy | Używasz. Nie budujesz Cursora. | Już ich |
| Weryfikacja kodu po agentach (CodeRabbit 143 mln / 1,5 mld, Qodo 70 mln) | Wczesne tornado | Przez fullstack — **nie** przez wąski linter Playwright. Ten ginie między healerem a Qodo. | Tak, recenzja testów w pakiecie |
| Generator / healer E2E jako produkt | Umarł (Octomind) | Przeciw | Playwright Agents od v1.56 |
| Dashboard flake | Main Street | Cienkie | Currents 49 USD, Trunk, GitHub ma minuty |
| QA Wolf / „piszemy testy za Was” | Main Street (+15–22% kategoria; jedna firma 520% / 3 lata) | **Obok.** Mediana ~90 tys. USD/rok. Lista płaci szkolenie / 38 tys. **zł**. | Generator zjada *pisanie*. Zostaje SLA ludzi — to usługa, nie SaaS |
| Hiring / staffing QA PL | Rebound, nie tornado (Just Join +8% ogłoszeń 2025; juniorzy 4,79%) | **Przez** — ale mid+, nie junior z webinaru | Fee nie. Powód zatrudnienia juniora-automatyka — tak |
| KFS 2026 (priorytet AI / kompetencje cyfrowe) | Kran, nie kategoria | **Przez** — już Wasz towar. Limit ~17,8 tys. zł/os. (200% × 8 903,56). Premium 38 tys. to faktura *zespołowa / wdrożeniowa*, nie „szkolenie jednej osoby” | LMS Microsoft zje. Wniosku do PUP i faktury NIP — nie |
| Governance agentów (software) | ~40% CAGR, blisko tornado | Obok | GitLab / Azure / Purview |
| Governance *ludzi* (kto merdżuje po Copilocie) | Impuls, osłabiony Digital Omnibusem VII 2026 | Częściowo — jako warsztat, znowu szkolenie | Ogólne AI — Learn / Copilot |
| Alumni → praca (Springboard / Lambda) | Po szczycie, ISA spalone | Teoretycznie. Juniorzy nie mają popytu. | Just Join już ma tablicę |
| HEP / trenerzy / a11y / GEO | Main Street albo obok | Nie firma Adama | — |

**Jedno zdanie Moore’a:** takiej kategorii oprogramowania, w której lista + dwaj MVP + Adam-budowniczy wygrywają z platformą, **nie ma**. Zostaje usługa.

### Co cztery głosy powiedziały (skrót, nie transkrypt)

**Oferta (Hormozi / równanie wartości).** Firma nie kupuje reguły. Kupuje datę wydania, która się zgadza. Test: Playwright jutro dodaje oficjalny linter, zakaz `waitForTimeout` i kwarantannę plikiem. Nadal sprzedajecie wdrożenie *Systemu Wydania* za 37 974 zł — człowiek na ich repo, decyzje których plik nie podejmie, właściciel w ich zespole, zwrot jeśli merge stoi. Jeśli po zdjęciu lintera kartka pusta — pomysł martwy. Kartka nie jest pusta, o ile na fakturze nie ma słowa „linter”.

Trzy oferty, które przeżywają jeden pull request:

1. **Wdrożenie Systemu Wydania** — dzisiejsze Premium, 37 974 zł, osiem miejsc, 14 dni, jeden właściciel u nich, gwarancja merge.
2. **Kwartał z gwarancją daty** — 113 922 zł (trzykrotność), trzy miejsca. Rama „dziesięć razy” (379 740 zł) zostaje w rozmowie, nie na pierwszej fakturze.
3. **Rok utrzymania procesu** — 12–18 tys. zł, rok z góry, tylko po jedynce. Recertyfikacja ludzi i rytuału, nie pliku. Jeśli klient mówi „to mam oficjalny linter” — nie sprzedajesz trójki.

**Kasa (Hormozi / ciepła lista).** Program stoi. Najpierw dźwignia „każdy istniejący klient wart więcej”, nie nowa zimna lista. W tym tygodniu pisze **Krzysiek albo Przemek**, nie Adam. Kolejność: firmy bez dziesięciu żywych testów → firmy po Premium którym zgniło → alumni-leadowie w firmach. Hak za 0 zł: trzydziestominutowy przegląd (ile przeżyje następny deploy), nie darmowe testy. Alumni: 10% za przedstawienie, 20% jeśli zamykają — od wpływu, nie od podpisu. Nie 50%: dowóz to 40–80 godzin.

Arytmetyka *usługi*, nie SaaS. Przy 20 firmowych kontaktach: ~2 faktury w 90 dniach = **50–70 tys. zł**. Przy 8 kontaktach: jeden deal albo ochłapy 370 zł/h. Osiemnaście miesięcy: 3–5 retainerów × 8 h × 370 zł plus kilka wdrożeń ≈ **~330 tys. zł** u góry. Piętnaście retainerów (44 tys. zł/mc) wymaga 120 godzin Krzyśka i Przemka — dwie osoby na pełnym etacie. To studio. Popołudniowa tabela „15 firm × 12 tys. licencji lintera = 180 tys./rok” jest **fantazją na martwym towarze**.

**Fosa (Cohen).** Pięć zwłok: linter kanonu (`eslint-plugin-playwright` już jest; oficjalny zestaw to zaległy ticket), parser + `quarantine.yml`, generator, dashboard vs Currents, akcja na Marketplace (landlord = konkurent). QA Wolf nie ocala *u Was*: nie macie fabryki 24/7, konflikt z Programem. Placement alumnów to inna spółka, inny skill, Adam zbędny.

**Tornada (Moore).** Żadne z dociągniętych wieczorem nie jest tornadem 45%+, które idzie przez listę *i* omija platformę. QA Wolf ma inny czek. KFS zasila Program, nie nowy SaaS. Governance-software jest cudze.

### Kim Adam jest po tej debacie

Nie founderem narzędzia. Nie trzecim jaktestowac. Nie rekruterem.

Jesteś człowiekiem, który **skraca dostawę Systemu Wydania**, jeśli jest pisemny układ. Cohen i kasa mówią to samo:

- faktura 100% na spółkę, nie na konto twarzy;
- Adam: gwarantowany draw (soczewka kasy: 15 000 zł/mc przy jednym aktywnym wdrożeniu albo dwóch retainerach) **albo** procent od *tej* faktury Premium i retainera — nie „potem się zobaczy”;
- premia 15% za zamknięcie i 15% za dowóz dla tego, kto to zrobił (twarz albo alumni, nie obok siebie);
- zysk po kosztach według udziałów;
- **klauzula antydarowiznowa:** 60 dni bez wpływu → Adam przestaje pracować.

33/33/33 od przychodu premiuje niewłaściwą pracę. Udziały w FiziYo nie są pensją.

### Werdykt, który zamyka wieczór

**Nie kodujesz produktu.** Nie ma produktu, który przeżyje `npx playwright` w 2027, jeśli ten produkt *jest* ficzerem Playwright.

**Sprzedajecie (wspólnik) System Wydania za 37 974 zł** na ciepłą listę, w tym tygodniu, hak = przegląd, limit osiem.

**Adam nie otwiera repo narzędzia** bez podpisanego drawu / procentu. Checklista i raport na poligonie — po umowie, jako przyspieszenie *usługi*, nie jako SaaS.

**Destinacja Modelu 3 na tej liście w 2026 nie istnieje.** Albo studio przy cudzej marce za twardym układem, albo szukasz bólu *poza* warstwą, którą Microsoft odda za darmo. RepMaxer i FiziYo zostają poligonem. Nie wracasz do 39 zł i nie wracasz do lintera.

---

## 1. Metoda: Zacznij od góry, schodź w dół

Hormozi, odcinek 977 (6 grudnia 2025), własnymi słowami:

> Tesla started with a $250,000 Roadster, clearly selling to a select few, and it was like a beta test car. (…) From the few that they were able to make, they were able to get enough money or enough proof of concept to then eventually get to making the S, (…) then the Model 3. (…) Start high and then you can work your way down. (…) One of the simplest ways to create an expensive offer is to sell your time one-on-one, even if it's unscalable.

### 1.1 Dlaczego drogie jeden-na-jeden na starcie

| Powód (Hormozi) | Co to u nas znaczy |
|---|---|
| Natychmiastowa gotówka | Faktura w tym tygodniu finansuje życie i kolejne testy. Nie czekasz na „20 listów, potem kod, potem Stripe”. |
| Uczysz się na małej liczbie | Osiem klientów. Zmiana oferty w środku tygodnia, bez przerabiania systemu i bez szkolenia ludzi. |
| Zero bariery technicznej | Nie kodujesz ostatecznego rozwiązania. Wynik dowozisz rękami: raport, plik, rozmowa. |
| Wymuszasz cenę | Podaż = kilka miejsc. Przy wąskim limicie albo podnosisz cenę, albo nie sprzedajesz. |
| Marża 100% na czasie | Pieniądze idą do Ciebie, nie do chmury flake. |
| Kotwica marki | Nawet jeśli nikt nie weźmie 38 tysięcy, sama liczba podnosi wartość tańszej wersji. Musisz **powiedzieć cenę i zamilknąć** — kotwica nie działa, gdy ją przepraszasz. |
| Szansa realizacji | Klient nie kupuje Twoich godzin. Kupuje wynik. Jeden-na-jeden dramatycznie podnosi jego poczucie, że *jemu* się uda — w porównaniu z PDF-em albo panelem za 39 zł. |

Hormozi: weź 5–10% tygodnia, sprzedaj 10× drożej, z tego żyj i idź do przodu resztą pieniędzy. **Limit miejsc jest cechą, nie wadą.**

### 1.2 Jak to się zgadza z „nie chcę firmy na kalendarzu twórców”

Zgadza się, jeśli trzymasz dwa horyzonty osobno:

- **Ten kwartał:** sprzedajesz czas. To Roadster. Tesla też nie umiała jeszcze zrobić Modelu 3.
- **Destinacja:** ten sam *wynik* bez Krzyśka, Przemka i Adama w kalendarzu.

Poprzedni dokument próbował skrócić tę drogę: abonament 399 dolarów *plus* 45 minut twórcy co tydzień. Zostajesz ze sprzedażą czasu *i* z cienkim narzędziem, które Currents (od 49 dolarów) i TestDino (od 39 dolarów) już mają. To nie jest Tesla. To jest najgorsze z obu światów.

### 1.3 Trzy ramy do projektowania wartości

**Rama 1 — cena razy dziesięć / sto.** Wypisujesz wszystko, co zrobiłbyś, gdyby klient dał 10× albo 100×. Skreślasz rzeczy z twardym kosztem (ludzie na etacie, licencje, ubezpieczenie, własny runner). Zostaje to, co możesz dowieźć sam i co broni ceny.

**Rama 2 — poczta pantoflowa.** Jedyny sposób na kolejnego klienta to to, że *ten* zadzwoni do kolegi. Co musi się stać w pierwszym tygodniu, żeby sam to zrobił?

**Rama 3 — warte 10×, ale bez Ciebie.** Ten sam wynik, zero kalendarza. Jeśli po skreśleniu siebie zostaje pusta kartka — nie ma Modelu 3. Nie zaczynaj Roadstera.

### 1.4 Ból tylko w konkretach

> If you can articulate someone's problem better than they can, they will inherently believe that you can solve it. (…) Pain and persuasion only exist in the specific, never the vague.

Hack Hormoziego: recenzje książek i produktów z niszy, cytaty frustracji, nie ogólniki. Sekcja 5.

---

## 2. Co naprawdę mamy

| Byt | Czym jest | Pieniądze | Co z tym |
|---|---|---|---|
| **TESTONEO / jaktestowac.pl** | Spółka wspólnika (Kijas + Barański, KRS 0000810448, Mysłowice). Microsoft MVP 2025. | Kursy. Mentoring **od 370 zł brutto za godzinę** ([strona](https://jaktestowac.pl/mentoring/), potwierdzone 21.08.2026). Premium w materiałach wewnętrznych: **37 974 zł / 32 godziny**. | Jedyna lista ludzi, którzy już zapłacili za kanon Playwright. Faktura i marka Roadstera QA. |
| **FiziYo** | Wasz produkt ćwiczeń domowych dla terapeuty. Operator na [regulaminie](https://fiziyo.pl/terms) = TESTONEO. Własnej spółki nie ma, bo nie ma przychodu. | 0 zł. Pilotaż, makiety faktur. | Zamrozić. Poligon testów, nie biznes gabinetowy. |
| **RepMaxer** (to repo) | Produkt Adama: panel trenera + aplikacja w przeglądarce dla podopiecznego. | Cennik 39 / 99 / 199 zł. | Poligon testów i własny dziennik. Nie firma. Trener w Polsce nie płaci tysięcy za przeniesienie arkusza. |

Nie łączyć trzech logotypów na jednym landingu. Klient widzi jaktestowac / Testoneo. FiziYo i RepMaxer nie pojawiają się na fakturze.

Publiczność jaktestowac jest polska. Nie otworzą rynku angielskiego. Program jest **zamknięty**; kolejne otwarcie planowane na trzeci albo czwarty kwartał 2026, drożej ([playwright](https://jaktestowac.pl/playwright/)). Wtyczki VS Code ~15 tysięcy instalacji, wszystkie darmowe — nie ma płatnego oprogramowania. Teaser „Wkrótce nowość” wisi na [testoneo.pl](https://www.testoneo.pl/) — najpierw rozmowa, potem jakikolwiek mail.

**Do potwierdzenia z wspólnikiem:** dokładna liczba osób w Programie i na liście mailingowej, cena ostatniej edycji EXP/FULL, treść „czegoś dużego”, mapa „objaw flake → lekcja”.

---

## 3. Unikalna wartość — tylko to, czego nie kupisz w weekend

Cohen: *przewaga to to, czego nie da się skopiować i nie da się kupić.*

### Liczy się

1. **Lista ludzi, którzy już zapłacili za kanon Playwright.** Tysiąc plus w Programie, cztery tysiące plus kursantów (liczby ze stron jaktestowac, stan z rana 21.08). Konkurent nie kupi tego zaufania w weekend.
2. **Premium 37 974 zł już istnieje.** To *jest* Roadster QA. Nie trzeba wymyślać abonamentu 399 dolarów, żeby mieć drogi produkt.
3. **Własny produkcyjny SaaS jako poligon.** `fiziyo-tests` (Playwright 1.59, Page Object, bramka środowisk, CI na `portal.fiziyo.pl`) plus jeden scenariusz end-to-end RepMaxera. Możesz pokazać kanon *na żywym produkcie*, nie na GAD.
4. **Adam składa artefakt, którego edukatorzy nie napiszą w niedzielę.** Przy QA kartę autorytetu ma wspólnik. Adam nie jest twarzą. Jest instalatorem.
5. **Głos dwóch Microsoft MVP w polskiej niszy Playwright.** Mentoring od 2017, „Ludzie Testowania 2024”. Personal Authority. Tego nie da się dodać do Cursora.

### Nie liczy się (iluzja „mamy 70% produktu”)

- „Umiemy kodować fullstack.” Ma to każdy deweloper.
- Biblioteka ćwiczeń, kreator planów, silnik adherencji, Health Points.
- Billing FiziYo (pilotaż 0 zł, makiety faktur).
- Design system mono v2 jako towar.
- Parser JSON/JUnit i linter `waitForTimeout` — weekend roboty.
- Trzy marki na jednym homepage.

Macie **poligon i przepisy**. Nie macie produktu operacyjnego. Roadster tego nie potrzebuje.

---

## 4. Tornada — 21 sierpnia 2026

Próg Moore’a: **45%+ wzrostu w sztukach**. Poniżej = Main Street albo odpływ. Cudze tornado nie jest Wasze, jeśli sprzedajecie inną warstwę.

| Kategoria | Werdykt | Liczby | Przez nas / obok | Co z tym |
|---|---|---|---|---|
| **Cyfrowa opieka mięśniowo-szkieletowa sprzedawana pracodawcom** | Tornado | Hinge Health: przychód Q2 2026 **212,8 mln USD, +53% r/r**; guidance roku **856–860 mln, +46%**. [Finviz / 10-Q](https://finviz.com/news/377075/hinge-health-reports-record-second-quarter-2026-financial-results-signs-definitive-agreement-to-acquire-cylinder-health) | **Obok.** Oni sprzedają pracodawcy i ubezpieczycielowi, nie terapeucie z biblioteką ćwiczeń. | Nie budować „polskiego Hinge”. Nie ruszać FiziYo jako firmy. |
| **Biblioteki ćwiczeń domowych** | Środkowe Main Street / odpływ | Physitrack FY2025: **13,5 mln €**, +3% pro forma. Q2 2026: **3,4 mln €, +8%**; Lifecare ARR **12,7 mln €** (+7% r/r), ARPL 189 €/rok, churn ~1%. Physiotools: **2,1 mln € i −6,4%**. | Przez FiziYo — i to zła wiadomość. | Freeze. 23 org testowe ≠ rynek. |
| **Oprogramowanie dla trenerów** | Środkowe Main Street | Rynek software PT: **1,86 → 1,93 mld USD** (2025→2026), CAGR **3,5%** ([Straits](https://www.straitsresearch.com/report/personal-training-software-market)). Trainerize / TrueCoach: po 50 000+ coachy. TrueCoach: 5% od płatności od 7.01.2026. | Przez RepMaxer. | Nie firma. Polski trener nie kupi przeniesienia arkusza. |
| **Agenci piszący kod i testy** | Tornado platformy; generator jako *produkt* umarł | Cursor: run-rate **2 mld USD** ([TechCrunch, 2.03.2026](https://techcrunch.com/2026/03/02/cursor-has-reportedly-surpassed-2b-in-annualized-revenue/)). GitHub Copilot: **4,7 mln** płatnych, **+75% r/r** (Microsoft FY26 Q2). Playwright Agents (healer) od v1.56. Octomind zamknięty V–VI 2026. | Kodowanie — **przez** (używasz). Budowa Cursora — za późno. Generator testów — **przeciw** (Microsoft oddał healer za darmo). | Nie budować generatora ani healera. |
| **Weryfikacja kodu po agentach** (review / gate, nie linter testów) | **Wczesne tornado — jedyne w Waszym zasięgu** | CodeRabbit: runda C **143 mln USD**, wycena **1,5 mld** (12.08.2026), przychód **>5× r/r**, **>2 mln** recenzji/tydzień, **>17 tys.** klientów. [Yahoo](https://finance.yahoo.com/technology/ai/articles/coderabbit-raises-143-million-1-130000002.html). Qodo: seria B **70 mln USD** (30.03.2026). [TechCrunch](https://techcrunch.com/2026/03/30/qodo-bets-on-code-verification-as-ai-coding-scales-raises-70m/). Copilot Code Review na płatny billing od 1.06.2026. | **Przez** fullstack + listę jaktestowac. Wąski „linter tylko testów Playwright” ginie między healerem a Qodo. | Nie budować czwartego CodeRabita. Roadster = egzamin *kanonu jaktestowac* na ich repo (to, czego Qodo nie ma). Kill = oficjalny linter Microsoftu. |
| **Dashboardy flake** | Środkowe Main Street | Currents od 49 USD, TestDino od 39 USD, Trunk na wejściu 0 zł, BuildPulse 99–499 USD. Brak publicznych 45%+ w sztukach. | Przez pomysł „Ops jako SaaS”. | Nie wygrasz tabelą. Wygrywasz człowiekiem na *ich* repo — Roadster, nie dashboard. |
| **Widoczność w wyszukiwaniu AI (GEO)** | Konsolidacja, nie szczelina | Adobe zamknął zakup Semrush **28.04.2026, ~1,9 mld USD**. Adobe Brand Visibility (VI 2026) + 300 mln promptów. | Obok. Nie macie listy agencji. | Nie budować. |
| **Dostępność cyfrowa / europejski akt** | Nie tornado | AudioEye Q2 2026: przychód **10,7 mln USD, +9% r/r**; przychód powtarzalny w skali roku **42,3 mln, +11%**; ~129 tys. klientów. [SEC 10-Q](https://www.opencapital.sh/filings/0001104659-26-096032). Próg tornada to 45%. | Obok. | Paczka dowodów dostępności nie jest pierwszym produktem. Nakładki (overlay) są prawnie toksyczne (ugoda FTC z accessiBe, 1 mln USD). |
| **Tanie produkty „AI w środku”** | Fala odejść | ChartMogul, ~3 500 firm: produkty AI-native **poniżej 50 USD/mc** trzymają **23%** przychodu rocznie; **250+ USD/mc** — 70%, jak zwykłe B2B. [Raport](https://chartmogul.com/reports/saas-retention-the-ai-churn-wave/) | Przez każdy pomysł „tani wrapper na model”. | Podłoga cenowa destinacji: **powyżej 250 USD/mc**, rok z góry. 39 zł / 99 zł to pasmo śmierci, jeśli w środku jest „AI”. |

**Wniosek:** jedyne tornado, które możecie złapać *bez* budowy Cursora, to **zaufanie do outputu agentów** — recenzja, bramka, egzamin. CodeRabbit i Qodo biorą pieniądze za „ten PR nie jest śmieciem”. Wy nie konkurowujecie z nimi o cały kod. Konkurujecie o **testy Playwright pisane kanonem, za który tysiąc osób już zapłaciło**. Generator testów i dashboard flake w tym tornadzie nie jadą — pierwszy zjadł Microsoft, drugi siedzi na Main Street.

Hinge Health i ElevenLabs (350 → 500 mln USD ARR w cztery miesiące 2026) to tornada **obok**. Tesla nie wymagała tornada, żeby sprzedać pierwszy Roadster. Tornado mówi tylko, którą *destinację* warto mieć po zdjęciu kalendarza: egzamin kanonu, nie parser JSON.

---

## 5. Ból w cytatach — nie w ogólnikach

### 5.1 Testerzy / flake / koszt CI

Konkret (liczba, czas, pieniądze) — pierwsza osoba, nie ogólnik bloga:

- Maintainer Playwright, Pavel Feldman: *„You should never use the waitForTimeout in a test, if you do, your test will fail due to flakiness all the time.”* [GitHub #33012](https://github.com/microsoft/playwright/issues/33012)
- Tester, ten sam wątek: *„I haven’t found a reliable way to implement an explicit wait… I am using `await page.waitForTimeout(3000)`… it doesn’t seem to resolve the issue.”*
- Inny tester: *„without waitForTimeout, it loads incorrect table row.”* [GitHub #22408](https://github.com/microsoft/playwright/issues/22408)
- CooperVision (anton.qa): suite z **68% pass rate**, ponowne odpalenie pipeline’u **codziennie**. [anton.qa](https://www.anton.qa/blog/posts/how-to-fix-flaky-tests-in-playwright-10-battle-tested-strategies)
- Trunk, beta-user: *„oh, this has flaked on 15 different PRs today. This is actually impacting the organization…”* [Trunk](https://trunk.io/blog/trunk-flaky-tests-is-out-of-beta)
- Steve Kinney, testy pisane przez agenta: *„It fails about one time in fifteen on my machine, and more often on CI under load—classic ‘flaky test that blocks releases every few days’ territory.”*
- Alphabin: *„The engineer spends 2 hours checking the auth code before realizing it’s a timing issue.”*
- Franklin (CTO, case TestDino): odeszli z Currents, bo *„felt expensive and still lacked the visibility”*; szacunek **10–20% czasu** i **30–40% kosztów** vs poprzedni reporting.
- CostOps: sześć ręcznych odpaleń × 20 min × 75 USD/h ≈ **3 300 USD/mc** czasu ludzi. Rachunek Actions to podatek. [CostOps](https://costops.dev/guides/flaky-tests-cost-real-money)
- Stawka Linux 2-core, GitHub Actions: **0,006 USD/min** (2026).

Kent C. Dodds (*Testing JavaScript*): testowanie to „click click clicking… feels like a waste of time”; po refaktorze *„why are we testing again?”*. Recenzje *Continuous Delivery* na Goodreads narzekają na 400 stron historii SVN, nie na flake — **ból żyje na GitHubie i w CI, nie w recenzjach książek.** Reddit `r/QualityAssurance` tego dnia nie oddał indeksowanych wątków.

Ogólnik (nie sprzedaje): „jakość jest ważna”, „AI pisze złe testy” (to opis blogów, nie cytat kupującego).

**Definicja problemu:**  
Nie masz problemu z Playwrightem. Masz suite, która **kłamie w CI**: zielona lokalnie, czerwona na runnerze. Zespół płaci podwójnie — za minuty GitHuba *i* za dwie godziny seniora, który debuguje auth, bo ktoś (albo Copilot) wstawił `waitForTimeout(3000)`. Potem kupujecie Currents albo Trunk, bo nie wiecie, który z piętnastu czerwonych pull requestów to prawdziwy bug.

**Werdykt bólu:** *włosy w ogniu* u zespołów, które już kupiły reporting. Rynek nie kupił „AI napisze testy” (Octomind). Kupił widoczność flake i tańszy CI. Junior z kursu = twardy fakt, nie płatnik.

### 5.2 Trenerzy / retencja / niedziela

Konkret:

- Średnia retencja klienta trenera w branży: **3–5 miesięcy**. Jeden case z danymi Stripe: 25 miesięcy vs 4 miesiące = **4,5× lifetime** przy 150 USD za sesję, 2× w tygodniu (4 800 vs 21 756 USD). [Trainer Blueprint](https://trainerblueprint.com/blog/client-retention)
- 60% klientów, którzy *osiągnęli cel*, i tak odeszło — bo nie było planu „co dalej” (PTDC, przytaczane przez [FitEcho](https://fitecho.ai/blog/client-retention-strategies-personal-trainers)).
- Sygnały odejścia (krótsze odpowiedzi, brak logów, cisza) widać **4–8 tygodni przed rezygnacją**. [Athleex](https://athleex.com/en/blog/personal-training-client-retention)
- Arkusz działa do ~5 osób, sypie się przy 15+ ([Gymkee](https://gymkee.com/pl/blog/track-client-workouts-personal-training/), research 18.08).
- Coach, 5–30 klientów: *„it’s Sunday night, you’ve got eleven Google Sheets open, your Instagram DMs are buried under check-in photos, and you’re copy-pasting last week’s program into a new tab while praying you didn’t mix up two clients’ numbers.”* [DEV](https://dev.to/olubunminelson/how-to-track-online-coaching-clients-without-spreadsheets-and-endless-dms-3c4)
- G2, TrueCoach: *„Clunky… expensive for what you get, glitchy (data often dissaperes).”* Trainerize: *„As an avid user of Excel, I like having a bit more freedom…”* — Excel zostaje obok płatnej apki. [G2](https://www.g2.com/compare/abc-trainerize-vs-truecoach)
- Software Advice, TrueCoach: kopiuję trening A, wkleja się B; check znika po wyjściu z ćwiczenia.
- Operatorzy klubów (TrainerMetrics): *„I’d probably say 70%”* używa kupionego Trainerize — **30% trenerów nie tyka narzędzia, za które klub płaci.** [TrainerMetrics](https://www.trainermetrics.com/blog/why-your-pt-software-isnt-a-crm/)
- FitCentral: *„clients stop logging after the first couple of weeks, and you end up back in DMs, notes apps, and spreadsheets.”*
- Gymkee Trustpilot: *„Messages towards my coach are never transmitted… NOTHING BUT TROUBLE!!!”*
- Research 18.08: *„I don't want an AI builder if I'm still having to open twenty tabs to go over a client's week.”*
- Trainerize: przy 50 osobach ~349 USD/mc; eksport *nie zawiera* historii ani programów ([pomoc](https://coachway.io/articles/trainerize-review/)).

Wykop i recenzje *The Business of Personal Training* tego dnia nie oddały surowych wątków. *Gym Launch Secrets* na Amazon: matematyka „here and there and no consolidation or dashboard view” — ból liczb, nie ficzera.

Ogólnik: „trenerzy chcą aplikację”, „link bez instalowania”, „AI ułoży plan”.

**Definicja problemu:**  
Kupiłeś Trainerize, żeby nie żyć w Excelu. Po 15 osobach i tak masz dwa systemy: apkę, której część trenerów nie tyka, i arkusz do „ile sesji zostało”. Klient przestaje logować w drugim tygodniu. Ty dowiadujesz się w niedzielę, przekopując jedenaście sheetów i DM, gdy na odnowienie jest już za późno.

**Werdykt bólu:** ogień na **kasie** (add-ony, 5% fee). Na retencji — twardy fakt. W Polsce ten ogień **nie broni 3 tys. zł** za mechanizm „przeniesiemy Excel”. Nie jest to Wasz Roadster.

### 5.3 Fizjoterapeuci / ćwiczenia domowe

Konkret z pierwszej osoby (pacjent, nie landing):

- Pizzari i in., wywiady ACL: *„I did no exercises at home. I strictly went to the physio to do them… He had all the equipment.”* (James). *Home exercises: „silly, stupid, … wasting my time.”* (Belinda). [PDF](https://pdfs.semanticscholar.org/7c55/349c036dcfedc175f444090a1bee0ea56a14.pdf)
- Klinicysta, Tufts: *„If you’re given eight to 10 exercises to do at home, the likelihood of them not being performed goes up.”*
- Physitrack cytuje benchmarki: do **70%** nie kończy HEP; WebPT: **35%** pełnej adherencji do planu — to liczby vendora, nie Twoje.
- WebPT, Capterra: **8–10 min** dziennej dokumentacji, **30–45 min** ewaluacji; *„hundreds of dollars each month just to send reminders”*; *„at least one major outage every quarter.”* [Capterra](https://www.capterra.in/software/92920/webpt)
- PT Everywhere: *„we use another program that costs a lot of money which is frustrating”* — płacą **dwa razy** (EMR + HEP).

Polskich gabinetów z dosłownym cytatem *nie znaleziono* (same materiały vendorów). Recenzji książek o adherence z frustracją — brak.

**Definicja problemu, której *nie* da się sprzedać polskiemu gabinetowi jako painkiller:** pacjent nie „zapomina”. Dostaje kartkę albo osiem filmów, których nie umie zrobić bez sprzętu z gabinetu, więc odkłada je na wizytę. Ty dowiadujesz się na kontroli, kiedy cztery tygodnie już przepadły. W USA pali się **dokumentacja + podwójna składka + billing zdalnego monitoringu**. W Polsce kupujący nie ma liczby do poprawienia i nie ma płatnika.

**Werdykt:** twardy fakt u pacjenta. Freeze FiziYo.

---

## 6. Trzy kandydaty przez Teslę i trzy ramy

Wspólne zasady: płaci **firma**. Junior i gabinet na pilotażu 0 zł odpadają. Pierwszy dowóz < 24 godziny. Limit miejsc. Cena powiedziana wprost, potem cisza. Kandydat C (trener) jest w tej wersji **odrzucony** — zostaje niżej jako zapis, czemu nie.

### 6.1 Kandydat A — odblokowany merge i rachunek CI (Playwright)

**Kupujący Roadstera:** QA Lead / Tech Lead w firmie, która *już* kupiła Program albo trzyma suite ≥200 testów Playwright na GitHub Actions. Flake blokuje merge albo job leci dwa razy.

**Wynik, nie czas:** w 14 dniach top 10 flake po *zmarnowanych minutach* (nie po procentach), kwota CI (minuty × 0,006 USD, z flagą własnej stawki) i plik kwarantanny *w ich repozytorium*. Merge przestaje stać na tych samych trzech testach.

#### Drabina Tesli

| Stopień | Co to jest | Cena | Kiedy |
|---|---|---|---|
| **Roadster** | Krzysiek (albo obaj) na *ich* repo, 14 dni, ręczny triage, plik kwarantanny, jeden call. Premium przestawione z „32 h nauki” na ten wynik. Zero dashboardu. | **15 900–37 974 zł raz** (kotwica = istniejące Premium). Limit 8. | Ten tydzień, po rozmowie z sekcji 8. |
| **Model S** | Playbook 8 objawów → lekcje Programu + powtarzalny raport. Nadal człowiek, ale już nie od zera. | 8–12 tys. zł / kwartał albo 399 USD/mc *po* ośmiu Roadsterach. | Po 8 płatnych. |
| **Model 3** | Klient wrzuca `test-results`, dostaje `REPORT.md` + `quarantine.yml`. Zero calla. | ≥249 USD/mc, rok z góry. | Po 10 płacących na Modelu S *i* po tym, jak Microsoft nie włoży kliniki + kosztu + pliku kwarantanny do `npx playwright`. |

Poprzedni dokument zaczynał od Modelu 3 z kliniki grupowej. Odwrócone.

#### Rama 1 — 10× / 100×

Kotwica: mentoring 370 zł/h albo wymyślony abonament 399 USD (~1 550 zł/mc).

| | Cena | Co dopisujesz (szalone) | Twardy koszt — skreśl | Zostaje |
|---|---|---|---|---|
| 10× | ~3 700 zł/h albo ~15 500 zł/mc | Dyżur na ich merge, para-review każdego flake, Krzysiek w ich CI, gwarancja „merge odblokowany w 14 dni albo zwrot” | Etatowy engineer u klienta, własny runner | Gwarancja wyniku, priorytet w kolejce, plik w *ich* repo, kwota w złotych |
| 100× | ~37 000 zł/h (absurd) albo ~155 000 zł/mc | Zespół rezydentów, 24/7, przepisanie całego suitu | Ludzie, ubezpieczenie, on-call | **Nie robimy 100×.** 10× wystarcza, żeby zobaczyć, że broni *wynik*, nie godzina. |

#### Rama 2 — poczta pantoflowa

W pierwszym tygodniu lead dostaje maila, który może *przekazać szefowi bez wstydu*: „te 10 testów zjadło X minut i Y złotych; oto plik, który na razie wyłącza je z pipeline'u; w środę siedzimy nad Waszym repo.” Jeśli nie przekaże — oferta jest za miękka albo kupujący jest juniorem.

#### Rama 3 — 10× bez kalendarza

Raport + plik kwarantanny + link do lekcji za paywallem. Zero calla. Jeśli po skreśleniu Krzyśka klient mówi „to mam Currents” — nie ma Modelu 3. Zostaje usługa.

**Zabija A:** Microsoft dodaje first-party klinikę + koszt CI + kwarantannę plikiem. Albo osiem osób z listy mówi „zostaję przy HTML reporterze”. Healer lokatorów *sam z siebie* nie zabija — łatka CSS ≠ rachunek.

### 6.2 Kandydat B — bramka kanonu (egzamin z lekcji, zero generacji)

**Kupujący:** Tech Lead, który kupił Program i nie chce, żeby Copilot / Agents sypał `waitForTimeout`, CSS/XPath i test bez fixtures.

**Wynik:** pierwszy pull request nie wejdzie, jeśli *nowe* testy łamią kanon. Stary dług nie blokuje dnia 1 (`gate-baseline.json`). Fail = tytuł lekcji + URL za paywallem. To egzamin, nie podręcznik.

#### Drabina Tesli

| Stopień | Co | Cena | Kiedy |
|---|---|---|---|
| **Roadster** | Wspólnik wpinia bramkę ręcznie na *ich* repo w 48 h. 14 dni: jeśli nie złapie realnych naruszeń — zwrot. | **9 900–19 900 zł raz** | Tylko jeśli A nie schodzi, a mail z listy prosi o „standard jaktestowac w CI”. |
| **Model S / 3** | Akcja na `pull_request`, zero LLM. | Abonament po 8 Roadsterach. | Łatwo umiera: Microsoft wpinie oficjalny linter kanonu albo buyer powie „Agents nam to załatwią”. |

#### Trzy ramy w skrócie

- **10×:** „siedzę z Waszym zespołem tydzień i każdy PR przechodzi przez mnie.” Skreślasz siebie. Zostaje plik reguł. To za mało na 100×.
- **Poczta pantoflowa:** lead pokazuje juniorowi czerwony komentarz z *numerem lekcji, którą junior już kupił*. Wstyd + jasna poprawka. Jeśli wstyd nie działa — zły buyer.
- **Bez kalendarza:** statyczna analiza. Weekend roboty dla kompetentnego dewelopera. Fosa = powiązanie z lekcjami, nie kod.

**Kanibalizacja:** najwyższa z trójki. Mitigacja: fail linkuje paywall, nie tłumaczy lekcji.

**Werdykt:** klin, nie firma. Wolno jako drugi towar na tę samą listę *po* tym, jak A żyje. Nie first product.

### 6.3 Kandydat C — raport tygodnia dla trenera — odrzucony

Founder, 21.08: trener nie zapłaci 3 tys. za przeniesienie arkusza, skoro nie mówimy nawet dokąd. Hormozi: to mechanizm, nie wynik. Rynek oprogramowania dla trenerów rośnie 3,5% rocznie. RepMaxer zostaje poligonem. Nie wrzucać tej marki na listę testerów.

### 6.4 Czego nie ma na liście

| Pomysł | Dlaczego nie |
|---|---|
| Generator testów / wrapper na Playwright Agents | Wojna z kursem i z Microsoftem. Octomind nie znalazł rynku. |
| Kolejny dashboard flake | Currents, TestDino, Trunk, BuildPulse. Wygrywasz tabelą tylko ceną — a cena 399 bez człowieka to środek drabiny. |
| Paczka dostępności jako pierwszy produkt | AudioEye +9% przychodu mimo aktu europejskiego. Nie tornado. Dział prawny chce formalnego VPAT — tego nie wystawiamy. |
| FiziYo / biblioteka ćwiczeń / Jane / Cliniko | 23 org testowe, kategoria bez wzrostu, cena w paśmie 64% odejść rocznie. |
| KSeF, GEO, zadatki BLIK jako firma | KSeF = dodatek za 19 zł u Proassist. GEO połknął Adobe. Zadatki = siłownia sprzedaży, nie spółka. |
| Jedna spółka, trzy logotypy | Klient nie wie, od kogo kupuje. |

---

## 7. Siedem Bramek — tylko na destinację, nie na Roadster

Wagi bez zmian (Ból ×5, Pieniądze ×4, Dystrybucja ×3, Przewaga ×3, Timing ×2, Trwałość ×2, Cały produkt ×1). Zero albo jeden w Bólu, Pieniądzach albo Dystrybucji = odrzut *destinacji*.

Szacunek **Modelu 3** (po zdjęciu kalendarza), nie Roadstera:

| Destinacja | Ból | Pieniądze | Dystrybucja | Przewaga | Timing | Trwałość | Cały produkt | Suma | Werdykt destinacji |
|---|---|---|---|---|---|---|---|---|---|
| Raport CI + plik kwarantanny, bez calla | 4 | 5 | 5 | 4 | 2 | 2 | 4 | **80** | Wolno *po* 8 Roadsterach. Timing słaby (agenci MS). Fosa = lista + kanon, nie parser. |
| Bramka kanonu w CI | 3 | 4 | 5 | 4 | 1 | 1 | 5 | **70** | Klin. Zabija linter Microsoftu. |
| Panel trenera 99 zł/mc | 3 | 2 | 3 | 3 | 1 | 1 | 4 | **51** | Nie. Mechanizm, zły ticket, zły buyer. |
| FiziYo jako SaaS gabinetowy | 2 | 2 | 4 | 3 | 1 | 1 | 4 | **47** | Nie. Liczby z frameworku 21.08. |

**Wniosek:** jedyna destinacja i jedyny Roadster stoją na **liście Testoneo**. Adam nie sprzedaje sam. Buduje instalator. Wspólnik sprzedaje Premium.

### 7.1 Spór o destinację QA — rozstrzyga Roadster, nie mail A/B

Dwa niezależne przeglądy (ten plik + osobny agent oferty) zgadzają się co do startu i rozjeżdżają się co do *gęstości* Modelu 3:

| Po zdjęciu kalendarza zostaje | Gęstość | Zabójca |
|---|---|---|
| Raport flake + plik kwarantanny | Cienkie. Currents sprzedaje dashboard taniej. 14 720 zł/mc za plik Markdown nie obroni nikt. | Microsoft włoży klinikę + koszt + plik do `npx playwright`. Albo klient powie „to mam Currents”. |
| Bramka kanonu w CI (egzamin, link do lekcji) | Gęstsze. Konkurent skopiuje linter w weekend. Nie skopiuje grafu lekcja→reguła i tysiąca ludzi, którzy mówią tym językiem. | Oficjalny linter kanonu od Microsoftu. Healer lokatorów tego *nie* zabija. |

**Dlatego nie wysyłasz maila „A albo B, 399 dolarów”.** Jeden Roadster, jeden człowiek, ich repo, 14 dni. Po ośmiu płatnościach patrzysz, *za co* zapłacili:

- jeśli powtarzają kwotę zmarnowanego CI i „merge znowu chodzi” → destinacja to raport + plik;
- jeśli powtarzają „junior / Copilot nie wcisnął `waitForTimeout`” → destinacja to bramka jako **licencja systemu** (ruch z Gym Launch: oddajesz system, nie robisz za nich w nieskończoność).

To wypełnia dziurę Testoneo: **brak płatnego oprogramowania**, teaser „Wkrótce nowość”, Program zamknięty. Premium 38 tysięcy *już jest* tym Roadsterem — nie wymyślacie ceny, poszerzacie artefakt, który zostaje po 32 godzinach.

Tornado z sekcji 4 ustawia wagę: destinacja, która *jedzie z wiatrem*, to egzamin kanonu (warstwa zaufania po agentach), nie parser flake. Parser zostaje hakiem Roadstera (kwota w 24 h), nie firmą.

Jeśli po zdjęciu Krzyśka zostaje tylko „nadal Krzysiek w środę” — nie było destinacji. Nie kodujesz.

---

## 8. Rozmowa z wspólnikiem — zanim ktokolwiek pisze do listy

**Cel:** 30 minut. Decyzja: czy „coś dużego” zjada warstwę *po* kursie, czy zostawia na nią miejsce.

Nie otwierać Discorda. Nie sprzedawać FiziYo. Nie prosić o kod.

### Agenda

1. **Coming soon (5 min).** „Na testoneo.pl wisi *pracujemy nad czymś dużym*. Czy to narzędzie, kolejny program, czy puste miejsce? Jeśli narzędzie — generator testów czy warstwa po frameworku?”
2. **Roadster, nie abonament (5 min).** Dwa zdania: w 14 dniach top 10 flake i kwota CI, plik kwarantanny w *ich* repo, Ty na ich kodzie. Cena = istniejące Premium albo 15 900 zł, osiem miejsc, faktura Testoneo. **Nie** 399 dolarów. **Nie** klinika grupowa.
3. **Konflikt z kursem (5 min).** „Czy to zjada FULL, czy stania Premium 38 tysięcy? Bramka, jeśli w ogóle, linkuje lekcje, nie tłumaczy.”
4. **Moc (5 min).** Mentoring 370 zł/h zostaje. Kto prowadzi osiem Roadsterów — Krzysiek (CI) czy obaj na zmianę. Jeden-na-jeden, nie grupa. Grupa jest Modelem S.
5. **Lista (5 min).** Czy wolno *jeden* mail do leadów / alumnów Programu, którzy prowadzą zespół — nie do juniorów. Cel: osiem płatności z góry, nie dwadzieścia listów.
6. **FiziYo (5 min).** Freeze 90 dni. Testy end-to-end zostają jako poligon. Zero sprzedaży gabinetom. Potwierdź: produkt martwy w wyniku, KRS zostaje.

### Drzewo

| Odpowiedź | Ruch |
|---|---|
| „Coming soon to warstwa po frameworku / puste” | W 24 h mail z **ceną Roadstera** (sekcja 9). |
| „Budujemy generator / opakowanie na Agents / *nie pisz frameworka*” | **Stop.** Zostać przy mentoringu. |
| „Nie wiemy, daj nam tydzień” | Czekasz 7 dni. Nie kodujesz produktu. Wolno złożyć instalator na własnym poligonie. |
| „FiziYo trzeba sprzedać gabinetom” | Nie. 23 org testowe. Odmowa z liczbami z sekcji 2.5 poprzedniego researchu i z Physitrack +3%. |
| „Zróbmy 399 dolarów i klinikę 45 minut” | Nie. Środek drabiny. Pokaż tę sekcję 1. |

### Zdanie na otwarcie

> Chcę, żeby Testoneo miało drogi, ręczny test *po* Programie, nie zamiast. Osiem miejsc, 15–38 tysięcy, 14 dni, Wasze repo, zero dashboardu. Zanim cokolwiek napiszę — czy „something big” to to, czy coś innego?

---

## 9. Mail na listę — Roadster, nie menu A/B

Segment: leadzi i alumni Programu, **którzy prowadzą zespół**. Nadawca: głos jaktestowac. Faktura: Testoneo. Nie FiziYo, nie RepMaxer.

Nie wysyłać, dopóki sekcja 8 nie jest zamknięta.

**Temat:** `15 900 zł — w 14 dni merge nie stoi na tych samych trzech testach`

```
Cześć,

Jedno zdanie.

W 14 dniach wchodzimy w Wasze repozytorium Playwright.
Dostajecie:
— top 10 testów, które zjadają minuty (fail→pass albo pass-on-retry),
— kwotę, którą ponowne odpalenia zjadają w GitHub Actions
  (minuty × Wasza stawka; start 0,006 USD/min na Linuxie),
— plik kwarantanny w Waszym repozytorium, nie w cudzej chmurze.

Prowadzi to autor Programu, na Waszym kodzie, nie na slajdach.
Osiem miejsc. Płaci firma.

15 900 zł raz (albo istniejące Premium 37 974 zł, jeśli chcecie
też 32 godziny wdrożenia zespołu).
14 dni na zwrot, jeśli merge nadal stoi na tych samych testach.

Odpowiedz jednym wierszem:
TAK — chcę slot, mamy ≥200 testów Playwright, płaci firma
NIE — zostajemy przy Currents / Trunk / HTML reporterze
PÓŹNIEJ — napisz, kiedy

Jeśli TAK: w odpowiedzi dopisz, ile testów macie w CI
i czy flake blokuje merge w tym miesiącu.

Pozdrawiam
```

**Cel:** osiem *płatności*, nie dwadzieścia listów.  
**Hak ręczny po TAK:** „wyślij zip `test-results` z 14 dni — top 10 i rachunek w 24 godziny, zanim powstanie jakiekolwiek narzędzie.”

Jeśli wspólnik nie puści ceny 15 900 — nie schodź do 399 dolarów. Schodź do *istniejącego* Premium. Środek drabiny jest zakazany.

Adam nie prowadzi równoległej sprzedaży do trenerów. Czeka na podział przychodu, potem składa instalator na `fiziyo-tests`.

---

## 10. Warunki zabicia — przykleić nad biurkiem

Wypełnij datę runway *zanim* wyślesz mail.

```
1. Do dnia 21.11.2026 mam 8 zapłaconych Premium / wdrożeń
   standardu po ≥15 900 zł (cel 37 974).
   Listy intencyjne się nie liczą. Trenażer 2 900 zł się nie liczy.

2. Konwersja „TAK, mamy budżet” → przelew poniżej 25%
   → model wartości jest zły, nie marketing. Nie budować panelu.

3. Jeśli więcej niż 10 z 20 odpowiedzi to
   „zostaję przy Currents / Trunk / HTML / arkuszu”
   → ból za płytki. Stop tego kandydata.

4. Jeśli Microsoft wypuści first-party klinikę + koszt CI
   + kwarantannę plikiem w `npx playwright`
   → wychodzę z destinacji QA jako oprogramowania.
   Zostaje usługa jeden-na-jeden, dopóki się sprzedaje.
   Jeśli Microsoft wypuści linter kanonu (getByRole-first,
   zakaz CSS) w CI → zabijam TYLKO bramkę. Roadster A zostaje.
   Healer lokatorów sam z siebie nie zabija A.

5. Po 90 dniach od pierwszego płatnego Roadstera
   więcej niż 1 na 8 prosi o zwrot albo nie poleca nikogo
   → wynik nie jest prawdziwy. Stop.

6. Roadster zjada więcej niż 30% tygodnia wspólnika
   przy mniej niż 8 klientach → za tanio albo za szeroko.
   Limit = 8. Mentoring 370 zł/h osobno.

7. Data, w której kończą się pieniądze przy zerowym
   przychodzie od dziś: [WPISZ RUNWAY ADAMA + TESTONEO].
   Pytanie Cohena, zadawane 21. każdego miesiąca.
```

Dodatkowe kille:

- Poniżej 10 odpowiedzi na mail w 7 dniach → nie budować parsera. Zostać przy ręcznym triage albo odpuścić QA.
- Bramka: więcej niż 30% fałszywych alarmów na 3 repo → to płacz, nie wartość.
- Trzy działy prawne „bez formalnego VPAT nie weźmiemy” → dostępność schodzi do dodatku, nie towaru.
- Hevy / eFitness / inFakt jeden-do-jednego w Polsce → i tak nie wracać do taniego SaaS trenera jako *firmy*.
- Wspólnik buduje generator → nie wchodzić (sekcja 8).
- Brak pisemnego podziału na nowym towarze → Adam nie otwiera repo narzędzia.

---

## 11. Co wolno ruszać, a czego nie (do 21.11.2026)

### FiziYo (w Testoneo, martwy wynik)

**Wolno:** poprawka bezpieczeństwa, Clerk, RODO jak jest, zielone testy w `fiziyo-tests` (to poligon Roadstera QA), opłata Azure/Vercel jeśli < godziny Adama.

**Nie wolno:** nowe funkcje (odtwarzacz, AI, katalog, billing, success fee), sprzedaż gabinetom, kalendarz prezentacji, poprawa landingu „500+”, nowa spółka, Cliniko/Jane, natywna paczka dostępności.

**Nie kasować.** 23 org nic nie dają w P&L, ale trzymasz poligon i IP już w KRS wspólnika.

Dane prod 20.08.2026 (`fizjo-app/.ai/analysis/data-quality-prod.md`): 23 organizacje, 89 userów, 67 sesji, 12 ćwiczeń Published / 921 Organization. Landing obiecuje „500+” — w kodzie tej liczby nie ma. Terms: „aplikacja nie dobiera ćwiczeń”; landing: „AI dobiera”. Nie naprawiać copy w tym kwartale.

### RepMaxer (Adam)

**Wolno:** własne treningi, poprawka bezpieczeństwa, jeden happy-path płatności jako poligon testów (nie jako kampania).

**Nie wolno:** fala tanich kont 39 zł jako firma, KSeF, BLIK, Stripe Connect, wrzucanie marki do Testoneo.

### Holding

Na rynku jedna spółka = Testoneo. Brand Roadstera QA = jaktestowac. FiziYo i RepMaxer niewidoczne na fakturze 15 900 zł. W materiałach wolno: „testujemy na własnym produkcyjnym SaaS” — bez nazwy FiziYo.

---

## 12. Co reuse, a czego nie (gdy *już* jest 8 płatności)

### Brać

| Asset | Do czego | Kiedy |
|---|---|---|
| `fiziyo-tests` (Page Object, lokatory, bramka środowisk) | Demo Roadstera #0, kanon | Dzień 1 jako poligon, nie jako kod produktu |
| `npm run validate` + `check-testid-coverage.mjs` | Zalążek bramki | Dopiero jako klin, po A |
| RepMaxer `BillingService` / Clerk / `globals.css` | Płatności i wygląd Modelu 3 | **Po** 10 płacących. Roadster = link do płatności Stripe, nie panel. |
| RepMaxer PWA + `e2e/critical-path.spec.ts` | Drugi poligon | Hak i laboratorium, nie towar |
| `PlanImport` / `HistoryImport` / kolejka uwagi | Nie do towaru Testoneo | — |

### Nie brać

- Biblioteka ćwiczeń, kreator zestawów, Health Points, ból, ICF, AI-generowanie serii
- Billing FiziYo
- Aplikacja natywna / Expo jako cel Playwright
- White-label ćwiczeń domowych na listę testerów
- Trzy marki na jednej stronie

Repo produktu QA, *jeśli* powstanie: **nowe**, nie trainer-app i nie fizjo-app. Wzorzec billingu skopiować, nie współdzielić bazy.

---

## 13. Kolejność 7 dni

| Dzień | Kto | Co |
|---|---|---|
| 0 | Adam + wspólnik | Sekcja 8. Coming soon. Cena Roadstera powiedziana na głos. |
| 1 | Wspólnik | Mail (sekcja 9), jeśli drzewo = idziemy. |
| 1–7 | Adam | Na poligonie `fiziyo-tests` składasz *instalator* (raport z artifactu + szkielet bramki) — nie produkt. Zero GTM trenerów. |
| 1–7 | Oboje | Freeze (sekcja 11). Warunki zabicia (sekcja 10) nad biurkiem. Wpisz runway. |
| 8 | — | <10 odpowiedzi → nie kod produktu. ≥3 przelewy Premium → dowozisz ręcznie (zip). Instalator schodzi z poligonu, nie z landingu. |

Nie zakładać spółki pod FiziYo. KRS już jest — na kursy i na Roadstera QA.

---

## 14. Definicje, żeby nie dyskutować przy kodzie (dopiero po przelewach)

Flake w pierwszej ręcznej wersji:

```
flake(test) = liczba(fail→pass w 14 dniach) ≥ 2
           ALBO liczba(pass-on-retry w jednym runie) ≥ 2
sortowanie = zmarnowaneMinuty malejąco
zmarnowaneMinuty = czasTrwaniaMin × liczbaZdarzeńFlake
```

Pierwszy poligon: `fiziyo-tests`. Drugi: `apps/web/e2e/critical-path.spec.ts`.

Kwarantanna = plik w repozytorium klienta (`quarantine.yml` + kilka linii w `playwright.config`). Zero własnego runnera. Zero chmury wyników.

---

## 15. Źródła

**Hormozi / Tesla**

- Transkrypt odcinka 977 (6.12.2025): https://rosetta.to/u/alexhormozi/if-i-started-a-business-in-2026-i-d-do-this
- Odcinek 949, ta sama metafora Tesli: https://castro.fm/episode/RDGfZt
- Korekta: Roadster 2008 ≈ 109 tys. USD; 250 tys. = Founders Series 2017 (metafora Hormoziego, nie cena walidacji 2008)

**Tornada i ceny**

- Hinge Health Q2 2026: https://finviz.com/news/377075/hinge-health-reports-record-second-quarter-2026-financial-results-signs-definitive-agreement-to-acquire-cylinder-health
- Physitrack FY2025 / Q2 2026: https://storage.mfn.se/ebc4ef45-6c61-4fe7-8761-2e10957b627a/pdf-press-release-physitrack-plc-unaudited-fy2025-trading-update-and-preliminary-results.pdf
- ChartMogul, fala odejść AI: https://chartmogul.com/reports/saas-retention-the-ai-churn-wave/
- Adobe + Semrush, zamknięcie 28.04.2026: https://www.businesswire.com/news/home/20260428367638/en/Adobe-Completes-Semrush-Acquisition-Strengthening-CX-Enterprise-with-Enhanced-Brand-Visibility-Capabilities
- AudioEye Q2 2026: https://www.opencapital.sh/filings/0001104659-26-096032
- Octomind zamknięty: https://rywalker.com/research/octomind
- Playwright Agents: https://playwright.dev/docs/test-agents
- Currents, CI w skali (VI 2026): https://currents.dev/posts/playwright-ci-at-scale-github-gitlab
- CostOps, koszt flake: https://costops.dev/guides/flaky-tests-cost-real-money
- TestDino vs Currents: https://testdino.com/compare/currents-vs-testdino
- Cursor 2 mld USD: https://techcrunch.com/2026/03/02/cursor-has-reportedly-surpassed-2b-in-annualized-revenue/
- Copilot 4,7 mln / +75%: https://www.fool.com/earnings/call-transcripts/2026/01/28/microsoft-msft-q2-2026-earnings-call-transcript/
- CodeRabbit 143 mln / 1,5 mld: https://finance.yahoo.com/technology/ai/articles/coderabbit-raises-143-million-1-130000002.html
- Qodo 70 mln: https://techcrunch.com/2026/03/30/qodo-bets-on-code-verification-as-ai-coding-scales-raises-70m/
- Straits, PT software CAGR 3,5%: https://www.straitsresearch.com/report/personal-training-software-market
- Feldman, `waitForTimeout`: https://github.com/microsoft/playwright/issues/33012
- Trunk, 15 PR-ów: https://trunk.io/blog/trunk-flaky-tests-is-out-of-beta
- Niedziela, 11 sheetów: https://dev.to/olubunminelson/how-to-track-online-coaching-clients-without-spreadsheets-and-endless-dms-3c4
- Pizzari, HEP w domu: https://pdfs.semanticscholar.org/7c55/349c036dcfedc175f444090a1bee0ea56a14.pdf

**Jaktestowac / Testoneo**

- https://jaktestowac.pl/playwright/ · https://jaktestowac.pl/mentoring/ · https://www.testoneo.pl/

**Trenerzy**

- [2026-08-18-czego-chca-trenerzy.md](2026-08-18-czego-chca-trenerzy.md)
- Retencja 3–5 vs 25 miesięcy: https://trainerblueprint.com/blog/client-retention
- Trainerize export: https://coachway.io/articles/trainerize-review/

**Własne**

- Prod FiziYo: `fizjo-app/.ai/analysis/data-quality-prod.md` (2026-08-20)
- Terms FiziYo: https://fiziyo.pl/terms
- Framework 1F: `~/Downloads/framework-i-tornada.md`

**Debata 0B / wieczór 21.08**

- QA Wolf: Inc. 5000 2026, 520% / 3 lata — https://www.inc.com/profile/qa-wolf ; mediana ~90 tys. USD — https://rywalker.com/research/qa-wolf ; ~27 mln (Latka, 2024) — https://getlatka.com/companies/qa-wolf
- Outsourcing testów +15–22%, nie 45%+: https://www.researchandmarkets.com/reports/6075402/outsourced-software-testing-services-market-report
- Just Join, ogłoszenia 2025 +8,42%, juniorzy 4,79%: https://justjoin.it/raport-wynagrodzen/ogloszenia-o-prace-w-liczbach
- Stawki QA PL 2026: https://remodevs.com/blog/hire-tech-talents/2026-guide-to-qa-automation-salaries-in-poland/
- Playwright w ofertach UK 0,62% → 1,73% (2024–2026): https://testdino.com/blog/playwright-job-market
- KFS 2026: https://www.gov.pl/web/rodzina/kfs-2026 ; przeciętne 8 903,56 zł (M.P. 2026 poz. 192), limit 200% ≈ 17 807 zł/os.
- Digital Omnibus / art. 4 AI Act osłabiony VII 2026: https://lawandtechnology.eu/en/ai-literacy-digital-omnibus-article-4-ai-act/
- `eslint-plugin-playwright` (już jest, nie trzeba budować): https://github.com/mskelton/eslint-plugin-playwright

**Nieustalone:** runway, udział leadów (nie juniorów) na liście, treść „czegoś dużego”, ile Premium w 12 miesiącach, czy 37 974 zł schodzi, ile jest *firmowych* kontaktów z budżetem (próg 15 nazw).

---

## 16. Jedno zdanie na koniec

Tesla nie zaczynała od taniego Modelu 3 z niedokończonym silnikiem. Zaczynała od drogiego Roadstera. Wy macie jeden: Premium 37 974 zł. To jest System Wydania na ich repo, nie linter w CI. Playwright może dodać bramkę w piątek — nie doda właściciela rytuału ani zwrotu 38 tysięcy. Adam nie buduje firmy-narzędzia na cudzej liście. Albo przyspiesza tę usługę za pisanym drawem, albo szuka bólu, którego Microsoft nie włoży do `npx playwright`.
