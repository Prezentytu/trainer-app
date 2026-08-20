/** Stack oferty raportu — jedno źródło copy i wartości. Język trenera, nie produktu. */

export const WDROZENIE_PRICE_ZL = 0;
export const WDROZENIE_NEXT_PRICE_ZL = 390;
export const WDROZENIE_PREMIUM_ZL = 2900;
export const WDROZENIE_DAYS = 14;
export const WDROZENIE_SPOTS = 5;
export const WDROZENIE_MONTHS_INCLUDED = 90;
export const WDROZENIE_CLIENTS = 30;
export const ROLLOVER_MONTHLY_ZL = 32;

export const RETENTION_PACK_ZL = 190;

/** 3 × 99 zł (do 30 podopiecznych) — weryfikowalne cennikiem. */
export const WDROZENIE_PLAN_VALUE_ZL = 297;

export const RETENTION_PACK: {
  href?: string;
  title: string;
  body: string;
  valueZl: number;
}[] = [
  {
    href: "/gotowce",
    title: "Trzy wiadomości WhatsApp",
    body: "Gdy podopieczny stał: pierwszy trening, dzień 7, dzień 14.",
    valueZl: 70,
  },
  {
    href: "/checklista",
    title: "Checklista 14 dni",
    body: "Piętnaście osób, cztery pytania. Wiesz, do kogo napisać dziś.",
    valueZl: 60,
  },
  {
    title: "Szablony metod",
    body: "15-10-5 i 6-4-2-5-3-1 w kreatorze — bez układania od zera.",
    valueZl: 60,
  },
];

export type WdrozenieStackRow = {
  title: string;
  body: string;
  valueZl?: number;
  href?: string;
};

export const WDROZENIE_STACK: WdrozenieStackRow[] = [
  {
    title: "Raport wszystkich podopiecznych",
    body: "Kto zrobił zaplanowane treningi, komu spadły ciężary, kto nie odezwał się od dwóch tygodni. Zamiast wieczoru nad arkuszem — jedna strona do przeczytania.",
  },
  {
    title: "Trzy wiadomości gotowe do wysłania",
    body: "Napisane pod konkretną osobę i jej tydzień, nie z szablonu. Kopiujesz i wklejasz na WhatsAppie.",
  },
  {
    title: "90 dni do 30 podopiecznych",
    body: "Raport co tydzień przez trzy miesiące. Plany przenoszę ja — Ty nie przepisujesz ani jednej serii.",
    valueZl: WDROZENIE_PLAN_VALUE_ZL,
  },
  {
    title: "Wiadomości i checklista",
    body: "Gotowe wiadomości na pierwsze dni ciszy, checklista 14 dni i szablony metod w kreatorze.",
    valueZl: RETENTION_PACK_ZL,
    href: "/pakiet-retencji",
  },
];

export const WDROZENIE_STACK_SUM_ZL = WDROZENIE_STACK.reduce(
  (sum, row) => sum + (row.valueZl ?? 0),
  0,
);

export const WDROZENIE_STEPS = [
  {
    n: "01",
    title: "Przysyłasz to, czym dziś prowadzisz",
    body: "Arkusz, PDF albo zrzuty z WhatsAppa — odpisujesz na maila.",
  },
  {
    n: "02",
    title: "W 24 godziny masz raport",
    body: "Kto stanął, komu spadły ciężary, kto nie odezwał się od dwóch tygodni — i trzy wiadomości.",
  },
  {
    n: "03",
    title: "Chcesz go co tydzień — przenoszę plany",
    body: "Ty nic nie przepisujesz. Podopieczny dostaje link pod Twoim imieniem.",
  },
] as const;
