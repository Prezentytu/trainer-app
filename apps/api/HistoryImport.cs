using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;

namespace TrainerApp.Api;

public static class HistoryImport
{
    public const int MaxImages = 15;
    public const int MaxTextChars = 80_000;
    public const int MaxImageBytes = 1_800_000;

    public static readonly JsonSerializerOptions JsonOptions = PlanImport.JsonOptions;

    public static readonly JsonElement ResponseSchema = JsonSerializer.Deserialize<JsonElement>("""
    {
      "type": "object",
      "additionalProperties": false,
      "required": ["sessions"],
      "properties": {
        "sessions": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["exercises"],
            "properties": {
              "performedOn": { "type": "string" },
              "label": { "type": "string" },
              "startedAt": { "type": "string" },
              "endedAt": { "type": "string" },
              "durationSeconds": { "type": ["integer", "null"] },
              "summarySets": { "type": ["integer", "null"] },
              "summaryReps": { "type": ["integer", "null"] },
              "summaryVolumeKg": { "type": ["number", "null"] },
              "exercises": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["exerciseName", "order", "sets"],
                  "properties": {
                    "exerciseName": { "type": "string" },
                    "matchedExerciseId": { "type": ["integer", "null"] },
                    "order": { "type": "integer" },
                    "sets": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "required": ["reps"],
                        "properties": {
                          "reps": { "type": "integer" },
                          "weightKg": { "type": ["number", "null"] },
                          "isBodyweight": { "type": "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    """)!;

    static readonly Dictionary<string, string[]> Aliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["wyciskanie żołnierskie"] = ["ohp", "military press", "wyciskanie żołnierskie sztangi stojąc"],
        ["wyciskanie żołnierskie sztangi stojąc"] = ["ohp", "military press"],
        ["martwy ciąg na prostych nogach"] = ["rdl", "stiff-leg", "rumunski"],
        ["przysiad ze sztangą na barkach"] = ["back squat", "przysiad"],
        ["wyciskanie sztangi na płaskiej ławce"] = ["bench press", "ławka"],
        ["wiosłowanie sztangą podchwytem"] = ["barbell row", "wiosłowanie"],
        ["podciąganie z obciążeniem"] = ["weighted pull-up", "podciąganie"],
        ["pompki na poręczach"] = ["dips", "dip"],
        ["powell raise"] = ["powell"],
    };

    public static string BuildPrompt(string? text, IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var libLines = library.Count == 0
            ? "(pusta biblioteka)"
            : string.Join("\n", library.Select(e => $"- id={e.Id}; name=\"{e.Name}\"; type={e.Type}"));

        var extra = string.IsNullOrWhiteSpace(text) ? "" : $"\n\nTEKST / OCR POMOCNICZY:\n{text.Trim()}";

        return $$"""
ZADANIE: To są PODSUMOWANIA WYKONANYCH TRENINGÓW (logi), nie plan na przyszłość.
Odczytaj z obrazów i/lub tekstu każdą sesję: datę, etykietę dnia (np. 01/02/03), ćwiczenia i serie.
Format serii: „8 x 30kg” = 8 powtórzeń na 30 kg (jedna seria). Przecinek = kolejna seria.
0 kg przy pompach/podciąganiu = masa ciała (isBodyweight=true, weightKg=0).
Data w formacie DD.MM.YYYY lub YYYY-MM-DD → performedOn jako YYYY-MM-DD.
Jeśli karta podaje liczbę serii (np. Serie: 24), użyj jej jako summarySets do weryfikacji.
matchedExerciseId ustaw gdy nazwa jednoznacznie pasuje do biblioteki; inaczej null.
Zwróć WYŁĄCZNIE JSON zgodny ze schematem. Bez markdown.

BIBLIOTEKA:
{{libLines}}
{{extra}}
""";
    }

    public static List<ChatMessage> BuildMessages(
        string prompt,
        IReadOnlyList<HistoryImportImage> images)
    {
        var contents = new List<AIContent> { new TextContent(prompt) };
        foreach (var img in images)
        {
            var mime = NormalizeMime(img.MimeType);
            if (mime is null) continue;
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(img.Base64);
            }
            catch (FormatException)
            {
                continue;
            }
            if (bytes.Length == 0 || bytes.Length > MaxImageBytes) continue;
            contents.Add(new DataContent(bytes, mime));
        }
        return
        [
            new ChatMessage(ChatRole.System,
                "Jesteś asystentem trenera personalnego. Odpowiadasz TYLKO poprawnym JSON-em, bez markdown. To są logi wykonanych sesji."),
            new ChatMessage(ChatRole.User, contents),
        ];
    }

    static string? NormalizeMime(string? mime)
    {
        var m = (mime ?? "").Trim().ToLowerInvariant();
        return m is "image/jpeg" or "image/jpg" or "image/png" or "image/webp" or "image/gif"
            ? (m == "image/jpg" ? "image/jpeg" : m)
            : null;
    }

    public static bool TryDeserializeDraft(string? raw, out HistoryImportDraft? draft, out string? error)
    {
        draft = null;
        error = null;
        var json = PlanImport.StripJsonFences(raw);
        if (json is null)
        {
            error = string.IsNullOrWhiteSpace(raw) ? "pusta odpowiedź" : "brak obiektu JSON w odpowiedzi";
            return false;
        }
        try
        {
            draft = JsonSerializer.Deserialize<HistoryImportDraft>(json, JsonOptions);
            if (draft is null)
            {
                error = "deserializacja zwróciła null";
                return false;
            }
            return true;
        }
        catch (JsonException ex)
        {
            error = ex.Message.Length > 200 ? ex.Message[..200] : ex.Message;
            return false;
        }
    }

    public static HistoryImportDraft NormalizeAndMatch(
        HistoryImportDraft draft,
        IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var sessions = (draft.Sessions ?? [])
            .Select((s, i) => NormalizeSession(s, i, library))
            .Where(s => (s.Exercises?.Count ?? 0) > 0)
            .OrderBy(s => s.PerformedOn ?? "9999")
            .ToList();
        var warnings = draft.Warnings?.ToList() ?? [];
        foreach (var s in sessions)
        {
            var counted = s.Exercises!.Sum(e => e.Sets?.Count ?? 0);
            if (s.SummarySets is int expected && expected > 0 && Math.Abs(expected - counted) > 1)
            {
                var when = FormatDatePl(s.PerformedOn);
                if (string.IsNullOrEmpty(when)) when = s.Label ?? "Trening";
                warnings.Add($"{when}: na zdjęciu {expected} {SerieWord(expected)}, tu {counted} — sprawdź.");
            }
        }
        return new HistoryImportDraft(sessions, warnings);
    }

    static string FormatDatePl(string? iso)
    {
        if (DateOnly.TryParse(iso, out var d))
            return d.ToString("d MMMM yyyy", new CultureInfo("pl-PL"));
        return iso ?? "";
    }

    static string SerieWord(int n)
    {
        var abs = Math.Abs(n) % 100;
        var last = abs % 10;
        if (abs == 1) return "seria";
        if (last is >= 2 and <= 4 && abs is < 12 or > 14) return "serie";
        return "serii";
    }

    static HistoryImportSession NormalizeSession(
        HistoryImportSession s,
        int index,
        IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var exercises = (s.Exercises ?? [])
            .Select((e, i) => NormalizeExercise(e, i, library))
            .Where(e => !string.IsNullOrWhiteSpace(e.ExerciseName) && (e.Sets?.Count ?? 0) > 0)
            .ToList();
        return s with
        {
            PerformedOn = NormalizeDate(s.PerformedOn),
            Label = string.IsNullOrWhiteSpace(s.Label) ? null : s.Label.Trim(),
            Exercises = exercises,
            DurationSeconds = s.DurationSeconds is > 0 and < 86_400 ? s.DurationSeconds : null,
        };
    }

    static HistoryImportExercise NormalizeExercise(
        HistoryImportExercise e,
        int index,
        IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var name = Regex.Replace(e.ExerciseName?.Trim() ?? "", @"\s+", " ");
        var matched = e.MatchedExerciseId;
        if (matched is null || library.All(x => x.Id != matched))
            matched = MatchExerciseId(name, library);
        var sets = (e.Sets ?? [])
            .Select(NormalizeSet)
            .Where(x => x.Reps >= 1)
            .ToList();
        return e with
        {
            ExerciseName = name,
            MatchedExerciseId = matched,
            Order = e.Order < 1 ? index + 1 : e.Order,
            Sets = sets,
        };
    }

    static HistoryImportSet NormalizeSet(HistoryImportSet s)
    {
        var reps = Math.Clamp(s.Reps, 0, 100);
        var kg = s.WeightKg is null ? (double?)null : Math.Clamp(s.WeightKg.Value, 0, 1000);
        var bw = s.IsBodyweight || kg == 0;
        double? weight = bw ? 0 : kg;
        return new HistoryImportSet(reps, weight, bw);
    }

    public static int? MatchExerciseId(string exerciseName, IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var direct = PlanImport.MatchExerciseId(exerciseName, library);
        if (direct is not null) return direct;
        var q = NormalizeName(exerciseName);
        foreach (var (key, aliases) in Aliases)
        {
            if (q.Contains(NormalizeName(key)) || aliases.Any(a => q.Contains(NormalizeName(a))))
            {
                var hit = PlanImport.MatchExerciseId(key, library)
                    ?? aliases.Select(a => PlanImport.MatchExerciseId(a, library)).FirstOrDefault(id => id != null);
                if (hit is not null) return hit;
            }
        }
        return null;
    }

    static string NormalizeName(string name) =>
        Regex.Replace(name.Trim().ToLowerInvariant(), @"\s+", " ");

    static string? NormalizeDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var t = raw.Trim();
        if (DateOnly.TryParseExact(t,
                ["yyyy-MM-dd", "dd.MM.yyyy", "d.M.yyyy", "dd/MM/yyyy", "d/M/yyyy"],
                CultureInfo.InvariantCulture, DateTimeStyles.None, out var exact))
            return exact.ToString("yyyy-MM-dd");
        var m = Regex.Match(t, @"(\d{1,2})[./](\d{1,2})[./](\d{4})");
        if (m.Success
            && int.TryParse(m.Groups[1].Value, out var d)
            && int.TryParse(m.Groups[2].Value, out var mo)
            && int.TryParse(m.Groups[3].Value, out var y)
            && d is >= 1 and <= 31 && mo is >= 1 and <= 12)
        {
            try { return new DateOnly(y, mo, d).ToString("yyyy-MM-dd"); }
            catch (ArgumentOutOfRangeException) { return null; }
        }
        if (t.Contains('-') && DateOnly.TryParse(t, CultureInfo.InvariantCulture, DateTimeStyles.None, out var iso))
            return iso.ToString("yyyy-MM-dd");
        return null;
    }

    /// <summary>Lista serii: `8 x 30kg, 8 x 35` = powtórzenia × kg na serię.</summary>
    public static List<HistoryImportSet>? ParseSetList(string raw)
    {
        var text = raw.Trim();
        if (string.IsNullOrEmpty(text)) return null;
        var hasKg = Regex.IsMatch(text, @"\bkg\b", RegexOptions.IgnoreCase);
        var parts = Regex.Split(text, @"\s*[,;]\s+")
            .Select(p => p.Trim())
            .Where(p => p.Length > 0)
            .ToList();
        if (parts.Count == 0) return null;
        if (!hasKg && parts.Count < 2) return null;

        var sets = new List<HistoryImportSet>();
        var token = new Regex(@"^(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*kg)?$", RegexOptions.IgnoreCase);
        foreach (var part in parts)
        {
            var m = token.Match(part);
            if (!m.Success) return null;
            if (!int.TryParse(m.Groups[1].Value, out var reps) || reps < 1) return null;
            if (!double.TryParse(m.Groups[2].Value.Replace(',', '.'), NumberStyles.Float,
                    CultureInfo.InvariantCulture, out var kg))
                return null;
            var bw = kg == 0;
            sets.Add(new HistoryImportSet(reps, bw ? 0 : kg, bw));
        }
        return sets.Count > 0 ? sets : null;
    }

    public static HistoryImportDraft? ParseCsv(string csv)
    {
        var lines = csv.Replace("\r\n", "\n").Split('\n')
            .Select(l => l.TrimEnd())
            .Where(l => l.Length > 0)
            .ToList();
        if (lines.Count < 2) return null;
        var header = SplitCsvLine(lines[0]).Select(h => h.Trim().ToLowerInvariant()).ToList();
        var snake = header.Contains("exercise_title") && header.Contains("weight_kg");
        var spaced = header.Contains("exercise name") && header.Contains("weight");
        if (!snake && !spaced) return null;

        string Col(List<string> row, params string[] names)
        {
            foreach (var n in names)
            {
                var i = header.IndexOf(n);
                if (i >= 0 && i < row.Count) return row[i].Trim();
            }
            return "";
        }

        var grouped = new Dictionary<string, HistoryImportSession>(StringComparer.Ordinal);
        foreach (var line in lines.Skip(1))
        {
            var row = SplitCsvLine(line);
            if (row.Count == 0) continue;
            var title = snake ? Col(row, "title") : Col(row, "workout name");
            var start = snake ? Col(row, "start_time") : Col(row, "date");
            var exName = snake ? Col(row, "exercise_title") : Col(row, "exercise name");
            var weightRaw = snake ? Col(row, "weight_kg") : Col(row, "weight");
            var repsRaw = Col(row, "reps");
            if (string.IsNullOrWhiteSpace(exName)) continue;
            var date = NormalizeDate(start.Length >= 10 ? start[..10] : start)
                ?? NormalizeDate(start);
            var key = $"{date}|{title}";
            if (!grouped.TryGetValue(key, out var session))
            {
                session = new HistoryImportSession(date, string.IsNullOrWhiteSpace(title) ? null : title, Exercises: []);
                grouped[key] = session;
            }
            var exercises = session.Exercises!;
            var ex = exercises.FirstOrDefault(e =>
                string.Equals(e.ExerciseName, exName, StringComparison.OrdinalIgnoreCase));
            if (ex is null)
            {
                ex = new HistoryImportExercise(exName, null, exercises.Count + 1, []);
                exercises.Add(ex);
            }
            int.TryParse(repsRaw, out var reps);
            double.TryParse(weightRaw.Replace(',', '.'), NumberStyles.Float, CultureInfo.InvariantCulture, out var kg);
            var bw = kg == 0 && (exName.Contains("podciąg", StringComparison.OrdinalIgnoreCase)
                || exName.Contains("pull", StringComparison.OrdinalIgnoreCase)
                || exName.Contains("dip", StringComparison.OrdinalIgnoreCase)
                || exName.Contains("pomp", StringComparison.OrdinalIgnoreCase));
            ex.Sets!.Add(new HistoryImportSet(Math.Max(reps, 1), bw ? 0 : kg, bw));
        }

        var sessions = grouped.Values
            .Where(s => (s.Exercises?.Count ?? 0) > 0)
            .OrderBy(s => s.PerformedOn ?? "")
            .ToList();
        return sessions.Count == 0 ? null : new HistoryImportDraft(sessions, []);
    }

    static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var cur = new System.Text.StringBuilder();
        var inQuotes = false;
        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    cur.Append('"');
                    i++;
                }
                else inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(cur.ToString());
                cur.Clear();
            }
            else cur.Append(c);
        }
        result.Add(cur.ToString());
        return result;
    }

    public sealed record DayCluster(
        string Key,
        string Label,
        IReadOnlyList<string> ExerciseNames,
        IReadOnlyList<HistoryImportSession> Sessions,
        bool LastIsTest,
        HistoryImportSession LatestFull);

    public static List<DayCluster> ClusterDays(IReadOnlyList<HistoryImportSession> sessions)
    {
        var clusters = new List<(HashSet<string> Names, List<HistoryImportSession> Sessions, string Label)>();
        foreach (var s in sessions.OrderBy(x => x.PerformedOn ?? ""))
        {
            var names = new HashSet<string>(
                (s.Exercises ?? []).Select(e => NormalizeName(e.ExerciseName)),
                StringComparer.Ordinal);
            if (names.Count == 0) continue;
            var best = -1;
            var bestScore = 0.0;
            for (var i = 0; i < clusters.Count; i++)
            {
                var score = Jaccard(names, clusters[i].Names);
                if (score > bestScore)
                {
                    bestScore = score;
                    best = i;
                }
            }
            var labelHint = s.Label?.Trim();
            if (best >= 0 && bestScore >= 0.45)
            {
                foreach (var n in names) clusters[best].Names.Add(n);
                clusters[best].Sessions.Add(s);
            }
            else
            {
                clusters.Add((names, [s], labelHint is { Length: > 0 } ? labelHint : $"Dzień {clusters.Count + 1}"));
            }
        }

        return clusters.Select((c, i) =>
        {
            var ordered = c.Sessions.OrderBy(s => s.PerformedOn ?? "").ToList();
            var last = ordered[^1];
            var lastIsTest = IsTestSession(last, ordered);
            var latestFull = lastIsTest
                ? ordered.LastOrDefault(s => !IsTestSession(s, ordered)) ?? last
                : last;
            return new DayCluster(
                $"d{i + 1}",
                c.Label,
                c.Names.OrderBy(x => x).ToList(),
                ordered,
                lastIsTest,
                latestFull);
        }).ToList();
    }

    static double Jaccard(HashSet<string> a, HashSet<string> b)
    {
        if (a.Count == 0 && b.Count == 0) return 1;
        var inter = a.Intersect(b, StringComparer.Ordinal).Count();
        var union = a.Union(b, StringComparer.Ordinal).Count();
        return union == 0 ? 0 : (double)inter / union;
    }

    public static bool IsTestSession(HistoryImportSession session, IReadOnlyList<HistoryImportSession> cluster)
    {
        var exCount = session.Exercises?.Count ?? 0;
        if (exCount == 0) return false;
        var sets = session.Exercises!.SelectMany(e => e.Sets ?? []).ToList();
        if (sets.Count == 0) return false;
        var singles = sets.Count(s => s.Reps <= 2);
        var medianEx = cluster.Count == 0
            ? exCount
            : cluster.Select(s => s.Exercises?.Count ?? 0).OrderBy(n => n).ElementAt(cluster.Count / 2);
        if (exCount <= 2 && singles >= sets.Count * 0.4) return true;
        if (exCount <= Math.Max(2, medianEx / 2) && singles >= sets.Count * 0.5) return true;
        return false;
    }

    public static List<(int ExerciseId, string ExerciseName, double MaxKg, string MeasuredOn)> SuggestMaxes(
        IReadOnlyList<HistoryImportSession> sessions)
    {
        var best = new Dictionary<int, (string Name, double E1, double Weight, string Date)>();
        foreach (var s in sessions)
        {
            var date = s.PerformedOn ?? "1970-01-01";
            foreach (var ex in s.Exercises ?? [])
            {
                if (ex.MatchedExerciseId is not int id) continue;
                foreach (var set in ex.Sets ?? [])
                {
                    if (set.IsBodyweight || set.WeightKg is null or <= 0) continue;
                    var e1 = Stats.Epley1Rm(set.WeightKg, set.Reps);
                    if (e1 is null) continue;
                    if (!best.TryGetValue(id, out var prev) || e1.Value > prev.E1)
                        best[id] = (ex.ExerciseName, e1.Value, set.WeightKg.Value, date);
                }
            }
        }
        return best.Select(kv => (
            kv.Key,
            kv.Value.Name,
            Stats.Epley1RmDisplay(kv.Value.Weight, 1) is double one && kv.Value.E1 <= kv.Value.Weight * 1.01
                ? kv.Value.Weight
                : Math.Round(kv.Value.E1 * 2) / 2.0,
            kv.Value.Date)).ToList();
    }

    public static PlanImportDraft BuildPlanDraft(
        IReadOnlyList<DayCluster> clusters,
        double topKgDelta,
        string clientName)
    {
        var days = new List<PlanImportDay>();
        var order = 1;
        foreach (var c in clusters)
        {
            var source = c.LatestFull;
            var items = (source.Exercises ?? []).Select((e, i) =>
            {
                var sets = (e.Sets ?? []).Select((s, si) => new PlanSetInput(
                    Order: si + 1,
                    Reps: s.Reps,
                    LoadKg: s.IsBodyweight ? 0 : ShiftKg(s.WeightKg, topKgDelta, IsTopSet(e.Sets!, si)),
                    Role: InferRole(e.Sets!, si),
                    Note: s.IsBodyweight ? "BW" : null)).ToList();
                return new PlanImportItem(
                    ExerciseName: e.ExerciseName,
                    MatchedExerciseId: e.MatchedExerciseId,
                    Order: i + 1,
                    Sets: sets.Count,
                    Reps: sets.FirstOrDefault()?.Reps,
                    LoadKg: sets.LastOrDefault(x => x.Role == "top")?.LoadKg ?? sets.LastOrDefault()?.LoadKg,
                    PrescribedSets: sets);
            }).ToList();
            days.Add(new PlanImportDay(1, order, c.Label, null, items));
            order++;
        }
        return new PlanImportDraft(
            Name: $"Plan — {clientName} — kolejny cykl",
            Description: clusters.Any(c => c.LastIsTest)
                ? "Baza: ostatni pełny dzień (nie tydzień testu)."
                : null,
            Days: days);
    }

    public static HistoryImportAnalyzeResult Analyze(
        IReadOnlyList<HistoryImportSession> sessions,
        string clientName,
        double topKgDelta)
    {
        var clusters = ClusterDays(sessions);
        var maxes = SuggestMaxes(sessions);
        var plan = BuildPlanDraft(clusters, topKgDelta, string.IsNullOrWhiteSpace(clientName) ? "klient" : clientName.Trim());
        return new HistoryImportAnalyzeResult(
            clusters.Select(c => new HistoryImportClusterDto(
                c.Key,
                c.Label,
                c.ExerciseNames.ToList(),
                c.LastIsTest,
                c.LatestFull.PerformedOn,
                c.Sessions.Count)).ToList(),
            maxes.Select(m => new HistoryImportSuggestedMax(m.ExerciseId, m.ExerciseName, m.MaxKg, m.MeasuredOn)).ToList(),
            clusters.Any(c => c.LastIsTest),
            plan);
    }

    static bool IsTopSet(List<HistoryImportSet> sets, int index)
    {
        var loads = sets.Select(s => s.WeightKg ?? 0).ToList();
        var max = loads.Max();
        return Math.Abs(loads[index] - max) < 0.01;
    }

    static double? ShiftKg(double? kg, double delta, bool isTop)
    {
        if (kg is null) return null;
        if (!isTop || delta == 0) return kg;
        return Math.Round((kg.Value + delta) * 2) / 2.0;
    }

    static string? InferRole(List<HistoryImportSet> sets, int index)
    {
        if (sets.Count < 3) return "work";
        var loads = sets.Select(s => s.WeightKg ?? 0).ToList();
        var max = loads.Max();
        var maxIdx = loads.LastIndexOf(max);
        if (index < maxIdx && loads[index] < max) return "ramp";
        if (index == maxIdx) return "top";
        if (index > maxIdx) return "backoff";
        return "work";
    }

    public static async Task<(HistoryImportDraft? Draft, IResult? Error)> ImportAsync(
        HistoryImportRequest input,
        IReadOnlyList<(int Id, string Name, string Type)> library,
        IChatClient chatClient,
        ILogger logger,
        CancellationToken ct)
    {
        var text = input.Text?.Trim() ?? "";
        var images = (input.Images ?? [])
            .Where(i => !string.IsNullOrWhiteSpace(i.Base64))
            .Take(MaxImages)
            .ToList();

        if (text.Length > MaxTextChars)
            return (null, Results.BadRequest(new { message = "Tekst jest za długi." }));

        if (text.Length >= 20)
        {
            var csv = ParseCsv(text);
            if (csv?.Sessions is { Count: > 0 })
                return (NormalizeAndMatch(csv, library), null);
        }

        if (images.Count == 0 && text.Length < 10)
            return (null, Results.BadRequest(new { message = "Wklej tekst treningu albo wrzuć screeny." }));

        if (chatClient is UnavailableChatClient)
            return (null, Results.Json(new { message = UnavailableChatClient.Message }, statusCode: 503));

        var prompt = BuildPrompt(text.Length >= 10 ? text : null, library);
        var messages = BuildMessages(prompt, images);
        var schemaOptions = new ChatOptions
        {
            Temperature = 0.1f,
            ResponseFormat = ChatResponseFormat.ForJsonSchema(
                ResponseSchema, "history_import_draft", "Odczytane sesje treningowe"),
            MaxOutputTokens = 16_000,
        };
        var jsonOptions = new ChatOptions
        {
            Temperature = 0.1f,
            ResponseFormat = ChatResponseFormat.Json,
            MaxOutputTokens = 16_000,
        };

        ChatOptions active = schemaOptions;
        string? lastError = null;
        for (var attempt = 0; attempt < 3; attempt++)
        {
            ChatResponse response;
            try
            {
                response = await chatClient.GetResponseAsync(messages, active, ct);
            }
            catch (System.ClientModel.ClientResultException ex) when (ex.Status == 400 && ReferenceEquals(active, schemaOptions))
            {
                logger.LogWarning("History import: json_schema rejected, fallback json_object. {Error}", ex.Message);
                active = jsonOptions;
                attempt--;
                continue;
            }

            var raw = response.Text ?? "";
            if (response.FinishReason == ChatFinishReason.Length)
            {
                lastError = "Odpowiedź AI została ucięta limitem długości.";
                continue;
            }
            if (TryDeserializeDraft(raw, out var draft, out var parseError) && draft is not null)
                return (NormalizeAndMatch(draft, library), null);

            lastError = "Nie rozpoznałem treningów. Spróbuj inne zdjęcie albo wklej tekst.";
            logger.LogWarning("History import parse failed ({ParseError}). Preview: {Raw}",
                parseError, raw.Length > 400 ? raw[..400] : raw);
            messages.Add(new ChatMessage(ChatRole.Assistant, raw));
            messages.Add(new ChatMessage(ChatRole.User,
                $"JSON niepoprawny: {parseError}. Zwróć wyłącznie poprawiony JSON zgodny ze schematem."));
        }

        return (null, Results.Json(new { message = lastError ?? "Nie rozpoznałem treningów. Spróbuj inne zdjęcie albo wklej tekst." }, statusCode: 422));
    }
}
