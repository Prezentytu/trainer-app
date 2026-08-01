namespace TrainerApp.Api;

/// <summary>Konto trenera (Clerk). Multi-tenant light — izolacja Client/Plan.</summary>
public class Trainer
{
    public int Id { get; set; }
    public string ClerkUserId { get; set; } = "";
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Client
{
    public int Id { get; set; }
    public int TrainerId { get; set; }
    public Trainer? Trainer { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Assignment> Assignments { get; set; } = [];
    public List<ClientMax> Maxes { get; set; } = [];
    public List<ClientMeasurement> Measurements { get; set; } = [];
    public List<WorkoutSession> Sessions { get; set; } = [];
    public List<ClientAccessToken> AccessTokens { get; set; } = [];
}

public class ClientMeasurement
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public DateOnly MeasuredOn { get; set; }
    public double? WeightKg { get; set; }
    public double? WaistCm { get; set; }
    public double? ChestCm { get; set; }
    public double? HipsCm { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>1RM klienta per ćwiczenie (historia — aktualny = najnowszy wg daty).</summary>
public class ClientMax
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }
    public double MaxKg { get; set; }
    public DateOnly MeasuredOn { get; set; }
    public string? Note { get; set; }
}

/// <summary>Magic-link do PWA klienta (token w URL).</summary>
public class ClientAccessToken
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public string Token { get; set; } = "";
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Materiał wideo ćwiczenia. Kind: "demo" | "tip" | "mistakes".</summary>
public record ExerciseMedia(string YoutubeId, string Title, int? Seconds, string Kind);

public class Exercise
{
    public int Id { get; set; }
    /// <summary>null = wspólna biblioteka; ustawione = własne ćwiczenie trenera.</summary>
    public int? TrainerId { get; set; }
    public Trainer? Trainer { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    // "reps" | "time" | "distance"
    public string Type { get; set; } = "reps";

    public int DefaultSets { get; set; } = 3;
    public int DefaultReps { get; set; } = 10;

    // Dla typu "time": czas jednego powtórzenia w sekundach
    public int? DefaultRepDurationSeconds { get; set; }

    // Dla typu "distance": domyślny dystans w metrach (np. spacer farmera)
    public int? DefaultDistanceMeters { get; set; }

    public int DefaultRestBetweenSetsSeconds { get; set; } = 60;
    public double? DefaultLoadKg { get; set; }

    // Taksonomia / media (opcjonalne) — shoulders|chest|back|arms|core|legs|fullbody
    public string? Category { get; set; }

    // vertical-push|horizontal-push|vertical-pull|horizontal-pull|isolation|scapular|rotation|anti-rotation|anti-extension|carry|squat|hinge
    public string? Pattern { get; set; }

    public bool IsUnilateral { get; set; }

    public List<string> Equipment { get; set; } = [];
    public List<string> PrimaryMuscles { get; set; } = [];
    public string? Instructions { get; set; }
    public List<ExerciseMedia> Media { get; set; } = [];
}

public class Plan
{
    public int Id { get; set; }
    public int TrainerId { get; set; }
    public Trainer? Trainer { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }   // zasady ogólne planu
    public bool IsTemplate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<PlanDay> Days { get; set; } = [];
    public List<Assignment> Assignments { get; set; } = [];
}

public class PlanDay
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public Plan? Plan { get; set; }

    public int WeekNumber { get; set; } = 1;   // Tydzień 1..N
    public int Order { get; set; }             // kolejność dnia w tygodniu
    public string Label { get; set; } = "";    // „Poniedziałek", „Trening A"
    public string? Notes { get; set; }         // rozgrzewka / wskazówki dnia

    public List<PlanItem> Items { get; set; } = [];
}

public class PlanItem
{
    public int Id { get; set; }
    public int PlanDayId { get; set; }
    public PlanDay? Day { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }

    public int Order { get; set; }

    // Superserie: ta sama wartość w obrębie dnia = seria łączona (a/b/c wg Order)
    public int? SupersetGroup { get; set; }

    // Rozgrzewka — pozycje na początku dnia (numeracja od 0 w widoku Lista)
    public bool IsWarmup { get; set; }

    // "reps" | "time" | "distance"; null = dziedziczy z Exercise.Type
    public string? MeasureType { get; set; }

    // Nadpisania parametrów; null = weź default z ćwiczenia
    public int? Sets { get; set; }
    public int? Reps { get; set; }
    public int? RepsMax { get; set; }                  // zakres powtórzeń: Reps..RepsMax
    public int? RepDurationSeconds { get; set; }
    public int? RepDurationSecondsMax { get; set; }    // zakres czasu
    public int? DistanceMeters { get; set; }
    public string? Tempo { get; set; }                 // „3110", „20X1"
    public double? TargetRpe { get; set; }
    public double? TargetRir { get; set; }
    public string? SetScheme { get; set; }             // „Rampa 6", „Rampa 4 + BO 80%"
    public int? RestBetweenSetsSeconds { get; set; }
    public int RestAfterExerciseSeconds { get; set; } = 90;
    public double? LoadKg { get; set; }
    public double? LoadPercent { get; set; }   // % 1RM klienta (alternatywa dla LoadKg)
    public string? Notes { get; set; }

    // Opcjonalny rozkład na serie; niepusty = definiuje serie i nadpisuje Sets/Reps
    public List<PlanSet> PrescribedSets { get; set; } = [];
}

public class PlanSet
{
    public int Id { get; set; }
    public int PlanItemId { get; set; }
    public PlanItem? Item { get; set; }

    public int Order { get; set; }
    public int? Reps { get; set; }
    public int? RepsMax { get; set; }
    public int? DurationSeconds { get; set; }
    public int? DistanceMeters { get; set; }
    public double? LoadKg { get; set; }        // ciężar bezwzględny (alternatywa dla %)
    public double? LoadPercent { get; set; }   // % bazy PercentOf
    public string? PercentOf { get; set; }     // "1rm" | "top" (null = bezwzględny LoadKg)
    public double? TargetRpe { get; set; }
    public double? TargetRir { get; set; }
    public string? Tempo { get; set; }
    public string? Role { get; set; }          // "warmup" | "ramp" | "top" | "backoff" | "work"
    public string? Note { get; set; }
}

public class Assignment
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public Plan? Plan { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }

    public DateOnly StartDate { get; set; }
    public string? Note { get; set; }

    // "active" | "completed" | "cancelled"
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WorkoutSession
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public int? AssignmentId { get; set; }
    public Assignment? Assignment { get; set; }
    public int? PlanDayId { get; set; }
    public PlanDay? PlanDay { get; set; }
    public int? PlanId { get; set; }
    public Plan? Plan { get; set; }

    public DateOnly PerformedOn { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Note { get; set; }
    public int? FeelingScore { get; set; }
    public int? SleepScore { get; set; }
    public int? EnergyScore { get; set; }
    // "in_progress" | "completed"
    public string Status { get; set; } = "in_progress";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<LoggedExercise> Exercises { get; set; } = [];
}

public class LoggedExercise
{
    public int Id { get; set; }
    public int WorkoutSessionId { get; set; }
    public WorkoutSession? Session { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }
    public int Order { get; set; }
    public string? Note { get; set; }
    public List<LoggedSet> Sets { get; set; } = [];
}

public class LoggedSet
{
    public int Id { get; set; }
    public int LoggedExerciseId { get; set; }
    public LoggedExercise? LoggedExercise { get; set; }
    public int SetNumber { get; set; }
    public double? WeightKg { get; set; }
    public int? Reps { get; set; }
    public int? DurationSeconds { get; set; }
    public int? DistanceMeters { get; set; }
    public double? Rir { get; set; }
    public double? Rpe { get; set; }
    public bool IsWarmup { get; set; }
    /// <summary>Checkmark ukończenia serii (logger Gravitus).</summary>
    public bool Completed { get; set; }
}
