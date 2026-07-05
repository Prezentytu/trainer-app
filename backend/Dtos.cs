namespace TrainerApp.Api;

public record ClientInput(string Name, string? Email, string? Note);

public record ExerciseInput(
    string Name,
    string? Description,
    string Type,
    int DefaultSets,
    int DefaultReps,
    int? DefaultRepDurationSeconds,
    int DefaultRestBetweenSetsSeconds,
    double? DefaultLoadKg);

public record PlanItemInput(
    int ExerciseId,
    int Order,
    int? Sets,
    int? Reps,
    int? RepDurationSeconds,
    int? RestBetweenSetsSeconds,
    int? RestAfterExerciseSeconds,
    double? LoadKg,
    string? Notes);

public record PlanInput(string Name, string? Description, bool IsTemplate, List<PlanItemInput> Items);

public record AssignmentInput(int PlanId, int ClientId, DateOnly StartDate, string? Note);

public record DuplicateInput(string? Name, bool? IsTemplate);

public record StatusInput(string Status);
