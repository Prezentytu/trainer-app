using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Microsoft.Extensions.AI;

namespace TrainerApp.Api.Tests;

/// <summary>
/// Deterministyczny IChatClient do testów — bez sieci.
/// Tryby:
/// 1) kolejka odpowiedzi (kolejne GetResponseAsync),
/// 2) mapa tydzień → kolejka (bezpieczne przy równoległym chunkingu).
/// </summary>
public sealed class FakeChatClient : IChatClient
{
    private readonly List<string>? _queue;
    private readonly Dictionary<int, List<string>>? _byWeek;
    private readonly Dictionary<int, int> _byWeekIndex = new();
    private readonly List<ChatFinishReason?> _finishReasons;
    private int _index;
    private readonly object _lock = new();

    public FakeChatClient(string responseText)
        : this([responseText])
    {
    }

    public FakeChatClient(
        IEnumerable<string> responses,
        IEnumerable<ChatFinishReason?>? finishReasons = null)
    {
        _queue = responses.ToList();
        if (_queue.Count == 0) _queue.Add("{}");
        _finishReasons = finishReasons?.ToList() ?? [];
    }

    /// <summary>Jedna stała odpowiedź per numer tygodnia (wykrywany z promptu).</summary>
    public FakeChatClient(IReadOnlyDictionary<int, string> byWeek)
    {
        _byWeek = byWeek.ToDictionary(kv => kv.Key, kv => new List<string> { kv.Value });
        _finishReasons = [];
    }

    /// <summary>Kolejka odpowiedzi per tydzień (np. retry: śmieci → poprawny JSON).</summary>
    public FakeChatClient(IReadOnlyDictionary<int, IEnumerable<string>> byWeekQueues)
    {
        _byWeek = byWeekQueues.ToDictionary(kv => kv.Key, kv => kv.Value.ToList());
        foreach (var kv in _byWeek)
            if (kv.Value.Count == 0) kv.Value.Add("{}");
        _finishReasons = [];
    }

    public ChatClientMetadata Metadata { get; } = new("fake");

    public int CallCount { get; private set; }

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            CallCount++;
            string text;
            ChatFinishReason finish = ChatFinishReason.Stop;

            if (_byWeek is not null)
            {
                var prompt = string.Join("\n", messages.Select(m => m.Text ?? ""));
                var m = Regex.Match(prompt, @"TYDZIE[NŃ]\s+(\d+)", RegexOptions.IgnoreCase);
                var week = m.Success ? int.Parse(m.Groups[1].Value) : 0;
                if (!_byWeek.TryGetValue(week, out var list) || list.Count == 0)
                {
                    // Fallback: pierwsza dostępna lista albo pusty obiekt
                    list = _byWeek.Values.FirstOrDefault() ?? ["{}"];
                }

                _byWeekIndex.TryGetValue(week, out var wi);
                var idx = Math.Min(wi, list.Count - 1);
                _byWeekIndex[week] = wi + 1;
                text = list[idx];
            }
            else
            {
                var idx = Math.Min(_index, _queue!.Count - 1);
                text = _queue[idx];
                finish = idx < _finishReasons.Count
                    ? _finishReasons[idx] ?? ChatFinishReason.Stop
                    : ChatFinishReason.Stop;
                _index++;
            }

            var msg = new ChatMessage(ChatRole.Assistant, text);
            return Task.FromResult(new ChatResponse(msg) { FinishReason = finish });
        }
    }

    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var response = await GetResponseAsync(messages, options, cancellationToken);
        yield return new ChatResponseUpdate(ChatRole.Assistant, response.Text)
        {
            FinishReason = response.FinishReason,
        };
    }

    public object? GetService(Type serviceType, object? serviceKey = null) => null;

    public void Dispose() { }
}
