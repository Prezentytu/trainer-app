namespace TrainerApp.Api;

public record ClientInput(string Name, string? Email, string? Note, double? GoalWeightKg = null);

public record ClientIntakeInput(
    string? GoalType = null,
    string? GoalDetails = null,
    string? Injuries = null,
    string? Pains = null,
    string? ChronicConditions = null,
    string? Medications = null,
    string? WorkType = null,
    int? StressLevel = null,
    string? SleepHours = null,
    string? FreeTimeActivity = null,
    string? ExperienceLevel = null,
    string? PastActivities = null,
    string? TrainingHistoryNotes = null,
    int? SessionsPerWeek = null,
    string? Availability = null,
    string? Equipment = null);

public record ExerciseMediaInput(
    string YoutubeId,
    string Title = "",
    int? Seconds = null,
    string Kind = "demo");

public record ExerciseInput(
    string Name,
    string? Description = null,
    string Type = "reps",
    int DefaultSets = 3,
    int DefaultReps = 10,
    int? DefaultRepDurationSeconds = null,
    int? DefaultDistanceMeters = null,
    int DefaultRestBetweenSetsSeconds = 60,
    double? DefaultLoadKg = null,
    string? Category = null,
    string? Pattern = null,
    bool IsUnilateral = false,
    List<string>? Equipment = null,
    List<string>? PrimaryMuscles = null,
    string? Instructions = null,
    List<ExerciseMediaInput>? Media = null);

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
    double? LoadPercent = null,
    string? Notes = null,
    List<PlanSetInput>? PrescribedSets = null);

public record PlanDayInput(
    int WeekNumber = 1,
    int Order = 0,
    string Label = "",
    string? Notes = null,
    int? DayOfWeek = null,
    List<PlanItemInput>? Items = null);

public record PlanDayRescheduleInput(DateOnly Date);

public record PlanInput(
    string Name,
    string? Description = null,
    bool IsTemplate = false,
    List<PlanDayInput>? Days = null);

public record AssignmentInput(int PlanId, int ClientId, DateOnly StartDate, string? Note);

public record DuplicateInput(string? Name, bool? IsTemplate);

public record StatusInput(string Status);

public record ClientMaxInput(int ExerciseId, double MaxKg, DateOnly MeasuredOn, string? Note = null);

public record ClientMaxUpdateInput(double MaxKg, DateOnly MeasuredOn, string? Note = null);

public record PlanFromHistoryInput(double TopKgDelta = 2.5, int SinceDays = 120);

public record ExerciseRemapInput(int TargetExerciseId);

public record ClientMeasurementInput(
    DateOnly MeasuredOn,
    double? WeightKg = null,
    double? WaistCm = null,
    double? ChestCm = null,
    double? HipsCm = null,
    string? Note = null);

public record TrainerNoteInput(string Body, bool Pinned = false);

public record SessionCheckinInput(int? FeelingScore, int? SleepScore, int? EnergyScore);

public record LoggedSetInput(
    int? Id = null,
    int SetNumber = 1,
    double? WeightKg = null,
    int? Reps = null,
    int? DurationSeconds = null,
    int? DistanceMeters = null,
    double? Rir = null,
    double? Rpe = null,
    bool IsWarmup = false,
    bool Completed = false,
    string? Note = null,
    string? Side = null);

public record LoggedExerciseInput(
    int? Id = null,
    int ExerciseId = 0,
    int Order = 0,
    string? Note = null,
    int? SubstitutedFromExerciseId = null,
    List<LoggedSetInput>? Sets = null);

public record ClientCheckInInput(
    int? MoodScore = null,
    int? SleepScore = null,
    string? Note = null,
    DateOnly? Date = null);

public record SessionCommentInput(string Comment);

public record SendPortalLinkInput(string? Message = null);

public record RecoverPortalLinkInput(string Email);

public record SendReminderInput(string? Message = null);

public record FoundingApplyInput(
    string Name,
    string Email,
    string? Phone = null,
    string? PreferredSlot = null,
    string Track = "whiteglove");

public record PushSubscriptionInput(string Endpoint, string P256dh, string Auth);

public record WorkoutSessionInput(
    int ClientId,
    DateOnly PerformedOn,
    int? AssignmentId = null,
    int? PlanDayId = null,
    int? PlanId = null,
    int? DurationSeconds = null,
    string? Note = null,
    string Status = "completed",
    List<LoggedExerciseInput>? Exercises = null);

public record StartSessionInput(
    int ClientId,
    int? AssignmentId = null,
    int? PlanDayId = null,
    int? PlanId = null,
    DateOnly? PerformedOn = null,
    /// <summary>Prefill z ukończonej sesji tego klienta (Powtórz ostatni).</summary>
    int? RepeatSessionId = null);

public record PlanImportRequest(string Text, List<int>? Weeks = null);

public record PlanImportDraft(
    string? Name = null,
    string? Description = null,
    List<PlanImportDay>? Days = null,
    List<string>? Warnings = null,
    List<int>? FailedWeeks = null);

public record PlanImportDay(
    int WeekNumber = 1,
    int Order = 0,
    string Label = "",
    string? Notes = null,
    List<PlanImportItem>? Items = null);

public record PlanImportItem(
    string ExerciseName = "",
    int? MatchedExerciseId = null,
    int Order = 0,
    int? SupersetGroup = null,
    bool IsWarmup = false,
    string? MeasureType = null,
    int? Sets = null,
    int? Reps = null,
    int? RepsMax = null,
    int? RepDurationSeconds = null,
    int? DistanceMeters = null,
    string? Tempo = null,
    double? TargetRpe = null,
    double? TargetRir = null,
    string? SetScheme = null,
    int? RestBetweenSetsSeconds = null,
    int? RestAfterExerciseSeconds = null,
    double? LoadKg = null,
    double? LoadPercent = null,
    string? Notes = null,
    List<PlanSetInput>? PrescribedSets = null);

public record HistoryImportImage(string MimeType, string Base64);

public record HistoryImportRequest(string? Text = null, List<HistoryImportImage>? Images = null);

public record HistoryImportSet(int Reps = 0, double? WeightKg = null, bool IsBodyweight = false);

public record HistoryImportExercise(
    string ExerciseName = "",
    int? MatchedExerciseId = null,
    int Order = 0,
    List<HistoryImportSet>? Sets = null);

public record HistoryImportSession(
    string? PerformedOn = null,
    string? Label = null,
    string? StartedAt = null,
    string? EndedAt = null,
    int? DurationSeconds = null,
    int? SummarySets = null,
    int? SummaryReps = null,
    double? SummaryVolumeKg = null,
    List<HistoryImportExercise>? Exercises = null);

public record HistoryImportDraft(
    List<HistoryImportSession>? Sessions = null,
    List<string>? Warnings = null);

public record HistoryImportApplyInput(
    bool SaveHistory = true,
    bool SaveMaxes = false,
    List<WorkoutSessionInput>? Sessions = null,
    List<ClientMaxInput>? Maxes = null);

public record HistoryImportAnalyzeInput(
    List<HistoryImportSession>? Sessions = null,
    string? ClientName = null,
    double TopKgDelta = 2.5);

public record HistoryImportSuggestedMax(
    int ExerciseId,
    string ExerciseName,
    double MaxKg,
    string MeasuredOn);

public record HistoryImportClusterDto(
    string Key,
    string Label,
    List<string> ExerciseNames,
    bool LastIsTest,
    string? LatestFullDate,
    int SessionCount);

public record HistoryImportAnalyzeResult(
    List<HistoryImportClusterDto> Clusters,
    List<HistoryImportSuggestedMax> SuggestedMaxes,
    bool HasTestWeek,
    PlanImportDraft PlanDraft);

public record TrainerPreferencesInput(
    bool? NotifyDailySummary = null,
    bool? NotifyClientReply = null,
    bool? NotifyWeeklyDigest = null);

public record BillingCheckoutInput(string PlanKey);

public record ClientsImportInput(string Csv);

public record PortalPinInput(string? Pin);

public record AccessTokenExpireInput(int? Days);

public record PortalUnlockInput(string Pin);

public record ProgressPhotoInput(
    string ImageBase64,
    string? ContentType = "image/jpeg",
    string? TakenOn = null,
    string? View = "front",
    string? Note = null);

