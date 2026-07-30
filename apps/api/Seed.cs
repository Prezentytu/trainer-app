using System.Text.Json;
using System.Text.Json.Serialization;

namespace TrainerApp.Api;

public static class Seed
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static void Run(AppDb db)
    {
        if (db.Exercises.Any()) return;

        var exercises = new List<Exercise>();
        exercises.AddRange(CoreExercises());
        exercises.AddRange(LoadLibraryFiles());

        // Deduplikacja case-insensitive — pliki biblioteki nie nadpisują core.
        var byName = new Dictionary<string, Exercise>(StringComparer.OrdinalIgnoreCase);
        foreach (var ex in exercises)
        {
            var key = NormalizeName(ex.Name);
            if (key.Length == 0 || byName.ContainsKey(key)) continue;
            ex.Name = key;
            byName[key] = ex;
        }

        var list = byName.Values.OrderBy(e => e.Name, StringComparer.CurrentCultureIgnoreCase).ToList();
        db.Exercises.AddRange(list);
        db.SaveChanges();

        Exercise Require(string name) =>
            list.FirstOrDefault(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException($"Seed: brak ćwiczenia „{name}\".");

        var squat = Require("Przysiad ze sztangą");
        var bench = Require("Wyciskanie na ławce płaskiej");
        var row = Require("Wiosłowanie sztangą");
        var plank = Require("Plank");

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
                        new PlanItem { ExerciseId = squat.Id, Order = 1, Sets = 3, Reps = 10, LoadKg = 40, TargetRir = 2, RestAfterExerciseSeconds = 120 },
                        new PlanItem { ExerciseId = bench.Id, Order = 2, Sets = 3, Reps = 10, LoadKg = 40, TargetRir = 2, RestAfterExerciseSeconds = 120 },
                        new PlanItem { ExerciseId = row.Id, Order = 3, TargetRir = 3, RestAfterExerciseSeconds = 90 },
                        new PlanItem { ExerciseId = plank.Id, Order = 4, TargetRir = 1, RestAfterExerciseSeconds = 60, Notes = "Ostatnia seria do przerwania pozycji." },
                    ],
                },
            ],
        };
        db.Plans.Add(template);

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
                            ExerciseId = squat.Id, Order = 1, SetScheme = "Rampa 6-4-2-5-3-1",
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

    private static string NormalizeName(string? name) =>
        string.IsNullOrWhiteSpace(name)
            ? ""
            : string.Join(' ', name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    private static List<Exercise> CoreExercises() =>
    [
        new()
        {
            Name = "Przysiad ze sztangą", Type = "reps", DefaultSets = 4, DefaultReps = 8,
            DefaultRestBetweenSetsSeconds = 120, DefaultLoadKg = 60,
            Description = "Klatka wyprostowana, kolana w linii stóp.",
            Category = "legs", Pattern = "squat", Equipment = ["barbell"],
            PrimaryMuscles = ["Czworogłowy uda", "Pośladki"],
        },
        new()
        {
            Name = "Martwy ciąg", Type = "reps", DefaultSets = 4, DefaultReps = 6,
            DefaultRestBetweenSetsSeconds = 150, DefaultLoadKg = 80,
            Description = "Neutralny kręgosłup, sztanga blisko ciała.",
            Category = "legs", Pattern = "hinge", Equipment = ["barbell"],
            PrimaryMuscles = ["Tył uda", "Pośladki", "Prostownik grzbietu"],
        },
        new()
        {
            Name = "Wyciskanie na ławce płaskiej", Type = "reps", DefaultSets = 4, DefaultReps = 8,
            DefaultRestBetweenSetsSeconds = 120, DefaultLoadKg = 50,
            Category = "chest", Pattern = "horizontal-push", Equipment = ["barbell"],
            PrimaryMuscles = ["Klatka piersiowa", "Triceps"],
        },
        new()
        {
            Name = "Wiosłowanie sztangą", Type = "reps", DefaultSets = 3, DefaultReps = 10,
            DefaultRestBetweenSetsSeconds = 90, DefaultLoadKg = 40,
            Category = "back", Pattern = "horizontal-pull", Equipment = ["barbell"],
            PrimaryMuscles = ["Najszerszy grzbietu", "Czworoboczny"],
        },
        new()
        {
            Name = "Wykroki z hantlami", Type = "reps", DefaultSets = 3, DefaultReps = 12,
            DefaultRestBetweenSetsSeconds = 90, DefaultLoadKg = 12,
            Category = "legs", Pattern = "squat", IsUnilateral = true, Equipment = ["dumbbell"],
            PrimaryMuscles = ["Czworogłowy uda", "Pośladki"],
        },
        new()
        {
            Name = "Podciąganie na drążku", Type = "reps", DefaultSets = 3, DefaultReps = 6,
            DefaultRestBetweenSetsSeconds = 120,
            Category = "back", Pattern = "vertical-pull", Equipment = ["bodyweight"],
            PrimaryMuscles = ["Najszerszy grzbietu", "Biceps"],
        },
        new()
        {
            Name = "Plank", Type = "time", DefaultSets = 3, DefaultReps = 1,
            DefaultRepDurationSeconds = 45, DefaultRestBetweenSetsSeconds = 60,
            Description = "Napięty brzuch i pośladki, ciało w linii prostej.",
            Category = "core", Pattern = "anti-extension", Equipment = ["bodyweight"],
            PrimaryMuscles = ["Core"],
        },
        new()
        {
            Name = "Wall sit", Type = "time", DefaultSets = 3, DefaultReps = 1,
            DefaultRepDurationSeconds = 40, DefaultRestBetweenSetsSeconds = 60,
            Category = "legs", Pattern = "squat", Equipment = ["bodyweight"],
            PrimaryMuscles = ["Czworogłowy uda"],
        },
        new()
        {
            Name = "Pompki", Type = "reps", DefaultSets = 3, DefaultReps = 15,
            DefaultRestBetweenSetsSeconds = 60,
            Category = "chest", Pattern = "horizontal-push", Equipment = ["bodyweight"],
            PrimaryMuscles = ["Klatka piersiowa", "Triceps"],
        },
        new()
        {
            Name = "Hip thrust", Type = "reps", DefaultSets = 4, DefaultReps = 10,
            DefaultRestBetweenSetsSeconds = 90, DefaultLoadKg = 50,
            Category = "legs", Pattern = "hinge", Equipment = ["barbell"],
            PrimaryMuscles = ["Pośladki"],
        },
    ];

    private static List<Exercise> LoadLibraryFiles()
    {
        var result = new List<Exercise>();
        foreach (var path in ResolveLibraryPaths())
        {
            try
            {
                var json = File.ReadAllText(path);
                var file = JsonSerializer.Deserialize<ExerciseLibraryFile>(json, JsonOpts);
                if (file?.Exercises is null) continue;
                foreach (var dto in file.Exercises)
                {
                    var mapped = MapDto(dto);
                    if (mapped is not null) result.Add(mapped);
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Seed: pominięto {path}: {ex.Message}");
            }
        }
        return result;
    }

    private static IEnumerable<string> ResolveLibraryPaths()
    {
        // Output dir (CopyToOutputDirectory) oraz źródło w repo przy `dotnet run` z apps/api.
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Data", "exercises"),
            Path.Combine(Directory.GetCurrentDirectory(), "Data", "exercises"),
            Path.Combine(Directory.GetCurrentDirectory(), "apps", "api", "Data", "exercises"),
        };
        foreach (var dir in candidates.Distinct())
        {
            if (!Directory.Exists(dir)) continue;
            foreach (var file in Directory.EnumerateFiles(dir, "*.json").OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
                yield return file;
            yield break;
        }
    }

    private static Exercise? MapDto(ExerciseSeedDto dto)
    {
        var name = NormalizeName(dto.Name);
        if (name.Length == 0) return null;
        return new Exercise
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            Type = string.IsNullOrWhiteSpace(dto.Type) ? "reps" : dto.Type.Trim(),
            DefaultSets = dto.DefaultSets ?? 3,
            DefaultReps = dto.DefaultReps ?? 10,
            DefaultRepDurationSeconds = dto.DefaultRepDurationSeconds,
            DefaultDistanceMeters = dto.DefaultDistanceMeters,
            DefaultRestBetweenSetsSeconds = dto.DefaultRestBetweenSetsSeconds ?? 60,
            DefaultLoadKg = dto.DefaultLoadKg,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? null : dto.Category.Trim(),
            Pattern = string.IsNullOrWhiteSpace(dto.Pattern) ? null : dto.Pattern.Trim(),
            IsUnilateral = dto.IsUnilateral ?? false,
            Equipment = dto.Equipment?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? [],
            PrimaryMuscles = dto.PrimaryMuscles?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? [],
            Instructions = string.IsNullOrWhiteSpace(dto.Instructions) ? null : dto.Instructions.Trim(),
            Media = (dto.Media ?? [])
                .Where(m => !string.IsNullOrWhiteSpace(m.YoutubeId))
                .Select(m => new ExerciseMedia(
                    m.YoutubeId!.Trim(),
                    m.Title?.Trim() ?? "",
                    m.Seconds,
                    string.IsNullOrWhiteSpace(m.Kind) ? "demo" : m.Kind.Trim()))
                .ToList(),
        };
    }

    private sealed class ExerciseLibraryFile
    {
        public string? Source { get; set; }
        public List<ExerciseSeedDto>? Exercises { get; set; }
    }

    private sealed class ExerciseSeedDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; }
        public int? DefaultSets { get; set; }
        public int? DefaultReps { get; set; }
        public int? DefaultRepDurationSeconds { get; set; }
        public int? DefaultDistanceMeters { get; set; }
        public int? DefaultRestBetweenSetsSeconds { get; set; }
        public double? DefaultLoadKg { get; set; }
        public string? Category { get; set; }
        public string? Pattern { get; set; }
        public bool? IsUnilateral { get; set; }
        public List<string>? Equipment { get; set; }
        public List<string>? PrimaryMuscles { get; set; }
        public string? Instructions { get; set; }
        public List<ExerciseMediaSeedDto>? Media { get; set; }
    }

    private sealed class ExerciseMediaSeedDto
    {
        [JsonPropertyName("youtubeId")]
        public string? YoutubeId { get; set; }
        public string? Title { get; set; }
        public int? Seconds { get; set; }
        public string? Kind { get; set; }
    }
}
