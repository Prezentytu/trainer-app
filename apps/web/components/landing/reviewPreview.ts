/** Przykładowy raport — zoom w 01. Dane oznaczone jako przykład. */

export const REVIEW_ROWS = [
  {
    name: "Michał Dąbrowski",
    sub: "3 z 3 treningów · wyciskanie",
    value: "105,0 kg × 3",
    tone: "pr" as const,
    mark: "PR",
  },
  {
    name: "Marta Lewicka",
    sub: "Przysiad · ciężar w dół",
    value: "80,0 kg × 5",
    tone: "loss" as const,
    mark: "−5 kg",
  },
  {
    name: "Ola Wiśniewska",
    sub: "Brak treningu od 14 dni",
    value: null,
    tone: "loss" as const,
    mark: "14 dni",
  },
] as const;

export const REVIEW_MESSAGES = [
  {
    name: "Ola",
    text: "Cześć Ola. Nie widziałem treningu od dwóch tygodni. Jak wrócisz, zacznij od lżejszego dnia — plan nadal czeka.",
  },
  {
    name: "Marta",
    text: "Cześć Marta. W przysiadzie zeszłaś o 5 kg. Napisz, czy to bark, sen, czy po prostu słabszy tydzień — podmienimy dzień.",
  },
  {
    name: "Michał",
    text: "Cześć Michał. 105 na trzy — nowy rekord. W środę zostawiamy tę samą liczbę serii, dopisuję 2,5 kg.",
  },
] as const;
