window.PANEL = {
  trainer: "Trener lokalny",
  stats: { clients: 8, sessions7: 21, prs7: 4 },
  clients: [
    { id: 1, name: "Jan Kowalski", plan: "Push / Pull / Legs", last: "dziś", sessions: "3/3", state: "ok" },
    { id: 2, name: "Anna Nowak", plan: "Brak planu", last: "5 dni temu", sessions: "0/3", state: "attention" },
    { id: 3, name: "Marek Lis", plan: "Full body A", last: "9 dni temu", sessions: "0/2", state: "attention" },
    { id: 4, name: "Ewa Zielińska", plan: "Upper / Lower", last: "wczoraj", sessions: "2/2", state: "ok" },
    { id: 5, name: "Piotr Wójcik", plan: "Push / Pull / Legs", last: "2 dni temu", sessions: "2/3", state: "ok" },
  ],
  client: {
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com",
    goal: "siła · 3× w tygodniu",
    plan: "Push / Pull / Legs",
    week: "Tydzień 2 z 8",
    next: "Push Day A",
    volume: [3200, 3600, 3480, 4200, 4380, 4510, 4820],
    stats: { sessions30: 11, best: "132", prs: 3 },
    history: [
      { name: "Push Day A", date: "25 mar", sets: 12, volume: 4820 },
      { name: "Pull Day A", date: "23 mar", sets: 15, volume: 3960 },
      { name: "Legs", date: "21 mar", sets: 12, volume: 5100 },
      { name: "Push Day A", date: "18 mar", sets: 12, volume: 4510 },
    ],
    plan_days: [
      { code: "D1", name: "Push Day A", items: ["Bench Press · 3 × 8", "Overhead Press · 3 × 10", "Triceps Pushdown · 3 × 12"] },
      { code: "D2", name: "Pull Day A", items: ["Lat pulldown · 3 × 10", "Barbell Row · 3 × 10", "Bicep Curl · 3 × 12"] },
      { code: "D3", name: "Legs", items: ["Squat · 4 × 6", "Leg Press · 3 × 12", "Calf Raise · 3 × 15"] },
    ],
  },
};
