window.WAData = {
  clients: [
    { id: "maya", name: "Maya Kowalska", initials: "MK", plan: "Push / pull / legs", adherence: 0.92, last: "Yesterday · Pull day", next: "Thu · Push day", tone: "positive", status: "On track" },
    { id: "jon", name: "Jon Barrett", initials: "JB", plan: "Upper / lower", adherence: 0.78, last: "3 days ago · Upper", next: "Today · Lower", tone: "neutral", status: "Week 5" },
    { id: "sofia", name: "Sofia Reyes", initials: "SR", plan: "Full body ×3", adherence: 0.55, last: "6 days ago · Full body A", next: "Overdue", tone: "danger", status: "Slipping" },
    { id: "andre", name: "André Fontaine", initials: "AF", plan: "Push / pull / legs", adherence: 0.88, last: "Today · Legs", next: "Sat · Push day", tone: "pr", status: "PR week" },
    { id: "lin", name: "Lin Zhou", initials: "LZ", plan: "No plan assigned", adherence: 0, last: "—", next: "—", tone: "neutral", status: "New" }
  ],
  library: [
    { name: "Bench press", tags: ["Chest", "Barbell"] },
    { name: "Overhead press", tags: ["Shoulders", "Barbell"] },
    { name: "Incline DB press", tags: ["Chest", "Dumbbell"] },
    { name: "Cable fly", tags: ["Chest", "Cable"] },
    { name: "Lateral raise", tags: ["Shoulders", "Dumbbell"] },
    { name: "Triceps pushdown", tags: ["Triceps", "Cable"] },
    { name: "Weighted dip", tags: ["Chest", "Bodyweight"] }
  ],
  plan: {
    name: "Push / pull / legs",
    weeks: 6,
    days: [
      { label: "Push day", ex: [
        { name: "Bench press", sets: "4 × 6", load: "62.5 kg", rest: "150s" },
        { name: "Overhead press", sets: "3 × 8", load: "40 kg", rest: "120s" },
        { name: "Incline DB press", sets: "3 × 10", load: "24 kg", rest: "90s" },
        { name: "Lateral raise", sets: "3 × 15", load: "8 kg", rest: "60s" }
      ]},
      { label: "Pull day", ex: [
        { name: "Deadlift", sets: "3 × 5", load: "120 kg", rest: "180s" },
        { name: "Weighted pull-up", sets: "4 × 6", load: "+10 kg", rest: "150s" },
        { name: "Seated row", sets: "3 × 10", load: "55 kg", rest: "90s" }
      ]},
      { label: "Leg day", ex: [
        { name: "Back squat", sets: "4 × 6", load: "95 kg", rest: "180s" },
        { name: "Romanian deadlift", sets: "3 × 8", load: "80 kg", rest: "120s" },
        { name: "Leg press", sets: "3 × 12", load: "160 kg", rest: "90s" }
      ]}
    ]
  }
};
