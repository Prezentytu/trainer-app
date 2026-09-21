# Narzędzie, które Adam może zbudować sam — inwentarz i redukcja suite'u testów

**Data:** 22 sierpnia 2026  
**Po co ten plik:** odpowiedź na jedno pytanie — *co konkretnie Adam koduje sam, żeby to był produkt, a nie audyt na kalendarzu Krzyśka*.  
**Poprzedni dokument** ([2026-08-21-mvp-trzy-pomysly-aktywa.md](2026-08-21-mvp-trzy-pomysly-aktywa.md)) skończył werdyktem „nie ma produktu, zostaje usługa". To była poprawna egzekucja złych pomysłów (linter, bramka, dashboard flake) i **zła odpowiedź na Twoje pytanie**. Ten plik ją zastępuje.

Ograniczenia, które przyjmuję jako twarde:

1. Adam buduje **sam**, kodem. Krzysiek i Przemek nie dokładają godzin do budowy ani do dostawy.
2. Ich klienci i lista są kanałem — nie dostawcą pracy.
3. Nie może to być coś, co Playwright doda jednym pull requestem.
4. Musi mieć wynik, który firma z budżetem rozumie bez tłumaczenia.

---

## 1. Odpowiedź w trzech zdaniach

Agenci (Copilot, Cursor, Playwright Generator) właśnie zaczęli produkować testy hurtowo, a nikt nie panuje nad tym, **co ten suite naprawdę pokrywa i ile z niego jest duplikatem**. Adam buduje narzędzie, które czyta repozytorium testów i mówi: te 412 plików testuje w rzeczywistości 130 przepływów, 38% to powtórzenia tej samej ścieżki napisane trzy razy, a tych siedmiu przepływów biznesowych nie testuje nikt — i tyle złotych miesięcznie płacicie za ten bałagan.

Potem to samo narzędzie **zamyka pętlę**: staje się źródłem kontekstu dla ich agentów, żeby następny wygenerowany test nie był czterdziestym pierwszym logowaniem.

**Nazwa na fakturze:** inwentarz i redukcja suite'u testów. Nazwa handlowa nie jest decyzją tego tygodnia.

---

## 2. Dlaczego to jest realny problem (nie moje wrażenie)

Cztery niezależne źródła z 2026 roku mówią to samo, a jedno z nich to konkurent, który sam przyznaje, że tego nie robi.

**Currents, marzec 2026** — o suite'ach po wejściu agentów:

> This is arguably the most consequential unsolved problem. If anyone can generate hundreds of tests quickly, the hardest question becomes: Which tests belong in CI? Which are redundant? Which are too expensive? What's your coverage signal besides "we have more tests"? (…) That is not a code-generation problem, it's an operations problem. (…) Teams will need additional process and tooling to manage and prioritize the suite.

To jest dosłownie opis produktu, wypowiedziany przez firmę, która sprzedaje **historię przebiegów**, nie analizę kodu suite'u. ([currents.dev](https://currents.dev/posts/state-of-playwright-ai-ecosystem-in-2026))

**Praktycy o tym, co robią agenci:**

> Because each generation run starts fresh, you end up with the same journey tested three slightly different ways across six files, and a test count that climbs faster than anyone's understanding of what those tests actually cover. That's not coverage. It's a maintenance bill with a delay on it.

Ten sam tekst podaje próg: koszt utrzymania przebija prędkość pisania w okolicy **pięćdziesięciu testów**. ([testvox](https://testvox.com/generating-playwright-tests-with-ai-what-works-what-breaks-and-how-to-review-the-output/))

> Every one of those two hundred tests contains its own hardcoded selectors. Every test sets up its own data by clicking through the UI. Every test duplicates the login flow. Every test is a standalone island with zero shared context.

Diagnostyczne pytanie z tego samego tekstu, które warto wprost policzyć narzędziem: *jeśli zmienię jeden lokator, ile plików muszę tknąć?* ([scrolltest](https://scrolltest.com/ai-generated-tests-break-scale-playwright-architecture-2026/))

**Silnik problemu rośnie, nie maleje.** Cursor ma około 2 miliardów dolarów przychodu w ujęciu rocznym (marzec 2026), Copilot 4,7 miliona płatnych użytkowników i wzrost 75% rok do roku, a Playwright od wersji 1.56 sam dowozi Generator. Każda z tych rzeczy **produkuje** testy. Żadna nie sprząta.

**Wniosek:** to nie jest problem, który ktoś sobie wymyślił, żeby sprzedać narzędzie. To jest odpad procesu, który właśnie wchodzi w fazę masową.

---

## 3. Dlaczego Microsoft tego nie doda jednym pull requestem

Cztery powody, w kolejności od najmocniejszego.

**Pierwszy: to indeks oskarżenia ich własnego produktu.** Raport „38% Waszego suite'u to duplikaty" jest raportem o tym, co wyprodukował Copilot i Playwright Generator. Microsoft nie wyśle funkcji, której jedynym zadaniem jest pokazać, ile śmieci narobiły jego agenty. Linter mógł wysłać, bo linter chwali framework. Ten raport go nie chwali.

**Drugi: agenci Playwright z definicji nie znają biznesu.** Ich własna dokumentacja opisuje Plannera jako coś, co eksploruje aplikację i produkuje plan, przyjmując opcjonalnie dokument wymagań. Healer naprawia **lokatory**, nie strukturę przepływu. Nazwanie przepływów po nazwach z *Waszego* produktu i powiedzenie, których brakuje, wymaga wiedzy, której framework nie ma i mieć nie będzie. ([playwright.dev/docs/test-agents](https://playwright.dev/docs/test-agents))

**Trzeci: kwota w złotych na fakturze klienta to nie jest domena frameworka.** Minuty liczy GitHub, ale przypisanie ich do przepływu biznesowego i do zespołu — nie. To warstwa nad narzędziem, po stronie klienta.

**Czwarty, najważniejszy strategicznie:** to narzędzie **nie stoi na drodze** Microsoftowi. Linter i bramka stały — dlatego umarły. Inwentarz konsumuje output ich agentów i czyni go znośnym. Taka pozycja jest bezpieczniejsza od każdej, która mówi „nie wpuszczę tego pull requesta".

**Uczciwe ryzyko, którego nie ukrywam.** Playwright Planner już eksploruje aplikację i pisze plan — jest w połowie drogi do inwentarza „od strony aplikacji". Jeśli kiedyś doda `npx playwright audit` z wykrywaniem duplikatów, zostaje mapowanie na przepływy biznesowe, koszt w złotych i raport dla managera. Jeśli i to wejdzie — wychodzisz z tej kategorii. Warunki wyjścia są w sekcji 11 i sprawdzasz je raz na kwartał, nie raz na rok.

---

## 4. Co dokładnie budujesz (wersja pierwsza, dwa do trzech tygodni solo)

Bez nowego runnera. Bez chmury na wyniki. Bez wtyczki w katalogu GitHuba.

**Wejście:** kopia repozytorium do czytania oraz — opcjonalnie — raport JSON z czternastu dni przebiegów.

**Rdzeń, cztery moduły:**

| Modul | Co robi | Czym to piszesz |
|---|---|---|
| Parser | Czyta pliki `*.spec.ts` i wyciąga tytuły, tagi, hierarchię `describe`, użyte obiekty stron i fixture'y, typ każdego lokatora, surowe wywołania `page.*`, sztywne czekania | Analiza drzewa składniowego TypeScriptu (`ts-morph`) |
| Detektor powtórzeń | Zamienia każdy test w sygnaturę sekwencji akcji i porównuje; osobno porównuje znaczenie tytułów | Sygnatura strukturalna plus osadzenia tekstu |
| Inwentarz przepływów | Grupuje testy w nazwane przepływy biznesowe i konfrontuje je z listą tras aplikacji albo opisem interfejsu, żeby pokazać dziury | Model językowy na wyniku parsera, nie na surowym kodzie |
| Wycena | Czas trwania testu razy liczba uruchomień razy stawka minuty ich runnera | Raport JSON plus jedna liczba z ich faktury |

**Wyjście — dwa artefakty, nie jeden:**

Jedna strona dla osoby z budżetem: ile testów, ile realnych przepływów, procent powtórzeń, siedem nieprzykrytych przepływów nazwanych po ludzku, kwota miesięczna. Druga część, dla leada: lista konkretnych plików do scalenia i usunięcia, z numerami linii.

Tu Twój system projektowy przestaje być ozdobą i zaczyna zarabiać. Raport, który wygląda jak produkt, a nie jak wydruk skryptu, jest **tym, co lead wyśle swojemu szefowi** — a to jest cała mechanika poczty pantoflowej z sekcji 7.

**Warstwa druga, dopiero po trzech płatnych klientach:** serwer kontekstu dla ich agentów. Cursor albo Copilot przed wygenerowaniem testu pyta „czy ta ścieżka jest już pokryta i którego obiektu strony użyć", i dostaje odpowiedź z inwentarza. Diagnoza zamienia się w zapobieganie, a jednorazowy raport w rzecz, za którą płaci się dalej.

**Poligon, na którym kalibrujesz przed pierwszym klientem:** `fiziyo-tests` (prawdziwy suite z obiektami stron i ciągłą integracją na `portal.fiziyo.pl`) oraz `apps/web/e2e` w tym repozytorium. Masz dwa własne zbiory danych. Nie musisz prosić żadnej firmy o dostęp, żeby zbudować i sprawdzić wersję pierwszą — to jest realna przewaga startowa, nie sentyment do starych repozytoriów.

---

## 5. Równanie wartości — gdzie naprawdę wygrywasz

Przypomnienie zasady: początkujący dokładają do licznika (większa obietnica, więcej dowodów), duże firmy zjeżdżają z mianownikiem do zera.

**Licznik.** Wymarzony rezultat: *wiem, co mój zespół naprawdę testuje, i przestaję płacić za powtórzenia.* Prawdopodobieństwo sukcesu jest wysokie z nietypowego powodu — dane pochodzą z **ich własnego repozytorium**. Nie musisz mieć autorytetu w testowaniu, żeby ktoś uwierzył w liczbę wyliczoną z jego kodu. To jest dokładnie ten warunek, który pozwala Ci sprzedawać bez twarzy Krzyśka.

**Mianownik — tutaj jest cała robota.**

Czas oczekiwania: pierwszy raport w **pięć dni roboczych**, a docelowo, gdy narzędzie dojdzie do wprawy, w dwadzieścia cztery godziny. Nie „po kwartale wdrożenia". Szybkość jest najsilniejszym narzędziem perswazji, jakie masz, i jedyną rzeczą, którą możesz kupić kodem, a nie cudzym kalendarzem.

Wysiłek i poświęcenie: klient robi **jedną rzecz** — daje dostęp do repozytorium w trybie czytania. Nie wypełnia ankiety, nie umawia warsztatu, nie przygotowuje danych, nie uczy się narzędzia. Format „zrobione za Ciebie" w pełni: cięcia dostają na tacy jako lista plików.

Każde tarcie, które usuniesz, wolno przeliczyć na cenę. Każdy warsztat, który dodasz, wraca do modelu, którego nie chcesz.

---

## 6. Cennik: zacznij od góry i schodź w dół

Środek zabija, więc go nie ma. Trzy szczeble, wchodzisz na najwyższym.

**Roadster — przegląd wykonany rękami, pierwszych osiem firm.**  
Cena: **14 900 zł** jednorazowo. Dowóz: pięć dni roboczych, raport plus sześćdziesięciominutowe omówienie, które prowadzi Adam, bo omawia się liczby z ich repozytorium. Limit osiem, bo to beta i uczysz się na małej próbce. Gwarancja, która sprzedaje sama: *jeśli nie znajdziemy powtórzeń wartych więcej niż faktura, nie płacicie*.

To nie jest audyt w sensie, który odrzuciłeś. Audyt to człowiek, który czyta. To jest **skrypt Adama, dostarczony ręcznie** — dokładnie tak, jak Hormozi każe robić Roadstera: dowozisz rękami, żeby nie budować systemu dla rynku, którego jeszcze nie znasz.

**Model S — inwentarz, który żyje.**  
Cena: **2 900 zł miesięcznie**, rok płatny z góry to **29 000 zł**. Za to: odświeżanie co tydzień na ich ciągłej integracji, serwer kontekstu dla agentów, powiadomienie „powstał nowy duplikat" i kwartalna jedna strona dla zarządu. Ta cena stoi świadomie powyżej pasma, w którym natywne narzędzia oparte na modelach językowych tracą klientów (poniżej 50 dolarów miesięcznie zostaje 23% przychodu w skali roku, powyżej 250 dolarów około 70%).

Dlaczego to się odnawia, a licencja lintera by się nie odnawiała: **mapa gnije sama**. Aplikacja zmienia się w każdym sprincie, agenci generują dalej, ludzie odchodzą. Klient nie odnawia dostępu do pliku — odnawia aktualność obrazu.

**Model 3 — dopiero po ośmiu opłaconych Roadsterach.**  
Aplikacja instalowana w repozytorium, samoobsługa, **990 zł miesięcznie za repozytorium**. Tu Adam znika z dostawy całkowicie. Tego nie kodujesz teraz. To jest kierunek, nie zadanie na wrzesień.

---

## 7. Trzy ramy projektowania oferty

**Rama dziesięć razy (149 000 zł).** Co byś dał, gdyby ktoś płacił dziesięciokrotność? Inwentarz wszystkich repozytoriów w firmie, nie jednego. Tygodniowy rytm zamiast kwartalnego. Panel dla dyrektora inżynierii z trendem powtórzeń w czasie. Dyżur w tygodniu wydania.  
**Wykreślam** — zgodnie z regułą odsiewania pomysłów o wysokim koszcie własnym — „dopisujemy brakujące testy za Was". To jest sprzedawanie ludzi i wraca do modelu QA Wolf, którego nie zbudujesz sam. Reszta z tej listy jest tania w kodzie i wchodzi do Modelu S jako powód, żeby wziąć rocznie z góry.

**Rama poczty pantoflowej.** Jak wygląda produkt, jeśli następny klient może przyjść **tylko** z polecenia obecnego? Wtedy najważniejszym elementem nie jest parser, a **jedna strona, którą lead wysyła swojemu szefowi i koledze z innej firmy**. Więc: raport dostaje ładny, udostępnialny odnośnik, nazwę ich firmy, datę i jedną liczbę w nagłówku. Zero podpisu „wygenerowano skryptem". To jedyna funkcja, którą wolno dopieszczać ponad potrzebę.

**Rama skalowalności.** Co usunąć z drogiej oferty, żeby zniknął Twój czas przy zachowaniu wartości? Trzy rzeczy: import repozytorium (aplikacja zamiast kopii ręcznej), nazywanie przepływów (model językowy z ich tras zamiast Twojego czytania), omówienie (nagranie i komentarze w raporcie zamiast spotkania). Zostawiasz sobie tylko rozmowę sprzedażową — i to jest granica między Modelem S a Modelem 3.

---

## 8. Rola Krzyśka i Przemka — kanał, nie współbudowa

To jest punkt, w którym poprzedni dokument się mylił najbardziej. Skoro Adam jest **właścicielem narzędzia**, nie ma problemu darowizny. Odwracamy układ.

| Kto | Co robi | Co dostaje |
|---|---|---|
| Adam | Buduje, sprzedaje, dowozi raport. Właściciel repozytorium i praw. | Cały przychód minus prowizja |
| Testoneo | Jeden list do listy alumnów i firm. Nazwa i logo w opisie przypadku. Zero godzin. | **25% pierwszej faktury** (3 725 zł z 14 900) plus **10% odnowień przez 12 miesięcy** |

Zero wspólnej spółki. Zero repozytorium na ich koncie. Zero „zobaczymy się przy podziale". Umowa partnerska na dwie strony, wysłana **przed** pierwszą linijką kodu warstwy drugiej — wersję pierwszą i tak budujesz na własnych repozytoriach, więc nie czekasz na nikogo.

Dlaczego oni to wezmą: nie kosztuje ich to ani jednej godziny, a daje temat na kontakt z listą w kwartale, w którym Program jest zamknięty. Dlaczego to jest dla Ciebie dobre: kupujesz dystrybucję za prowizję, a nie oddajesz produkt za dostęp.

Jeśli powiedzą „nie" — nadal masz produkt. Lista alumnów jest najszybszym kanałem, nie jedynym. Sto rozmów z sekcji 10 możesz odbyć na własnym nazwisku, bo raport mówi za Ciebie.

---

## 9. Rozmowa sprzedażowa na tym produkcie (rama CLOSER)

Nie wymyślaj skryptu za każdym razem. Sześć kroków, gotowe zdania.

**Wyjaśnij.** „Co się zmieniło u Was w ostatnim kwartale, że temat testów wrócił teraz?" Słuchasz, czy pada Copilot, agent, nowy zespół albo wydanie, które stanęło.

**Nazwij problem.** „Czyli macie coraz więcej testów i coraz mniej pewności, co one pokrywają. Dobrze rozumiem?"

**Przegląd prób.** „Co już próbowaliście — instrukcje dla agenta, przegląd kodu, ktoś raz posprzątał? Dlaczego to nie zostało?" Tu klient sam sobie przypomina, ile go to już kosztowało. Nie skracaj tej części.

**Sprzedaj wakacje.** Trzy filary, nie lista funkcji. Wiesz, co naprawdę testujesz. Płacisz tylko za to, co potrzebne. Następny test agenta nie jest kolejnym duplikatem. Nie mówisz „parsujemy drzewo składniowe" — to jest opis trudów lotu.

**Rozwiej obawy.** Nie mamy czasu: robicie jedną rzecz, dostęp do czytania. Nie mamy budżetu: raport pokazuje kwotę, którą już wydajecie; jeśli jest mniejsza niż faktura, nie płacicie. Już mamy Currents: oni pokazują przebiegi, my kompozycję suite'u — inne dane, inna decyzja. Bezpieczeństwo: kopia do czytania, bez sekretów, umowa o zachowaniu poufności i możliwość uruchomienia u Was.

**Wzmocnij decyzję.** Po przelewie od razu potwierdzenie, termin z datą i jedno zdanie o tym, co dostaną w piątek. Nie zostawiasz tygodniowej ciszy między płatnością a raportem.

---

## 10. Pierwsze sto powtórzeń i analiza wspólnych czynników

Mistrzostwo zaczyna się od wolumenu, nie od przemyślenia. Twoje sto to **sto wiadomości** do ludzi, którzy mogą podpisać albo wnieść temat do firmy: alumni Programu na stanowiskach leada, osoby z ofertami pracy wymagającymi Playwrighta w Polsce, autorzy pytań o flake i duplikaty.

Mierzysz cztery rzeczy przy każdej wiadomości: kanał, jednozdaniowy hak, czy odpowiedzieli, czy zgodzili się na przegląd.

Po stu bierzesz **dziesięć najlepszych odpowiedzi** i szukasz, co je łączyło, a czego nie miało pozostałe dziewięćdziesiąt: rola, wielkość firmy, konkretne słowo w haku, obecność agentów w ich procesie. Następna setka to **tylko** ta wspólna cecha. Nie dokładasz nowych pomysłów w połowie serii.

Osiem sprzedanych Roadsterów z pierwszych dwustu wiadomości to wynik dobry. Zero z pierwszej setki, przy poprawnie policzonych odpowiedziach, to nie sygnał do zmiany produktu — to sygnał do zmiany haka. Zero z dwustu przy dwóch różnych hakach to sygnał, że problem nie boli tej populacji i nie kodujesz warstwy drugiej.

---

## 11. Warunki zabicia — sprawdzasz raz na kwartał

Zapisz je teraz, kiedy jeszcze nie jesteś zakochany w kodzie.

1. **Playwright wypuszcza `npx playwright audit`** z wykrywaniem powtórzeń i inwentarzem. Zostaje mapowanie na biznes, koszt w złotych i raport dla managera. Jeśli w kolejnym wydaniu wchodzi i to — wychodzisz.
2. **Currents albo TestDino dodają analizę kompozycji suite'u**, nie tylko przebiegów. Mają dane wykonań, nie mają kodu — ale gdyby weszli w repozytorium, tracisz przewagę czasową. Obserwujesz ich zapowiedzi.
3. **Trzy pierwsze raporty nie pokazują ani 20% powtórzeń, ani jednego nieprzykrytego przepływu.** Wtedy problem jest książkowy, nie prawdziwy, w tej populacji. Nie budujesz warstwy drugiej.
4. **Dwie setki wiadomości, dwa różne haki, zero sprzedaży.** Nie ma pieniędzy przy tym bólu. Zamykasz i nie wracasz.

---

## 12. Plan na czternaście i trzydzieści dni

**Dni 1–3.** Parser na `fiziyo-tests`. Cel wąski: policzyć testy, obiekty stron, typy lokatorów i odpowiedzieć na pytanie „ile plików tknę, zmieniając jeden lokator". Bez interfejsu, wyjście do konsoli.

**Dni 4–7.** Detektor powtórzeń na tym samym zbiorze plus `apps/web/e2e`. Sprawdzasz na oko, czy to, co narzędzie nazywa duplikatem, faktycznie nim jest. Kalibrujesz próg.

**Dni 8–11.** Inwentarz przepływów i jedna strona raportu na Twoim systemie projektowym. Test brzegowy: pokaż raport ze swojego repozytorium komuś, kto nie jest testerem, i sprawdź, czy rozumie pierwsze zdanie bez pytań.

**Dni 12–14.** List do Krzyśka z umową partnerską na dwie strony i gotowym listem do jego listy. Równolegle pierwsze dwadzieścia wiadomości na własne nazwisko, z raportem z `fiziyo-tests` jako przykładem — masz prawdziwy artefakt, nie makietę.

**Dni 15–30.** Osiem Roadsterów albo tyle, ile zejdzie. Po każdym: co narzędzie musiało zrobić ręką Adama. Ta lista jest listą zadań dla wersji drugiej. Warstwy kontekstowej dla agentów nie tykasz, dopóki nie ma trzech opłaconych faktur.

---

## 13. Czego nie budujesz (żeby nie wrócić do tego za miesiąc)

Bramka, linter kanonu, kwarantanna plikiem, „standard w ciągłej integracji" — martwe, jeden pull request Microsoftu. Generator i healer — framework już to dowozi za darmo. Dashboard flake — Currents od 49 dolarów i TestDino od 39 są tańsze i pierwsze. Panel dostępności — nie tornado, a nakładki są prawnie toksyczne. Cokolwiek dla trenerów za 2 900 zł — polski trener nie kupi mechanizmu. Klon QA Wolf — sprzedaje ludzi na dyżurze, których nie masz.

RepMaxer i FiziYo zostają poligonem i, przy okazji, pierwszymi dwoma zbiorami danych tego narzędzia. To jedyna rola, jaką mają w tej firmie.

---

## 14. Źródła

- Currents, stan ekosystemu Playwright, marzec 2026 — problem kompozycji suite'u jako nierozwiązany: https://currents.dev/posts/state-of-playwright-ai-ecosystem-in-2026
- Powtórzenia i rachunek za utrzymanie testów pisanych przez agenty: https://testvox.com/generating-playwright-tests-with-ai-what-works-what-breaks-and-how-to-review-the-output/
- Architektura suite'ów pod agentami, pytanie o jeden lokator: https://scrolltest.com/ai-generated-tests-break-scale-playwright-architecture-2026/
- Playwright Agents (Planner, Generator, Healer), zakres i ograniczenia: https://playwright.dev/docs/test-agents
- Reguły dla agentów jako specyfikacja, podejście przez umiejętności: https://labs.sogeti.com/from-test-case-to-running-playwright-spec-how-skills-make-agentic-ai-test-automation-efficient/
- Cursor około 2 miliardów przychodu rocznego: https://techcrunch.com/2026/03/02/cursor-has-reportedly-surpassed-2b-in-annualized-revenue/
- Copilot 4,7 miliona płatnych, wzrost 75%: https://www.fool.com/earnings/call-transcripts/2026/01/28/microsoft-msft-q2-2026-earnings-call-transcript/
- Utrzymanie klientów wobec ceny w narzędziach opartych na modelach: https://chartmogul.com/reports/saas-retention-the-ai-churn-wave/
- Koszt niestabilnych testów: https://costops.dev/guides/flaky-tests-cost-real-money

**Do potwierdzenia, nie traktuj jako faktu:** ile firm z listy Testoneo używa dziś agentów do pisania testów, ile mają testów w suicie, jaka jest stawka minuty ich runnera, czy Krzysiek zgodzi się na prowizję zamiast współwłasności.

---

## 15. Jedno zdanie na koniec

Nie budujesz narzędzia, które stoi na drodze Microsoftowi — takie umiera w jeden pull request. Budujesz narzędzie, które **sprząta po jego agentach**, bo ich agenci właśnie zaczęli produkować bałagan na skalę, którą widać w rachunku za ciągłą integrację. Ty to kodujesz sam, na własnych dwóch repozytoriach. Krzysiek wysyła jeden list i bierze prowizję.
