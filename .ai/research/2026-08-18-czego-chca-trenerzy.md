# Czego chcą trenerzy personalni (2026)

**Po co ten plik:** źródło przy ofercie, landingu i kolejce funkcji. Nie jest playbookiem dnia — ten żyje w [`.ai/gtm/`](../gtm/outreach-playbook.md) i w specu [przegląd tygodnia](../specs/2026-08-18-oferta-przeglad-tygodnia.md).

**Data przeglądu:** 2026-08-18.

---

## TLDR

Trenerzy nie kupują generatora planów ani „kolejnej apki z linkiem”. Kupują czas w niedzielę: kto zrobił zaplanowane treningi, komu spadły ciężary, do kogo napisać w poniedziałek.

Link bez instalowania jest dziś **standardem**, nie wyróżnikiem. Generowanie planów przez AI mają wszyscy i trenerzy temu nie ufają. Wąskie gardło nazywa się **czytanie tygodnia** (konsolidacja), nie pisanie planów (generowanie).

Pieniądze trenera w Polsce: pakiet dziesięciu treningów to 650–1700 zł. Jeden podopieczny, który zostaje dłużej, spłaca każde nasze rozwiązanie.

---

## Źródła

| Źródło | Co z niego |
|---|---|
| [Reddit: What Personal Trainers Want in Coaching Software](https://1fit.com/2026/07/reddit-personal-trainer-coaching-software-problems/) | Wolne kreatory, rozjazd narzędzi, recenzja check-inów zjada tydzień |
| [Reddit Sentiment — „AI workout builders”](https://reddit.sentinel-team.org/posts/1vitfm6/snapshots/2026-08-09T22%3A07%3A54.214593Z) | „AI sucks at building workout programs”; „bottleneck is reading the week” |
| [Why US Coaches Are Leaving Trainerize](https://coachfitos.com/blog/white-label-fitness-app-us-coaches-switching-trainerize/) | Podopieczny widzi cudzą markę; własna marka = najdroższy pakiet |
| [TrainingPro / assistantcoach.fit o PWA](https://trainingpro.app/blog/why-use-pwas-fitness-boost-client-engagement) | Link bez sklepu sprzedają wszyscy tym samym zdaniem |
| [Gymkee PL — śledzenie i rezygnacje](https://gymkee.com/pl/blog/track-client-workouts-personal-training/) | Arkusz działa do ~5 osób, rozsypuje się przy 15+ |
| [Personalny.eu — retencja](https://personalny.eu/blog/porady/retencja-klientow-trenera-praktyczne-elementy-ktore-przedluza-wspolprace) | Spadek frekwencji widać tydzień wcześniej niż rezygnację |
| [Wykop 2026 — systemy dla trenerów](https://wykop.pl/wpis/84604495/czesc-mam-pytanie-do-osob-z-tagu-czy-znacie-kogos-) | „trenerzy przerabiali aplikacje i każdy jest na wielkie NIE”; plany w arkuszu, grafik w kalendarzu |
| [Cenniki PT w PL](https://trenerpersonalny.ai/co-lepsze-trener-czy-aplikacja-fitness) | Pakiet 10 treningów: Warszawa 1100–1700, Kraków 950–1450, małe miasta 650–1100 |
| Trainerize / Gymkee / Arvo / ActivAI8 / PT Distinction | Generator planów jest na każdej stronie sprzedażowej |

---

## Co trenerzy naprawdę narzekają

1. **Niedziela to przegląd, nie pisanie planu.** Przy 15–30 osobach recenzja tygodnia zjada wieczór. Nikt nie sprzedaje „przeczytam tydzień za Ciebie”.
2. **Arkusz się sypie.** Przy kilku osobach działa. Przy 15+ ginie, kto trenował, kto ma spadek ciężaru, kto zniknął z WhatsAppa.
3. **Podopieczny nie instaluje.** To prawda — i dlatego pół rynku już mówi „link, bez konta”. Samo to nie broni ceny.
4. **Cudza nazwa w telefonie.** Trenerzy odchodzą z dużych platform, bo podopieczny pyta, czemu w telefonie ma nazwę obcej firmy. Własna marka jest dodatkiem w najdroższym pakiecie.
5. **Narzędzia dokładają pracę.** Wolny kreator, dwadzieścia zakładek, recenzja check-inów ręcznie. Cytat: *„I don't want an AI builder if I'm still having to open twenty tabs to go over a client's week.”*
6. **Rezygnacja dojrzewa wcześniej.** Spadek frekwencji, krótsze odpowiedzi, cisza. Decyzja o odejściu zapada tygodnie przed wiadomością „kończę”.

---

## Link bez instalowania = stół, nie wyróżnik

CoachFitOS, TrainingPro i assistantcoach.fit sprzedają to samo zdanie co my: podopieczny dostaje link, dodaje go do ekranu, nic nie pobiera.

Awersja do instalowania jest realna (Wykop: „pełno ma w telefonie”). **Nie stawiaj tego w H1.** Zostaw w środku strony jako sposób działania.

To, czego duzi nie dają tanio: **imię trenera na ekranie podopiecznego**, nie nazwa programu.

---

## AI, które trenerzy odrzucają

Generatory planów (Trainerize AI Workout Builder, Dwayne / Gymkee, Arvo, ActivAI8, PT Distinction):

- demo w trzydzieści sekund, potem trener i tak poprawia;
- periodyzacja wygląda na periodyzację, ładuje się jak błądzenie;
- badanie 2025 (IJSSC): sam plan z AI bez trenera = o 24 punkty niższa regularność niż plan z AI *i* trenerem;
- wątek trenerski: *„AI sucks at building workout programs”*, *„ditched Trainerize, a lot of useless features”*.

**Nie robimy generatora planów jako obietnicy sprzedażowej.** Import planu zostaje narzędziem (`PlanImport`), nie hasłem.

AI, którego trenerzy nie dostają i za które zapłacą:

| Funkcja | Dlaczego |
|---|---|
| Przegląd tygodnia | Czyta dane, nie dokłada do stosu |
| Wiadomość pod konkretną osobę | Nie szablon, a to, co ta osoba zrobiła i czego nie |
| Zrzut / zdjęcie → serie i ciężary | Znosi przepisywanie; mamy `HistoryImport` |
| Raport dla podopiecznego co 4 tygodnie | Brak widocznych efektów = najczęstszy powód rezygnacji |

Odłożone: raportowanie treningu przez WhatsAppa (nowa zależność, weryfikacja firmy, koszt za wiadomość).

---

## Cytat, który ustawia kolejkę

> Anything that writes more content adds to the pile you have to read. Your bottleneck is reading the week, so a builder makes that worse. Generation demos in thirty seconds. Consolidation looks like nothing until you have weeks of real client data behind it, which no sales page can show.

Dlatego nikt tego nie sprzedaje na stronie: nie da się pokazać w trzydzieści sekund. My możemy dowieźć przegląd ręcznie z arkusza albo zrzutów — `PlanImport` i `HistoryImport` już to czytają.

---

## Pieniądze w Polsce

| Miasto | Pakiet 10 treningów |
|---|---|
| Warszawa | 1100–1700 zł |
| Kraków | 950–1450 zł |
| Poznań | 900–1400 zł |
| Małe miasta | 650–1100 zł |

Język wartości: stawka × osiem sesji × osoby, które odeszły. Liczy to kalkulator `/ile-tracisz`, nie cytat z bloga.

---

## Liczba 68 procent — nie na stronę

Blog Gymkee pisze: 20 dni ciszy podnosi szansę rezygnacji o 68%. To **nie jest badanie**. Nie cytujemy tego na landingu, w FAQ ani w mailach jako faktu. Zostaje w researchu jako sygnał, że cisza poprzedza odejście. Na stronie mówimy językiem kalkulatora trenera.

---

## Co już mamy w produkcie

| Klocek | Plik | Rola w ofercie |
|---|---|---|
| Import planu z wklejonego tekstu | `apps/api/PlanImport.cs` | Arkusz / PDF → plan |
| Historia ze zdjęcia | `apps/api/HistoryImport.cs` | Zrzut WhatsApp / kartka → serie, zmiana ciężaru |
| Portal bez konta | `/portal/[token]` | Link, dodanie do ekranu |
| Kolejka uwagi | `AttentionItem` w `api.ts` | Kto nie trenował, cisza, zastój |

Pierwszy przegląd dla pierwszej piątki składamy **ręcznie** z tych klocków. Funkcja w produkcie dopiero po trzech dowiezionych ręcznie.

---

## Wniosek dla oferty

Oferta, której trudno odmówić: **przyślij to, czym dziś prowadzisz — w 24 godziny dostaniesz przegląd i trzy wiadomości.** Bez konta, bez rozmowy, bez karty. Ryzyko bierzemy my, bo nie mamy jeszcze opinii.

Dopiero cotygodniowy przegląd wymaga planów w środku — i to my je przenosimy.

H1 odpowiada na „dlaczego mnie to obchodzi”, nie na „jak to działa”.
