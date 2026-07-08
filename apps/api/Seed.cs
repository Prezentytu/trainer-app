namespace TrainerApp.Api;

public static class Seed
{
    public static void Run(AppDb db)
    {
        if (db.Exercises.Any()) return;

        var exercises = new List<Exercise>
        {
            new() { Name = "Przysiad ze sztangą", Type = "reps", DefaultSets = 4, DefaultReps = 8, DefaultRestBetweenSetsSeconds = 120, DefaultLoadKg = 60, Description = "Klatka wyprostowana, kolana w linii stóp." },
            new() { Name = "Martwy ciąg", Type = "reps", DefaultSets = 4, DefaultReps = 6, DefaultRestBetweenSetsSeconds = 150, DefaultLoadKg = 80, Description = "Neutralny kręgosłup, sztanga blisko ciała." },
            new() { Name = "Wyciskanie na ławce płaskiej", Type = "reps", DefaultSets = 4, DefaultReps = 8, DefaultRestBetweenSetsSeconds = 120, DefaultLoadKg = 50 },
            new() { Name = "Wiosłowanie sztangą", Type = "reps", DefaultSets = 3, DefaultReps = 10, DefaultRestBetweenSetsSeconds = 90, DefaultLoadKg = 40 },
            new() { Name = "Wykroki z hantlami", Type = "reps", DefaultSets = 3, DefaultReps = 12, DefaultRestBetweenSetsSeconds = 90, DefaultLoadKg = 12 },
            new() { Name = "Podciąganie na drążku", Type = "reps", DefaultSets = 3, DefaultReps = 6, DefaultRestBetweenSetsSeconds = 120 },
            new() { Name = "Plank", Type = "time", DefaultSets = 3, DefaultReps = 1, DefaultRepDurationSeconds = 45, DefaultRestBetweenSetsSeconds = 60, Description = "Napięty brzuch i pośladki, ciało w linii prostej." },
            new() { Name = "Wall sit", Type = "time", DefaultSets = 3, DefaultReps = 1, DefaultRepDurationSeconds = 40, DefaultRestBetweenSetsSeconds = 60 },
            new() { Name = "Pompki", Type = "reps", DefaultSets = 3, DefaultReps = 15, DefaultRestBetweenSetsSeconds = 60 },
            new() { Name = "Hip thrust", Type = "reps", DefaultSets = 4, DefaultReps = 10, DefaultRestBetweenSetsSeconds = 90, DefaultLoadKg = 50 },
        };
        db.Exercises.AddRange(exercises);

        var client = new Client { Name = "Jan Kowalski", Email = "jan.kowalski@example.com", Note = "Cel: siła, 3x w tygodniu" };
        db.Clients.Add(client);
        db.SaveChanges();

        var template = new Plan
        {
            Name = "FBW A — początkujący",
            Description = "Trening całego ciała, nacisk na wzorce podstawowe.",
            IsTemplate = true,
            Days =
            [
                new PlanDay
                {
                    WeekNumber = 1, Order = 1, Label = "Trening całego ciała",
                    Notes = "Rozgrzewka: 5 min krążeń i wymachów.",
                    Items =
                    [
                        new PlanItem { ExerciseId = exercises[0].Id, Order = 1, Sets = 3, Reps = 10, LoadKg = 40, TargetRir = 2, RestAfterExerciseSeconds = 120 },
                        new PlanItem { ExerciseId = exercises[2].Id, Order = 2, Sets = 3, Reps = 10, LoadKg = 40, TargetRir = 2, RestAfterExerciseSeconds = 120 },
                        new PlanItem { ExerciseId = exercises[3].Id, Order = 3, TargetRir = 3, RestAfterExerciseSeconds = 90 },
                        new PlanItem { ExerciseId = exercises[6].Id, Order = 4, TargetRir = 1, RestAfterExerciseSeconds = 60, Notes = "Ostatnia seria do przerwania pozycji." },
                    ],
                },
            ],
        };
        db.Plans.Add(template);

        // Przykład metody 6-4-2-5-3-1 z rozkładem na serie (rampa + serie anaboliczne 80%/60% od topu).
        var poliquin = new Plan
        {
            Name = "Siła — metoda 6-4-2-5-3-1 (przykład)",
            Description = "Rampa do topu, potem serie anaboliczne liczone jako % od najcięższej serii.",
            IsTemplate = true,
            Days =
            [
                new PlanDay
                {
                    WeekNumber = 3, Order = 1, Label = "Poniedziałek",
                    Items =
                    [
                        new PlanItem
                        {
                            ExerciseId = exercises[0].Id, Order = 1, SetScheme = "Rampa 6-4-2-5-3-1",
                            PrescribedSets =
                            [
                                new PlanSet { Order = 1, Role = "ramp", Reps = 2, LoadKg = 50, TargetRir = 0, Note = "ustal 2RM" },
                                new PlanSet { Order = 2, Role = "backoff", Reps = 5, RepsMax = 10, LoadPercent = 80, PercentOf = "top", TargetRir = 2, Note = "seria anaboliczna" },
                                new PlanSet { Order = 3, Role = "backoff", Reps = 10, RepsMax = 15, LoadPercent = 60, PercentOf = "top", TargetRir = 3 },
                            ],
                        },
                    ],
                },
            ],
        };
        db.Plans.Add(poliquin);
        db.SaveChanges();
    }
}
