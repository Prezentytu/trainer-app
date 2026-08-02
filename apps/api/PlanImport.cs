using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace TrainerApp.Api;

public static class PlanImport
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static string BuildPrompt(string text, IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var libLines = library.Count == 0
            ? "(pusta biblioteka)"
            : string.Join("\n", library.Select(e => $"- id={e.Id}; name=\"{e.Name}\"; type={e.Type}"));

        return $$"""
ZADANIE: Przeanalizuj tekst planu treningowego (polski) i zwróć WYŁĄCZNIE poprawny JSON zgodny ze schematem poniżej.
Nie dodawaj markdown, komentarzy ani tekstu poza JSON.

BIBLIOTEKA ĆWICZEŃ (dopasuj matchedExerciseId gdy nazwa jest bliska; inaczej null):
{{libLines}}

TEKST PLANU:
---BEGIN---
{{text.Trim()}}
---END---

REGUŁY:
1. „TYDZIEŃ N" → weekNumber = N. Dni: „Trening A/B/C/B1…" → label.
2. Pozycje z numeracją „1.", „3a/b.", „2/3.", „4a/b/c." — rozbij superserie na osobne items z tym samym supersetGroup (1-based w obrębie dnia).
3. „Nazwa1/Nazwa2" w superserii → dwa exerciseName.
4. „NxM" / „NxM-K" → sets, reps, repsMax. Czas: „10-15s" → measureType=time, repDurationSeconds/Max.
5. „Rampa N (X kg) + BO P%: Y kg (A-B powt.)":
   - setScheme = „rampa → NRM + BO P%"
   - prescribedSets: [{order:1, role:"ramp", reps:N, loadKg:X}, {order:2, role:"backoff", reps:A, repsMax:B, loadPercent:P, percentOf:"top", loadKg:Y opcjonalnie}]
   - sets = liczba prescribedSets
6. „Rampa N" bez BO → setScheme „rampa → NRM", bez prescribedSets (lub jedna seria ramp).
7. „ciężar +1kg", „ciężary z T5", „Finał/Rekord" → notes (nie zmyślaj liczb).
8. Tempo typu 3110 → tempo. RIR → targetRir.
9. name planu: krótka nazwa z zakresu tygodni jeśli widać (np. „Tydzień 5–6").

SCHEMAT JSON:
{
  "name": "string|null",
  "description": "string|null",
  "days": [
    {
      "weekNumber": 1,
      "order": 1,
      "label": "Trening A",
      "notes": null,
      "items": [
        {
          "exerciseName": "High bar squat",
          "matchedExerciseId": null,
          "order": 1,
          "supersetGroup": null,
          "isWarmup": false,
          "measureType": "reps",
          "sets": 2,
          "reps": null,
          "repsMax": null,
          "repDurationSeconds": null,
          "distanceMeters": null,
          "tempo": null,
          "targetRpe": null,
          "targetRir": null,
          "setScheme": "rampa → 3RM + BO 80%",
          "restBetweenSetsSeconds": null,
          "restAfterExerciseSeconds": null,
          "loadKg": 47.5,
          "loadPercent": null,
          "notes": null,
          "prescribedSets": [
            { "order": 1, "reps": 3, "repsMax": null, "durationSeconds": null, "distanceMeters": null, "loadKg": 47.5, "loadPercent": null, "percentOf": null, "targetRpe": null, "targetRir": null, "tempo": null, "role": "ramp", "note": null },
            { "order": 2, "reps": 5, "repsMax": 10, "durationSeconds": null, "distanceMeters": null, "loadKg": 38, "loadPercent": 80, "percentOf": "top", "targetRpe": null, "targetRir": null, "tempo": null, "role": "backoff", "note": null }
          ]
        }
      ]
    }
  ]
}
""";
    }

    public static string? StripJsonFences(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var text = raw.Trim();
        if (text.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNl = text.IndexOf('\n');
            if (firstNl >= 0) text = text[(firstNl + 1)..];
            var fence = text.LastIndexOf("```", StringComparison.Ordinal);
            if (fence >= 0) text = text[..fence];
            text = text.Trim();
        }
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start) return null;
        return text[start..(end + 1)];
    }

    public static PlanImportDraft? DeserializeDraft(string? raw)
    {
        var json = StripJsonFences(raw);
        if (json is null) return null;
        try
        {
            return JsonSerializer.Deserialize<PlanImportDraft>(json, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static PlanImportDraft NormalizeAndMatch(
        PlanImportDraft draft,
        IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var days = (draft.Days ?? [])
            .Select((d, di) => NormalizeDay(d, di, library))
            .Where(d => (d.Items?.Count ?? 0) > 0 || !string.IsNullOrWhiteSpace(d.Label))
            .ToList();

        var name = string.IsNullOrWhiteSpace(draft.Name) ? SuggestName(days) : draft.Name!.Trim();
        return draft with
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(draft.Description) ? null : draft.Description.Trim(),
            Days = days,
        };
    }

    static string SuggestName(List<PlanImportDay> days)
    {
        if (days.Count == 0) return "Zaimportowany plan";
        var weeks = days.Select(d => d.WeekNumber).Distinct().OrderBy(w => w).ToList();
        if (weeks.Count == 1) return $"Tydzień {weeks[0]}";
        return $"Tydzień {weeks.First()}–{weeks.Last()}";
    }

    static PlanImportDay NormalizeDay(
        PlanImportDay d,
        int index,
        IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var week = d.WeekNumber < 1 ? 1 : d.WeekNumber;
        var order = d.Order < 1 ? index + 1 : d.Order;
        var label = string.IsNullOrWhiteSpace(d.Label) ? $"Dzień {order}" : d.Label.Trim();
        var items = (d.Items ?? [])
            .Select((it, ii) => NormalizeItem(it, ii, library))
            .Where(it => !string.IsNullOrWhiteSpace(it.ExerciseName))
            .ToList();
        return d with
        {
            WeekNumber = week,
            Order = order,
            Label = label,
            Notes = string.IsNullOrWhiteSpace(d.Notes) ? null : d.Notes.Trim(),
            Items = items,
        };
    }

    static PlanImportItem NormalizeItem(
        PlanImportItem it,
        int index,
        IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        var name = Regex.Replace(it.ExerciseName?.Trim() ?? "", @"\s+", " ");
        var matched = it.MatchedExerciseId;
        if (matched is null || library.All(e => e.Id != matched))
            matched = MatchExerciseId(name, library);

        var measure = NormalizeMeasure(it.MeasureType);
        var sets = ClampNullable(it.Sets, 1, 30);
        var reps = ClampNullable(it.Reps, 1, 100);
        var repsMax = ClampNullable(it.RepsMax, 1, 100);
        if (repsMax is not null && reps is not null && repsMax < reps) repsMax = reps;

        var prescribed = (it.PrescribedSets ?? [])
            .Select((s, si) => NormalizeSet(s, si))
            .ToList();

        // Jeśli AI podało BO w setScheme, a nie rozpisało serii — dobuduj proste prescribedSets.
        if (prescribed.Count == 0 && it.SetScheme is { } scheme)
        {
            var auto = TryBuildRampSets(scheme, it.LoadKg);
            if (auto is { Count: > 0 })
            {
                prescribed = auto;
                sets = auto.Count;
            }
        }

        if (prescribed.Count > 0)
            sets = prescribed.Count;

        return it with
        {
            ExerciseName = name,
            MatchedExerciseId = matched,
            Order = it.Order < 1 ? index + 1 : it.Order,
            MeasureType = measure,
            Sets = sets,
            Reps = reps,
            RepsMax = repsMax,
            RepDurationSeconds = ClampNullable(it.RepDurationSeconds, 1, 3600),
            DistanceMeters = ClampNullable(it.DistanceMeters, 1, 100_000),
            Tempo = string.IsNullOrWhiteSpace(it.Tempo) ? null : it.Tempo.Trim().ToUpperInvariant(),
            TargetRpe = ClampDouble(it.TargetRpe, 1, 10),
            TargetRir = ClampDouble(it.TargetRir, 0, 10),
            SetScheme = string.IsNullOrWhiteSpace(it.SetScheme) ? null : it.SetScheme.Trim(),
            RestBetweenSetsSeconds = ClampNullable(it.RestBetweenSetsSeconds, 0, 600),
            RestAfterExerciseSeconds = ClampNullable(it.RestAfterExerciseSeconds, 0, 600),
            LoadKg = ClampDouble(it.LoadKg, 0, 1000),
            LoadPercent = ClampDouble(it.LoadPercent, 1, 100),
            Notes = string.IsNullOrWhiteSpace(it.Notes) ? null : it.Notes.Trim(),
            PrescribedSets = prescribed,
        };
    }

    static PlanSetInput NormalizeSet(PlanSetInput s, int index) =>
        s with
        {
            Order = s.Order < 1 ? index + 1 : s.Order,
            Reps = ClampNullable(s.Reps, 1, 100),
            RepsMax = ClampNullable(s.RepsMax, 1, 100),
            DurationSeconds = ClampNullable(s.DurationSeconds, 1, 3600),
            DistanceMeters = ClampNullable(s.DistanceMeters, 1, 100_000),
            LoadKg = ClampDouble(s.LoadKg, 0, 1000),
            LoadPercent = ClampDouble(s.LoadPercent, 1, 100),
            PercentOf = NormalizePercentOf(s.PercentOf),
            TargetRpe = ClampDouble(s.TargetRpe, 1, 10),
            TargetRir = ClampDouble(s.TargetRir, 0, 10),
            Tempo = string.IsNullOrWhiteSpace(s.Tempo) ? null : s.Tempo.Trim().ToUpperInvariant(),
            Role = NormalizeRole(s.Role),
            Note = string.IsNullOrWhiteSpace(s.Note) ? null : s.Note.Trim(),
        };

    public static int? MatchExerciseId(string exerciseName, IReadOnlyList<(int Id, string Name, string Type)> library)
    {
        if (string.IsNullOrWhiteSpace(exerciseName) || library.Count == 0) return null;
        var q = NormalizeName(exerciseName);
        if (q.Length == 0) return null;

        var exact = library.FirstOrDefault(e => NormalizeName(e.Name) == q);
        if (!string.IsNullOrEmpty(exact.Name) && NormalizeName(exact.Name) == q)
            return exact.Id;

        var fuzzy = library
            .Select(e => (e.Id, Norm: NormalizeName(e.Name)))
            .Where(e => e.Norm.Length > 0 &&
                        (e.Norm.Contains(q, StringComparison.Ordinal) ||
                         q.Contains(e.Norm, StringComparison.Ordinal)))
            .OrderBy(e => e.Norm.StartsWith(q, StringComparison.Ordinal) ? 0 : 1)
            .ThenBy(e => e.Norm.Length)
            .Select(e => (int?)e.Id)
            .FirstOrDefault();

        return fuzzy;
    }

    static string NormalizeName(string name) =>
        Regex.Replace(name.Trim().ToLowerInvariant(), @"\s+", " ");

    static string? NormalizeMeasure(string? m) =>
        m?.Trim().ToLowerInvariant() switch
        {
            "reps" or "powt" or "powtórzenia" => "reps",
            "time" or "czas" => "time",
            "distance" or "dystans" => "distance",
            _ => m is null ? null : "reps",
        };

    static string? NormalizePercentOf(string? p) =>
        p?.Trim().ToLowerInvariant() switch
        {
            "1rm" or "rm" => "1rm",
            "top" => "top",
            _ => null,
        };

    static string? NormalizeRole(string? r) =>
        r?.Trim().ToLowerInvariant() switch
        {
            "warmup" or "rozgrzewka" => "warmup",
            "ramp" or "rampa" => "ramp",
            "top" => "top",
            "backoff" or "bo" => "backoff",
            "work" or "robocza" => "work",
            _ => r is null ? null : r.Trim().ToLowerInvariant(),
        };

    static List<PlanSetInput>? TryBuildRampSets(string setScheme, double? loadKg)
    {
        var m = Regex.Match(
            setScheme,
            @"rampa\s*[→\->]+\s*(\d+)\s*RM(?:\s*\+\s*BO\s*(\d+(?:\.\d+)?)\s*%)?",
            RegexOptions.IgnoreCase);
        if (!m.Success) return null;
        var target = int.Parse(m.Groups[1].Value);
        var sets = new List<PlanSetInput>
        {
            new(Order: 1, Reps: target, LoadKg: loadKg, Role: "ramp", Note: $"ustal {target}RM"),
        };
        if (m.Groups[2].Success && double.TryParse(m.Groups[2].Value.Replace(',', '.'),
                System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out var pct))
        {
            sets.Add(new PlanSetInput(
                Order: 2, Reps: 5, RepsMax: 10, LoadPercent: pct, PercentOf: "top",
                Role: "backoff", Note: "seria anaboliczna"));
        }
        return sets;
    }

    static int? ClampNullable(int? v, int min, int max) =>
        v is null ? null : Math.Clamp(v.Value, min, max);

    static double? ClampDouble(double? v, double min, double max) =>
        v is null ? null : Math.Clamp(v.Value, min, max);
}
