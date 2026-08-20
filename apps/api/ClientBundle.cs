using Microsoft.EntityFrameworkCore;

namespace TrainerApp.Api;

/// <summary>
/// Przenośna kopia jednej osoby między kontami / środowiskami.
/// Id w dokumencie są źródłowe — import mapuje je na nowe.
/// </summary>
public static class ClientBundle
{
    public const string Kind = "repmaxer.client-bundle";
    public const int Version = 1;

    public static async Task<ClientBundleDocument?> BuildAsync(AppDb db, int trainerId, int clientId)
    {
        var client = await db.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clientId && c.TrainerId == trainerId);
        if (client is null) return null;

        var intake = await db.ClientIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.ClientId == clientId);
        var notes = await db.TrainerNotes.AsNoTracking()
            .Where(n => n.ClientId == clientId)
            .OrderBy(n => n.CreatedAt).ThenBy(n => n.Id)
            .ToListAsync();
        var measurements = await db.ClientMeasurements.AsNoTracking()
            .Where(m => m.ClientId == clientId)
            .OrderBy(m => m.MeasuredOn).ThenBy(m => m.Id)
            .ToListAsync();
        var checkIns = await db.ClientCheckIns.AsNoTracking()
            .Where(c => c.ClientId == clientId)
            .OrderBy(c => c.Date).ThenBy(c => c.Id)
            .ToListAsync();
        var maxes = await db.ClientMaxes.AsNoTracking()
            .Where(m => m.ClientId == clientId)
            .OrderBy(m => m.MeasuredOn).ThenBy(m => m.Id)
            .ToListAsync();
        var photos = await db.ClientProgressPhotos.AsNoTracking()
            .Where(p => p.ClientId == clientId)
            .OrderBy(p => p.TakenOn).ThenBy(p => p.Id)
            .ToListAsync();
        var assignments = await db.Assignments
            .AsNoTracking()
            .Include(a => a.DayOverrides)
            .Where(a => a.ClientId == clientId)
            .OrderBy(a => a.CreatedAt).ThenBy(a => a.Id)
            .ToListAsync();
        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .AsSplitQuery()
            .Include(s => s.Exercises).ThenInclude(e => e.Sets)
            .Include(s => s.Exercises).ThenInclude(e => e.FormCheck)
            .Where(s => s.ClientId == clientId)
            .OrderBy(s => s.PerformedOn).ThenBy(s => s.Id)
            .ToListAsync();

        var planIds = assignments.Select(a => a.PlanId)
            .Concat(sessions.Where(s => s.PlanId != null).Select(s => s.PlanId!.Value))
            .Distinct()
            .ToList();
        var plans = planIds.Count == 0
            ? []
            : await db.Plans
                .AsNoTracking()
                .AsSplitQuery()
                .Include(p => p.Days).ThenInclude(d => d.Items).ThenInclude(i => i.PrescribedSets)
                .Where(p => p.TrainerId == trainerId && planIds.Contains(p.Id))
                .OrderBy(p => p.CreatedAt).ThenBy(p => p.Id)
                .ToListAsync();

        var exerciseIds = new HashSet<int>();
        foreach (var m in maxes) exerciseIds.Add(m.ExerciseId);
        foreach (var p in plans)
        foreach (var d in p.Days)
        foreach (var i in d.Items)
            exerciseIds.Add(i.ExerciseId);
        foreach (var s in sessions)
        foreach (var e in s.Exercises)
        {
            exerciseIds.Add(e.ExerciseId);
            if (e.SubstitutedFromExerciseId is int from) exerciseIds.Add(from);
        }

        var exercises = exerciseIds.Count == 0
            ? []
            : await db.Exercises.AsNoTracking()
                .Where(e => exerciseIds.Contains(e.Id) && (e.TrainerId == null || e.TrainerId == trainerId))
                .OrderBy(e => e.Name)
                .ToListAsync();

        var portalLinks = await db.ClientAccessTokens.CountAsync(t => t.ClientId == clientId);
        var formChecks = sessions.SelectMany(s => s.Exercises).Count(e => e.FormCheck != null);

        return new ClientBundleDocument
        {
            Kind = Kind,
            Version = Version,
            ExportedAt = DateTime.UtcNow,
            Client = new ClientBundleClient
            {
                Name = client.Name,
                Email = client.Email,
                Note = client.Note,
                GoalWeightKg = client.GoalWeightKg,
                CreatedAt = client.CreatedAt,
            },
            Meta = new ClientBundleMeta
            {
                SkippedFormChecks = formChecks,
                SkippedPortalLinks = portalLinks,
                HadPortalPin = !string.IsNullOrEmpty(client.PortalPinHash),
            },
            Intake = intake is null ? null : new ClientBundleIntake
            {
                GoalType = intake.GoalType,
                GoalDetails = intake.GoalDetails,
                Injuries = intake.Injuries,
                Pains = intake.Pains,
                ChronicConditions = intake.ChronicConditions,
                Medications = intake.Medications,
                WorkType = intake.WorkType,
                StressLevel = intake.StressLevel,
                SleepHours = intake.SleepHours,
                FreeTimeActivity = intake.FreeTimeActivity,
                ExperienceLevel = intake.ExperienceLevel,
                PastActivities = intake.PastActivities,
                TrainingHistoryNotes = intake.TrainingHistoryNotes,
                SessionsPerWeek = intake.SessionsPerWeek,
                Availability = intake.Availability,
                Equipment = intake.Equipment,
                UpdatedAt = intake.UpdatedAt,
            },
            Exercises = exercises.Select(MapExercise).ToList(),
            Plans = plans.Select(MapPlan).ToList(),
            Assignments = assignments.Select(MapAssignment).ToList(),
            Sessions = sessions.Select(MapSession).ToList(),
            Maxes = maxes.Select(m => new ClientBundleMax
            {
                ExerciseId = m.ExerciseId,
                MaxKg = m.MaxKg,
                MeasuredOn = m.MeasuredOn,
                Note = m.Note,
            }).ToList(),
            Measurements = measurements.Select(m => new ClientBundleMeasurement
            {
                MeasuredOn = m.MeasuredOn,
                WeightKg = m.WeightKg,
                WaistCm = m.WaistCm,
                ChestCm = m.ChestCm,
                HipsCm = m.HipsCm,
                Note = m.Note,
                CreatedAt = m.CreatedAt,
            }).ToList(),
            CheckIns = checkIns.Select(c => new ClientBundleCheckIn
            {
                Date = c.Date,
                MoodScore = c.MoodScore,
                SleepScore = c.SleepScore,
                Note = c.Note,
                CreatedAt = c.CreatedAt,
            }).ToList(),
            TrainerNotes = notes.Select(n => new ClientBundleNote
            {
                Body = n.Body,
                PinnedAt = n.PinnedAt,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt,
            }).ToList(),
            Photos = photos.Select(p => new ClientBundlePhoto
            {
                TakenOn = p.TakenOn,
                View = p.View,
                Note = p.Note,
                ContentType = p.ContentType,
                ImageBase64 = Convert.ToBase64String(p.Bytes),
                CreatedAt = p.CreatedAt,
            }).ToList(),
        };
    }

    public static async Task<IResult> ImportAsync(ClientBundleDocument? doc, Trainer trainer, AppDb db)
    {
        var error = Validate(doc);
        if (error is not null) return error;
        var bundle = doc!;

        var name = (bundle.Client!.Name ?? "").Trim();
        if (name.Length == 0)
            return Results.BadRequest(new { message = "W kopii brakuje imienia." });

        var clientCount = await db.Clients.CountAsync(c => c.TrainerId == trainer.Id);
        var limit = BillingPlans.RejectIfAtLimit(trainer, clientCount);
        if (limit is not null) return limit;

        var warnings = new List<string>();
        var sameEmail = !string.IsNullOrWhiteSpace(bundle.Client.Email)
            && await db.Clients.AnyAsync(c =>
                c.TrainerId == trainer.Id
                && c.Email != null
                && c.Email.ToLower() == bundle.Client.Email.Trim().ToLower());
        if (sameEmail)
            warnings.Add("Na tym koncie jest już osoba z tym e-mailem — dodałem kolejną kartę.");
        else if (await db.Clients.AnyAsync(c => c.TrainerId == trainer.Id && c.Name.ToLower() == name.ToLower()))
            warnings.Add("Na tym koncie jest już osoba o tym imieniu — dodałem kolejną kartę.");

        if (bundle.Meta.SkippedPortalLinks > 0 || bundle.Meta.HadPortalPin)
            warnings.Add("Link do portalu i PIN nie przechodzą — wyślij nowy link z karty.");
        if (bundle.Meta.SkippedFormChecks > 0)
            warnings.Add($"Nagrania techniki ({bundle.Meta.SkippedFormChecks}) nie są w kopii — wrzuć je ponownie, jeśli potrzebne.");

        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            var exerciseMap = await ResolveExercisesAsync(db, trainer.Id, bundle.Exercises, warnings);
            var createdExercises = exerciseMap.Created;

            var client = new Client
            {
                TrainerId = trainer.Id,
                Name = name,
                Email = string.IsNullOrWhiteSpace(bundle.Client.Email) ? null : bundle.Client.Email.Trim(),
                Note = bundle.Client.Note,
                GoalWeightKg = bundle.Client.GoalWeightKg,
                CreatedAt = bundle.Client.CreatedAt == default ? DateTime.UtcNow : bundle.Client.CreatedAt,
            };
            db.Clients.Add(client);

            if (bundle.Intake is { } intake)
            {
                client.Intake = new ClientIntake
                {
                    GoalType = intake.GoalType,
                    GoalDetails = intake.GoalDetails,
                    Injuries = intake.Injuries,
                    Pains = intake.Pains,
                    ChronicConditions = intake.ChronicConditions,
                    Medications = intake.Medications,
                    WorkType = intake.WorkType,
                    StressLevel = intake.StressLevel,
                    SleepHours = intake.SleepHours,
                    FreeTimeActivity = intake.FreeTimeActivity,
                    ExperienceLevel = intake.ExperienceLevel,
                    PastActivities = intake.PastActivities,
                    TrainingHistoryNotes = intake.TrainingHistoryNotes,
                    SessionsPerWeek = intake.SessionsPerWeek,
                    Availability = intake.Availability,
                    Equipment = intake.Equipment,
                    UpdatedAt = intake.UpdatedAt == default ? DateTime.UtcNow : intake.UpdatedAt,
                };
            }

            foreach (var n in bundle.TrainerNotes)
            {
                if (string.IsNullOrWhiteSpace(n.Body)) continue;
                client.TrainerNotes.Add(new TrainerNote
                {
                    Body = n.Body,
                    PinnedAt = n.PinnedAt,
                    CreatedAt = n.CreatedAt == default ? DateTime.UtcNow : n.CreatedAt,
                    UpdatedAt = n.UpdatedAt,
                });
            }

            foreach (var m in bundle.Measurements)
            {
                client.Measurements.Add(new ClientMeasurement
                {
                    MeasuredOn = m.MeasuredOn,
                    WeightKg = m.WeightKg,
                    WaistCm = m.WaistCm,
                    ChestCm = m.ChestCm,
                    HipsCm = m.HipsCm,
                    Note = m.Note,
                    CreatedAt = m.CreatedAt == default ? DateTime.UtcNow : m.CreatedAt,
                });
            }

            foreach (var c in bundle.CheckIns)
            {
                client.CheckIns.Add(new ClientCheckIn
                {
                    Date = c.Date,
                    MoodScore = c.MoodScore,
                    SleepScore = c.SleepScore,
                    Note = c.Note,
                    CreatedAt = c.CreatedAt == default ? DateTime.UtcNow : c.CreatedAt,
                });
            }

            foreach (var m in bundle.Maxes)
            {
                if (!exerciseMap.BySourceId.TryGetValue(m.ExerciseId, out var ex))
                {
                    warnings.Add("Pominięto max — brak ćwiczenia w kopii.");
                    continue;
                }
                client.Maxes.Add(new ClientMax
                {
                    Exercise = ex,
                    MaxKg = m.MaxKg,
                    MeasuredOn = m.MeasuredOn,
                    Note = m.Note,
                });
            }

            var photoCount = 0;
            foreach (var p in bundle.Photos)
            {
                if (photoCount >= ProgressPhotos.MaxPerClient)
                {
                    warnings.Add($"Wgrano maksymalnie {ProgressPhotos.MaxPerClient} zdjęć sylwetki.");
                    break;
                }
                var decode = ProgressPhotos.Decode(
                    new ProgressPhotoInput(p.ImageBase64 ?? "", p.ContentType, null, p.View, p.Note),
                    out var bytes,
                    out var contentType);
                if (decode is not null)
                {
                    warnings.Add("Pominięto zdjęcie sylwetki, którego nie udało się odczytać.");
                    continue;
                }
                client.ProgressPhotos.Add(new ClientProgressPhoto
                {
                    TakenOn = p.TakenOn,
                    View = ProgressPhotos.NormalizeView(p.View),
                    Note = p.Note,
                    ContentType = contentType,
                    Bytes = bytes,
                    CreatedAt = p.CreatedAt == default ? DateTime.UtcNow : p.CreatedAt,
                });
                photoCount++;
            }

            var planMap = new Dictionary<int, Plan>();
            var dayMap = new Dictionary<int, PlanDay>();
            foreach (var src in bundle.Plans)
            {
                var plan = BuildPlan(trainer.Id, src, exerciseMap.BySourceId, dayMap, warnings);
                db.Plans.Add(plan);
                planMap[src.Id] = plan;
            }

            var assignmentMap = new Dictionary<int, Assignment>();
            foreach (var src in bundle.Assignments)
            {
                if (!planMap.TryGetValue(src.PlanId, out var plan))
                {
                    warnings.Add($"Pominięto przypisanie planu #{src.PlanId} — planu nie ma w kopii.");
                    continue;
                }
                var assignment = new Assignment
                {
                    Client = client,
                    Plan = plan,
                    StartDate = src.StartDate,
                    Note = src.Note,
                    Status = string.IsNullOrWhiteSpace(src.Status) ? "active" : src.Status,
                    CreatedAt = src.CreatedAt == default ? DateTime.UtcNow : src.CreatedAt,
                };
                foreach (var o in src.DayOverrides)
                {
                    if (!dayMap.TryGetValue(o.PlanDayId, out var day))
                    {
                        warnings.Add("Pominięto przesunięcie dnia — brak dnia planu w kopii.");
                        continue;
                    }
                    assignment.DayOverrides.Add(new AssignmentDayOverride
                    {
                        PlanDay = day,
                        Date = o.Date,
                        CreatedAt = o.CreatedAt == default ? DateTime.UtcNow : o.CreatedAt,
                    });
                }
                db.Assignments.Add(assignment);
                assignmentMap[src.Id] = assignment;
            }

            foreach (var src in bundle.Sessions)
            {
                var session = new WorkoutSession
                {
                    Client = client,
                    Assignment = src.AssignmentId is int aid && assignmentMap.TryGetValue(aid, out var a) ? a : null,
                    Plan = src.PlanId is int pid && planMap.TryGetValue(pid, out var p) ? p : null,
                    PlanDay = src.PlanDayId is int did && dayMap.TryGetValue(did, out var d) ? d : null,
                    PerformedOn = src.PerformedOn,
                    DurationSeconds = src.DurationSeconds,
                    Note = src.Note,
                    FeelingScore = src.FeelingScore,
                    SleepScore = src.SleepScore,
                    EnergyScore = src.EnergyScore,
                    TrainerComment = src.TrainerComment,
                    TrainerCommentAt = src.TrainerCommentAt,
                    ClientReply = src.ClientReply,
                    ClientReplyAt = src.ClientReplyAt,
                    ClientReplyReadAt = src.ClientReplyReadAt,
                    Status = string.IsNullOrWhiteSpace(src.Status) ? "completed" : src.Status,
                    OutOfOrder = src.OutOfOrder,
                    CreatedAt = src.CreatedAt == default ? DateTime.UtcNow : src.CreatedAt,
                };
                foreach (var e in src.Exercises.OrderBy(x => x.Order))
                {
                    if (!exerciseMap.BySourceId.TryGetValue(e.ExerciseId, out var ex))
                    {
                        warnings.Add("Pominięto ćwiczenie w treningu — brak go w kopii.");
                        continue;
                    }
                    Exercise? substituted = null;
                    if (e.SubstitutedFromExerciseId is int fromId)
                        exerciseMap.BySourceId.TryGetValue(fromId, out substituted);
                    var logged = new LoggedExercise
                    {
                        Exercise = ex,
                        SubstitutedFromExercise = substituted,
                        Order = e.Order,
                        SupersetGroup = e.SupersetGroup,
                        Note = e.Note,
                    };
                    foreach (var s in e.Sets.OrderBy(x => x.SetNumber))
                    {
                        logged.Sets.Add(new LoggedSet
                        {
                            SetNumber = s.SetNumber,
                            WeightKg = s.WeightKg,
                            Reps = s.Reps,
                            DurationSeconds = s.DurationSeconds,
                            DistanceMeters = s.DistanceMeters,
                            Rir = s.Rir,
                            Rpe = s.Rpe,
                            IsWarmup = s.IsWarmup,
                            Completed = s.Completed,
                            Note = s.Note,
                            Side = s.Side,
                        });
                    }
                    session.Exercises.Add(logged);
                }
                db.WorkoutSessions.Add(session);
            }

            await db.SaveChangesAsync();
            await tx.CommitAsync();

            return Results.Created($"/api/clients/{client.Id}", new ClientBundleImportResult(
                client.Id,
                client.Name,
                planMap.Count,
                createdExercises,
                bundle.Sessions.Count,
                warnings));
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    static IResult? Validate(ClientBundleDocument? doc)
    {
        if (doc is null)
            return Results.BadRequest(new { message = "Wgraj kopię osoby z RepMaxera." });
        if (!string.Equals(doc.Kind, Kind, StringComparison.Ordinal))
            return Results.BadRequest(new { message = "To nie jest kopia osoby z RepMaxera." });
        if (doc.Version < 1)
            return Results.BadRequest(new { message = "Ta kopia jest uszkodzona." });
        if (doc.Version > Version)
            return Results.BadRequest(new { message = "Ta kopia jest z nowszej wersji RepMaxera. Zaktualizuj aplikację." });
        if (doc.Client is null)
            return Results.BadRequest(new { message = "W kopii brakuje danych osoby." });
        return null;
    }

    static async Task<ExerciseResolution> ResolveExercisesAsync(
        AppDb db, int trainerId, List<ClientBundleExercise> snapshots, List<string> warnings)
    {
        var existing = await db.Exercises
            .Where(e => e.TrainerId == null || e.TrainerId == trainerId)
            .ToListAsync();
        var byName = new Dictionary<string, Exercise>(StringComparer.OrdinalIgnoreCase);
        foreach (var ex in existing)
        {
            var key = NormalizeName(ex.Name);
            if (key.Length == 0 || byName.ContainsKey(key)) continue;
            byName[key] = ex;
        }

        var map = new Dictionary<int, Exercise>();
        var created = 0;
        foreach (var snap in snapshots)
        {
            var key = NormalizeName(snap.Name);
            if (key.Length == 0)
            {
                warnings.Add("Pominięto ćwiczenie bez nazwy.");
                continue;
            }
            if (byName.TryGetValue(key, out var found))
            {
                map[snap.Id] = found;
                continue;
            }
            var createdEx = new Exercise
            {
                TrainerId = trainerId,
                Name = key,
                Description = snap.Description,
                Type = string.IsNullOrWhiteSpace(snap.Type) ? "reps" : snap.Type,
                DefaultSets = snap.DefaultSets,
                DefaultReps = snap.DefaultReps,
                DefaultRepDurationSeconds = snap.DefaultRepDurationSeconds,
                DefaultDistanceMeters = snap.DefaultDistanceMeters,
                DefaultRestBetweenSetsSeconds = snap.DefaultRestBetweenSetsSeconds,
                DefaultLoadKg = snap.DefaultLoadKg,
                Category = snap.Category,
                Pattern = snap.Pattern,
                IsUnilateral = snap.IsUnilateral,
                Equipment = [.. snap.Equipment],
                PrimaryMuscles = [.. snap.PrimaryMuscles],
                Instructions = snap.Instructions,
                Media = snap.Media.Select(m => new ExerciseMedia(m.YoutubeId, m.Title, m.Seconds, m.Kind)).ToList(),
            };
            db.Exercises.Add(createdEx);
            byName[key] = createdEx;
            map[snap.Id] = createdEx;
            created++;
        }
        return new ExerciseResolution(map, created);
    }

    static Plan BuildPlan(
        int trainerId,
        ClientBundlePlan src,
        IReadOnlyDictionary<int, Exercise> exercises,
        Dictionary<int, PlanDay> dayMap,
        List<string> warnings)
    {
        var plan = new Plan
        {
            TrainerId = trainerId,
            Name = string.IsNullOrWhiteSpace(src.Name) ? "Plan" : src.Name.Trim(),
            Description = src.Description,
            IsTemplate = src.IsTemplate,
            CreatedAt = src.CreatedAt == default ? DateTime.UtcNow : src.CreatedAt,
        };
        foreach (var d in src.Days.OrderBy(x => x.WeekNumber).ThenBy(x => x.Order))
        {
            var day = new PlanDay
            {
                WeekNumber = d.WeekNumber < 1 ? 1 : d.WeekNumber,
                Order = d.Order,
                Label = d.Label ?? "",
                Notes = d.Notes,
                DayOfWeek = d.DayOfWeek,
            };
            foreach (var i in d.Items.OrderBy(x => x.Order))
            {
                if (!exercises.TryGetValue(i.ExerciseId, out var ex))
                {
                    warnings.Add($"Pominięto pozycję w planie „{plan.Name}” — brak ćwiczenia w kopii.");
                    continue;
                }
                var item = new PlanItem
                {
                    Exercise = ex,
                    Order = i.Order,
                    SupersetGroup = i.SupersetGroup,
                    IsWarmup = i.IsWarmup,
                    MeasureType = i.MeasureType,
                    Sets = i.Sets,
                    Reps = i.Reps,
                    RepsMax = i.RepsMax,
                    RepDurationSeconds = i.RepDurationSeconds,
                    RepDurationSecondsMax = i.RepDurationSecondsMax,
                    DistanceMeters = i.DistanceMeters,
                    Tempo = i.Tempo,
                    TargetRpe = i.TargetRpe,
                    TargetRir = i.TargetRir,
                    SetScheme = i.SetScheme,
                    RestBetweenSetsSeconds = i.RestBetweenSetsSeconds,
                    RestAfterExerciseSeconds = i.RestAfterExerciseSeconds,
                    LoadKg = i.LoadKg,
                    LoadPercent = i.LoadPercent,
                    Notes = i.Notes,
                };
                foreach (var s in i.PrescribedSets.OrderBy(x => x.Order))
                {
                    item.PrescribedSets.Add(new PlanSet
                    {
                        Order = s.Order,
                        Reps = s.Reps,
                        RepsMax = s.RepsMax,
                        DurationSeconds = s.DurationSeconds,
                        DistanceMeters = s.DistanceMeters,
                        LoadKg = s.LoadKg,
                        LoadPercent = s.LoadPercent,
                        PercentOf = s.PercentOf,
                        TargetRpe = s.TargetRpe,
                        TargetRir = s.TargetRir,
                        Tempo = s.Tempo,
                        Role = s.Role,
                        Note = s.Note,
                        RestSeconds = s.RestSeconds,
                    });
                }
                day.Items.Add(item);
            }
            plan.Days.Add(day);
            dayMap[d.Id] = day;
        }
        return plan;
    }

    static ClientBundleExercise MapExercise(Exercise e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Description = e.Description,
        Type = e.Type,
        DefaultSets = e.DefaultSets,
        DefaultReps = e.DefaultReps,
        DefaultRepDurationSeconds = e.DefaultRepDurationSeconds,
        DefaultDistanceMeters = e.DefaultDistanceMeters,
        DefaultRestBetweenSetsSeconds = e.DefaultRestBetweenSetsSeconds,
        DefaultLoadKg = e.DefaultLoadKg,
        Category = e.Category,
        Pattern = e.Pattern,
        IsUnilateral = e.IsUnilateral,
        Equipment = [.. e.Equipment],
        PrimaryMuscles = [.. e.PrimaryMuscles],
        Instructions = e.Instructions,
        Media = e.Media.Select(m => new ClientBundleMedia(m.YoutubeId, m.Title, m.Seconds, m.Kind)).ToList(),
    };

    static ClientBundlePlan MapPlan(Plan p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        IsTemplate = p.IsTemplate,
        CreatedAt = p.CreatedAt,
        Days = p.Days.OrderBy(d => d.WeekNumber).ThenBy(d => d.Order).Select(d => new ClientBundleDay
        {
            Id = d.Id,
            WeekNumber = d.WeekNumber,
            Order = d.Order,
            Label = d.Label,
            Notes = d.Notes,
            DayOfWeek = d.DayOfWeek,
            Items = d.Items.OrderBy(i => i.Order).Select(i => new ClientBundleItem
            {
                ExerciseId = i.ExerciseId,
                Order = i.Order,
                SupersetGroup = i.SupersetGroup,
                IsWarmup = i.IsWarmup,
                MeasureType = i.MeasureType,
                Sets = i.Sets,
                Reps = i.Reps,
                RepsMax = i.RepsMax,
                RepDurationSeconds = i.RepDurationSeconds,
                RepDurationSecondsMax = i.RepDurationSecondsMax,
                DistanceMeters = i.DistanceMeters,
                Tempo = i.Tempo,
                TargetRpe = i.TargetRpe,
                TargetRir = i.TargetRir,
                SetScheme = i.SetScheme,
                RestBetweenSetsSeconds = i.RestBetweenSetsSeconds,
                RestAfterExerciseSeconds = i.RestAfterExerciseSeconds,
                LoadKg = i.LoadKg,
                LoadPercent = i.LoadPercent,
                Notes = i.Notes,
                PrescribedSets = i.PrescribedSets.OrderBy(s => s.Order).Select(s => new ClientBundleSet
                {
                    Order = s.Order,
                    Reps = s.Reps,
                    RepsMax = s.RepsMax,
                    DurationSeconds = s.DurationSeconds,
                    DistanceMeters = s.DistanceMeters,
                    LoadKg = s.LoadKg,
                    LoadPercent = s.LoadPercent,
                    PercentOf = s.PercentOf,
                    TargetRpe = s.TargetRpe,
                    TargetRir = s.TargetRir,
                    Tempo = s.Tempo,
                    Role = s.Role,
                    Note = s.Note,
                    RestSeconds = s.RestSeconds,
                }).ToList(),
            }).ToList(),
        }).ToList(),
    };

    static ClientBundleAssignment MapAssignment(Assignment a) => new()
    {
        Id = a.Id,
        PlanId = a.PlanId,
        StartDate = a.StartDate,
        Note = a.Note,
        Status = a.Status,
        CreatedAt = a.CreatedAt,
        DayOverrides = a.DayOverrides.Select(o => new ClientBundleDayOverride
        {
            PlanDayId = o.PlanDayId,
            Date = o.Date,
            CreatedAt = o.CreatedAt,
        }).ToList(),
    };

    static ClientBundleSession MapSession(WorkoutSession s) => new()
    {
        AssignmentId = s.AssignmentId,
        PlanId = s.PlanId,
        PlanDayId = s.PlanDayId,
        PerformedOn = s.PerformedOn,
        DurationSeconds = s.DurationSeconds,
        Note = s.Note,
        FeelingScore = s.FeelingScore,
        SleepScore = s.SleepScore,
        EnergyScore = s.EnergyScore,
        TrainerComment = s.TrainerComment,
        TrainerCommentAt = s.TrainerCommentAt,
        ClientReply = s.ClientReply,
        ClientReplyAt = s.ClientReplyAt,
        ClientReplyReadAt = s.ClientReplyReadAt,
        Status = s.Status,
        OutOfOrder = s.OutOfOrder,
        CreatedAt = s.CreatedAt,
        Exercises = s.Exercises.OrderBy(e => e.Order).Select(e => new ClientBundleLoggedExercise
        {
            ExerciseId = e.ExerciseId,
            SubstitutedFromExerciseId = e.SubstitutedFromExerciseId,
            Order = e.Order,
            SupersetGroup = e.SupersetGroup,
            Note = e.Note,
            Sets = e.Sets.OrderBy(x => x.SetNumber).Select(x => new ClientBundleLoggedSet
            {
                SetNumber = x.SetNumber,
                WeightKg = x.WeightKg,
                Reps = x.Reps,
                DurationSeconds = x.DurationSeconds,
                DistanceMeters = x.DistanceMeters,
                Rir = x.Rir,
                Rpe = x.Rpe,
                IsWarmup = x.IsWarmup,
                Completed = x.Completed,
                Note = x.Note,
                Side = x.Side,
            }).ToList(),
        }).ToList(),
    };

    static string NormalizeName(string? name) =>
        string.IsNullOrWhiteSpace(name)
            ? ""
            : string.Join(' ', name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    sealed record ExerciseResolution(Dictionary<int, Exercise> BySourceId, int Created);
}

public sealed class ClientBundleDocument
{
    public string Kind { get; init; } = "";
    public int Version { get; init; }
    public DateTime ExportedAt { get; init; }
    public ClientBundleClient? Client { get; init; }
    public ClientBundleMeta Meta { get; init; } = new();
    public ClientBundleIntake? Intake { get; init; }
    public List<ClientBundleExercise> Exercises { get; init; } = [];
    public List<ClientBundlePlan> Plans { get; init; } = [];
    public List<ClientBundleAssignment> Assignments { get; init; } = [];
    public List<ClientBundleSession> Sessions { get; init; } = [];
    public List<ClientBundleMax> Maxes { get; init; } = [];
    public List<ClientBundleMeasurement> Measurements { get; init; } = [];
    public List<ClientBundleCheckIn> CheckIns { get; init; } = [];
    public List<ClientBundleNote> TrainerNotes { get; init; } = [];
    public List<ClientBundlePhoto> Photos { get; init; } = [];
}

public sealed class ClientBundleClient
{
    public string Name { get; init; } = "";
    public string? Email { get; init; }
    public string? Note { get; init; }
    public double? GoalWeightKg { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class ClientBundleMeta
{
    public int SkippedFormChecks { get; init; }
    public int SkippedPortalLinks { get; init; }
    public bool HadPortalPin { get; init; }
}

public sealed class ClientBundleIntake
{
    public string? GoalType { get; init; }
    public string? GoalDetails { get; init; }
    public string? Injuries { get; init; }
    public string? Pains { get; init; }
    public string? ChronicConditions { get; init; }
    public string? Medications { get; init; }
    public string? WorkType { get; init; }
    public int? StressLevel { get; init; }
    public string? SleepHours { get; init; }
    public string? FreeTimeActivity { get; init; }
    public string? ExperienceLevel { get; init; }
    public string? PastActivities { get; init; }
    public string? TrainingHistoryNotes { get; init; }
    public int? SessionsPerWeek { get; init; }
    public string? Availability { get; init; }
    public string? Equipment { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class ClientBundleExercise
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string Type { get; init; } = "reps";
    public int DefaultSets { get; init; } = 3;
    public int DefaultReps { get; init; } = 10;
    public int? DefaultRepDurationSeconds { get; init; }
    public int? DefaultDistanceMeters { get; init; }
    public int DefaultRestBetweenSetsSeconds { get; init; } = 60;
    public double? DefaultLoadKg { get; init; }
    public string? Category { get; init; }
    public string? Pattern { get; init; }
    public bool IsUnilateral { get; init; }
    public List<string> Equipment { get; init; } = [];
    public List<string> PrimaryMuscles { get; init; } = [];
    public string? Instructions { get; init; }
    public List<ClientBundleMedia> Media { get; init; } = [];
}

public record ClientBundleMedia(string YoutubeId, string Title = "", int? Seconds = null, string Kind = "demo");

public sealed class ClientBundlePlan
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public bool IsTemplate { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<ClientBundleDay> Days { get; init; } = [];
}

public sealed class ClientBundleDay
{
    public int Id { get; init; }
    public int WeekNumber { get; init; } = 1;
    public int Order { get; init; }
    public string Label { get; init; } = "";
    public string? Notes { get; init; }
    public int? DayOfWeek { get; init; }
    public List<ClientBundleItem> Items { get; init; } = [];
}

public sealed class ClientBundleItem
{
    public int ExerciseId { get; init; }
    public int Order { get; init; }
    public int? SupersetGroup { get; init; }
    public bool IsWarmup { get; init; }
    public string? MeasureType { get; init; }
    public int? Sets { get; init; }
    public int? Reps { get; init; }
    public int? RepsMax { get; init; }
    public int? RepDurationSeconds { get; init; }
    public int? RepDurationSecondsMax { get; init; }
    public int? DistanceMeters { get; init; }
    public string? Tempo { get; init; }
    public double? TargetRpe { get; init; }
    public double? TargetRir { get; init; }
    public string? SetScheme { get; init; }
    public int? RestBetweenSetsSeconds { get; init; }
    public int RestAfterExerciseSeconds { get; init; } = 90;
    public double? LoadKg { get; init; }
    public double? LoadPercent { get; init; }
    public string? Notes { get; init; }
    public List<ClientBundleSet> PrescribedSets { get; init; } = [];
}

public sealed class ClientBundleSet
{
    public int Order { get; init; }
    public int? Reps { get; init; }
    public int? RepsMax { get; init; }
    public int? DurationSeconds { get; init; }
    public int? DistanceMeters { get; init; }
    public double? LoadKg { get; init; }
    public double? LoadPercent { get; init; }
    public string? PercentOf { get; init; }
    public double? TargetRpe { get; init; }
    public double? TargetRir { get; init; }
    public string? Tempo { get; init; }
    public string? Role { get; init; }
    public string? Note { get; init; }
    public int? RestSeconds { get; init; }
}

public sealed class ClientBundleAssignment
{
    public int Id { get; init; }
    public int PlanId { get; init; }
    public DateOnly StartDate { get; init; }
    public string? Note { get; init; }
    public string Status { get; init; } = "active";
    public DateTime CreatedAt { get; init; }
    public List<ClientBundleDayOverride> DayOverrides { get; init; } = [];
}

public sealed class ClientBundleDayOverride
{
    public int PlanDayId { get; init; }
    public DateOnly Date { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class ClientBundleSession
{
    public int? AssignmentId { get; init; }
    public int? PlanId { get; init; }
    public int? PlanDayId { get; init; }
    public DateOnly PerformedOn { get; init; }
    public int? DurationSeconds { get; init; }
    public string? Note { get; init; }
    public int? FeelingScore { get; init; }
    public int? SleepScore { get; init; }
    public int? EnergyScore { get; init; }
    public string? TrainerComment { get; init; }
    public DateTime? TrainerCommentAt { get; init; }
    public string? ClientReply { get; init; }
    public DateTime? ClientReplyAt { get; init; }
    public DateTime? ClientReplyReadAt { get; init; }
    public string Status { get; init; } = "completed";
    public bool OutOfOrder { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<ClientBundleLoggedExercise> Exercises { get; init; } = [];
}

public sealed class ClientBundleLoggedExercise
{
    public int ExerciseId { get; init; }
    public int? SubstitutedFromExerciseId { get; init; }
    public int Order { get; init; }
    public int? SupersetGroup { get; init; }
    public string? Note { get; init; }
    public List<ClientBundleLoggedSet> Sets { get; init; } = [];
}

public sealed class ClientBundleLoggedSet
{
    public int SetNumber { get; init; }
    public double? WeightKg { get; init; }
    public int? Reps { get; init; }
    public int? DurationSeconds { get; init; }
    public int? DistanceMeters { get; init; }
    public double? Rir { get; init; }
    public double? Rpe { get; init; }
    public bool IsWarmup { get; init; }
    public bool Completed { get; init; }
    public string? Note { get; init; }
    public string? Side { get; init; }
}

public sealed class ClientBundleMax
{
    public int ExerciseId { get; init; }
    public double MaxKg { get; init; }
    public DateOnly MeasuredOn { get; init; }
    public string? Note { get; init; }
}

public sealed class ClientBundleMeasurement
{
    public DateOnly MeasuredOn { get; init; }
    public double? WeightKg { get; init; }
    public double? WaistCm { get; init; }
    public double? ChestCm { get; init; }
    public double? HipsCm { get; init; }
    public string? Note { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class ClientBundleCheckIn
{
    public DateOnly Date { get; init; }
    public int? MoodScore { get; init; }
    public int? SleepScore { get; init; }
    public string? Note { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class ClientBundleNote
{
    public string Body { get; init; } = "";
    public DateTime? PinnedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public sealed class ClientBundlePhoto
{
    public DateOnly TakenOn { get; init; }
    public string View { get; init; } = "front";
    public string? Note { get; init; }
    public string ContentType { get; init; } = "image/jpeg";
    public string ImageBase64 { get; init; } = "";
    public DateTime CreatedAt { get; init; }
}

public record ClientBundleImportResult(
    int ClientId,
    string Name,
    int CreatedPlans,
    int CreatedExercises,
    int SessionCount,
    List<string> Warnings);
