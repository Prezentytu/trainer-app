namespace TrainerApp.Api;

public class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Assignment> Assignments { get; set; } = [];
}

public class Exercise
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    // "reps" | "time"
    public string Type { get; set; } = "reps";

    public int DefaultSets { get; set; } = 3;
    public int DefaultReps { get; set; } = 10;

    // Dla typu "time": czas jednego powtórzenia w sekundach
    public int? DefaultRepDurationSeconds { get; set; }

    public int DefaultRestBetweenSetsSeconds { get; set; } = 60;
    public double? DefaultLoadKg { get; set; }
}

public class Plan
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsTemplate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<PlanItem> Items { get; set; } = [];
    public List<Assignment> Assignments { get; set; } = [];
}

public class PlanItem
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public Plan? Plan { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }

    public int Order { get; set; }

    // Nadpisania parametrów; null = weź default z ćwiczenia
    public int? Sets { get; set; }
    public int? Reps { get; set; }
    public int? RepDurationSeconds { get; set; }
    public int? RestBetweenSetsSeconds { get; set; }
    public int RestAfterExerciseSeconds { get; set; } = 90;
    public double? LoadKg { get; set; }
    public string? Notes { get; set; }
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
