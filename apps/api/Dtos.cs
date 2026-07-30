namespace TrainerApp.Api;

public record ClientInput(string Name, string? Email, string? Note);

public record ExerciseInput(
    string Name,
    string? Description = null,
    string Type = "reps",
    int DefaultSets = 3,
    int DefaultReps = 10,
    int? DefaultRepDurationSeconds = null,
    int? DefaultDistanceMeters = null,
    int DefaultRestBetweenSetsSeconds = 60,
    double? DefaultLoadKg = null);

public record PlanSetInput(
    int Order = 0,
    int? Reps = null,
    int? RepsMax = null,
    int? DurationSeconds = null,
    int? DistanceMeters = null,
    double? LoadKg = null,
    double? LoadPercent = null,
    string? PercentOf = null,
    double? TargetRpe = null,
    double? TargetRir = null,
    string? Tempo = null,
    string? Role = null,
    string? Note = null);

public record PlanItemInput(
    int ExerciseId,
    int Order = 0,
    int? SupersetGroup = null,
    bool IsWarmup = false,
    string? MeasureType = null,
    int? Sets = null,
    int? Reps = null,
    int? RepsMax = null,
    int? RepDurationSeconds = null,
    int? RepDurationSecondsMax = null,
    int? DistanceMeters = null,
    string? Tempo = null,
    double? TargetRpe = null,
    double? TargetRir = null,
    string? SetScheme = null,
    int? RestBetweenSetsSeconds = null,
    int? RestAfterExerciseSeconds = null,
    double? LoadKg = null,
    string? Notes = null,
    List<PlanSetInput>? PrescribedSets = null);

public record PlanDayInput(
    int WeekNumber = 1,
    int Order = 0,
    string Label = "",
    string? Notes = null,
    List<PlanItemInput>? Items = null);

public record PlanInput(
    string Name,
    string? Description = null,
    bool IsTemplate = false,
    List<PlanDayInput>? Days = null);

public record AssignmentInput(int PlanId, int ClientId, DateOnly StartDate, string? Note);

public record DuplicateInput(string? Name, bool? IsTemplate);

public record StatusInput(string Status);
