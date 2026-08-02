using System.Runtime.CompilerServices;
using Microsoft.Extensions.AI;

namespace TrainerApp.Api.Tests;

/// <summary>Deterministyczny IChatClient do testów — zwraca stały JSON bez sieci.</summary>
public sealed class FakeChatClient : IChatClient
{
    private readonly string _responseText;

    public FakeChatClient(string responseText) => _responseText = responseText;

    public ChatClientMetadata Metadata { get; } = new("fake");

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var msg = new ChatMessage(ChatRole.Assistant, _responseText);
        return Task.FromResult(new ChatResponse(msg));
    }

    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        yield return new ChatResponseUpdate(ChatRole.Assistant, _responseText);
        await Task.CompletedTask;
    }

    public object? GetService(Type serviceType, object? serviceKey = null) => null;

    public void Dispose() { }
}
