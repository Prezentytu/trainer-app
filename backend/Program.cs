using Microsoft.EntityFrameworkCore;
using TrainerApp.Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDb>(o => o.UseSqlite("Data Source=trainer.db"));
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.EnsureCreated();
    Seed.Run(db);
}

// ---------- Klienci ----------

app.MapGet("/api/clients", async (AppDb db) =>
    await db.Clients
        .OrderBy(c => c.Name)
        .Select(c => new
        {
            c.Id, c.Name, c.Email, c.Note, c.CreatedAt,
            ActivePlans = c.Assignments.Count(a => a.Status == "active"),
        })
        .ToListAsync());

app.MapGet("/api/clients/{id:int}", async (int id, AppDb db) =>
{
    var client = await db.Clients
        .Include(c => c.Assignments).ThenInclude(a => a.Plan)
        .FirstOrDefaultAsync(c => c.Id == id);
    if (client is null) return Results.NotFound();

    return Results.Ok(new
    {
        client.Id, client.Name, client.Email, client.Note, client.CreatedAt,
        Assignments = client.Assignments
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id, a.PlanId, PlanName = a.Plan!.Name, a.StartDate, a.Status, a.Note, a.CreatedAt,
            }),
    });
});

app.MapPost("/api/clients", async (ClientInput input, AppDb db) =>
{
    var client = new Client { Name = input.Name, Email = input.Email, Note = input.Note };
    db.Clients.Add(client);
    await db.SaveChangesAsync();
    return Results.Created($"/api/clients/{client.Id}", client);
});

app.MapPut("/api/clients/{id:int}", async (int id, ClientInput input, AppDb db) =>
{
    var client = await db.Clients.FindAsync(id);
    if (client is null) return Results.NotFound();
    client.Name = input.Name;
    client.Email = input.Email;
    client.Note = input.Note;
    await db.SaveChangesAsync();
    return Results.Ok(client);
});

app.MapDelete("/api/clients/{id:int}", async (int id, AppDb db) =>
{
    var client = await db.Clients.FindAsync(id);
    if (client is null) return Results.NotFound();
    db.Clients.Remove(client);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Ćwiczenia ----------

app.MapGet("/api/exercises", async (AppDb db) =>
    await db.Exercises.OrderBy(e => e.Name).ToListAsync());

app.MapPost("/api/exercises", async (ExerciseInput input, AppDb db) =>
{
    var exercise = new Exercise
    {
        Name = input.Name,
        Description = input.Description,
        Type = input.Type,
        DefaultSets = input.DefaultSets,
        DefaultReps = input.DefaultReps,
        DefaultRepDurationSeconds = input.DefaultRepDurationSeconds,
        DefaultRestBetweenSetsSeconds = input.DefaultRestBetweenSetsSeconds,
        DefaultLoadKg = input.DefaultLoadKg,
    };
    db.Exercises.Add(exercise);
    await db.SaveChangesAsync();
    return Results.Created($"/api/exercises/{exercise.Id}", exercise);
});

app.MapPut("/api/exercises/{id:int}", async (int id, ExerciseInput input, AppDb db) =>
{
    var exercise = await db.Exercises.FindAsync(id);
    if (exercise is null) return Results.NotFound();
    exercise.Name = input.Name;
    exercise.Description = input.Description;
    exercise.Type = input.Type;
    exercise.DefaultSets = input.DefaultSets;
    exercise.DefaultReps = input.DefaultReps;
    exercise.DefaultRepDurationSeconds = input.DefaultRepDurationSeconds;
    exercise.DefaultRestBetweenSetsSeconds = input.DefaultRestBetweenSetsSeconds;
    exercise.DefaultLoadKg = input.DefaultLoadKg;
    await db.SaveChangesAsync();
    return Results.Ok(exercise);
});

app.MapDelete("/api/exercises/{id:int}", async (int id, AppDb db) =>
{
    var used = await db.PlanItems.AnyAsync(i => i.ExerciseId == id);
    if (used) return Results.Conflict(new { message = "Ćwiczenie jest używane w planie — najpierw usuń je z planów." });
    var exercise = await db.Exercises.FindAsync(id);
    if (exercise is null) return Results.NotFound();
    db.Exercises.Remove(exercise);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Plany ----------

static object PlanToDto(Plan plan) => new
{
    plan.Id, plan.Name, plan.Description, plan.IsTemplate, plan.CreatedAt,
    Items = plan.Items.OrderBy(i => i.Order).Select(i => new
    {
        i.Id, i.ExerciseId, i.Order,
        ExerciseName = i.Exercise!.Name,
        ExerciseType = i.Exercise.Type,
        ExerciseDescription = i.Exercise.Description,
        // Efektywne parametry: nadpisanie z planu albo default z ćwiczenia
        Sets = i.Sets ?? i.Exercise.DefaultSets,
        Reps = i.Reps ?? i.Exercise.DefaultReps,
        RepDurationSeconds = i.RepDurationSeconds ?? i.Exercise.DefaultRepDurationSeconds,
        RestBetweenSetsSeconds = i.RestBetweenSetsSeconds ?? i.Exercise.DefaultRestBetweenSetsSeconds,
        i.RestAfterExerciseSeconds,
        LoadKg = i.LoadKg ?? i.Exercise.DefaultLoadKg,
        i.Notes,
        Overrides = new { i.Sets, i.Reps, i.RepDurationSeconds, i.RestBetweenSetsSeconds, i.LoadKg },
    }),
    AssignedCount = plan.Assignments.Count(a => a.Status == "active"),
};

app.MapGet("/api/plans", async (AppDb db) =>
{
    var plans = await db.Plans
        .Include(p => p.Items).ThenInclude(i => i.Exercise)
        .Include(p => p.Assignments)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
    return plans.Select(PlanToDto);
});

app.MapGet("/api/plans/{id:int}", async (int id, AppDb db) =>
{
    var plan = await db.Plans
        .Include(p => p.Items).ThenInclude(i => i.Exercise)
        .Include(p => p.Assignments)
        .FirstOrDefaultAsync(p => p.Id == id);
    return plan is null ? Results.NotFound() : Results.Ok(PlanToDto(plan));
});

app.MapPost("/api/plans", async (PlanInput input, AppDb db) =>
{
    var plan = new Plan
    {
        Name = input.Name,
        Description = input.Description,
        IsTemplate = input.IsTemplate,
        Items = input.Items.Select(i => new PlanItem
        {
            ExerciseId = i.ExerciseId,
            Order = i.Order,
            Sets = i.Sets,
            Reps = i.Reps,
            RepDurationSeconds = i.RepDurationSeconds,
            RestBetweenSetsSeconds = i.RestBetweenSetsSeconds,
            RestAfterExerciseSeconds = i.RestAfterExerciseSeconds ?? 90,
            LoadKg = i.LoadKg,
            Notes = i.Notes,
        }).ToList(),
    };
    db.Plans.Add(plan);
    await db.SaveChangesAsync();
    return Results.Created($"/api/plans/{plan.Id}", new { plan.Id });
});

app.MapPut("/api/plans/{id:int}", async (int id, PlanInput input, AppDb db) =>
{
    var plan = await db.Plans.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
    if (plan is null) return Results.NotFound();

    plan.Name = input.Name;
    plan.Description = input.Description;
    plan.IsTemplate = input.IsTemplate;
    db.PlanItems.RemoveRange(plan.Items);
    plan.Items = input.Items.Select(i => new PlanItem
    {
        ExerciseId = i.ExerciseId,
        Order = i.Order,
        Sets = i.Sets,
        Reps = i.Reps,
        RepDurationSeconds = i.RepDurationSeconds,
        RestBetweenSetsSeconds = i.RestBetweenSetsSeconds,
        RestAfterExerciseSeconds = i.RestAfterExerciseSeconds ?? 90,
        LoadKg = i.LoadKg,
        Notes = i.Notes,
    }).ToList();
    await db.SaveChangesAsync();
    return Results.Ok(new { plan.Id });
});

app.MapPost("/api/plans/{id:int}/duplicate", async (int id, DuplicateInput input, AppDb db) =>
{
    var source = await db.Plans.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
    if (source is null) return Results.NotFound();

    var copy = new Plan
    {
        Name = input.Name ?? $"{source.Name} (kopia)",
        Description = source.Description,
        IsTemplate = input.IsTemplate ?? source.IsTemplate,
        Items = source.Items.Select(i => new PlanItem
        {
            ExerciseId = i.ExerciseId,
            Order = i.Order,
            Sets = i.Sets,
            Reps = i.Reps,
            RepDurationSeconds = i.RepDurationSeconds,
            RestBetweenSetsSeconds = i.RestBetweenSetsSeconds,
            RestAfterExerciseSeconds = i.RestAfterExerciseSeconds,
            LoadKg = i.LoadKg,
            Notes = i.Notes,
        }).ToList(),
    };
    db.Plans.Add(copy);
    await db.SaveChangesAsync();
    return Results.Created($"/api/plans/{copy.Id}", new { copy.Id });
});

app.MapDelete("/api/plans/{id:int}", async (int id, AppDb db) =>
{
    var plan = await db.Plans.FindAsync(id);
    if (plan is null) return Results.NotFound();
    db.Plans.Remove(plan);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Przypisania ----------

app.MapGet("/api/assignments", async (AppDb db) =>
    await db.Assignments
        .OrderByDescending(a => a.CreatedAt)
        .Select(a => new
        {
            a.Id, a.PlanId, a.ClientId, a.StartDate, a.Status, a.Note, a.CreatedAt,
            PlanName = a.Plan!.Name,
            ClientName = a.Client!.Name,
        })
        .ToListAsync());

app.MapPost("/api/assignments", async (AssignmentInput input, AppDb db) =>
{
    var planExists = await db.Plans.AnyAsync(p => p.Id == input.PlanId);
    var clientExists = await db.Clients.AnyAsync(c => c.Id == input.ClientId);
    if (!planExists || !clientExists) return Results.NotFound();

    var duplicate = await db.Assignments.AnyAsync(a =>
        a.PlanId == input.PlanId && a.ClientId == input.ClientId && a.Status == "active");
    if (duplicate) return Results.Conflict(new { message = "Ten plan jest już aktywnie przypisany do tego klienta." });

    var assignment = new Assignment
    {
        PlanId = input.PlanId,
        ClientId = input.ClientId,
        StartDate = input.StartDate,
        Note = input.Note,
    };
    db.Assignments.Add(assignment);
    await db.SaveChangesAsync();
    return Results.Created($"/api/assignments/{assignment.Id}", new { assignment.Id });
});

app.MapPatch("/api/assignments/{id:int}/status", async (int id, StatusInput input, AppDb db) =>
{
    var assignment = await db.Assignments.FindAsync(id);
    if (assignment is null) return Results.NotFound();
    assignment.Status = input.Status;
    await db.SaveChangesAsync();
    return Results.Ok(new { assignment.Id, assignment.Status });
});

app.MapDelete("/api/assignments/{id:int}", async (int id, AppDb db) =>
{
    var assignment = await db.Assignments.FindAsync(id);
    if (assignment is null) return Results.NotFound();
    db.Assignments.Remove(assignment);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();
