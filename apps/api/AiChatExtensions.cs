using System.ClientModel;
using Microsoft.Extensions.AI;
using OpenAI;

namespace TrainerApp.Api;

public static class AiChatExtensions
{
    /// <summary>
    /// Rejestruje <see cref="IChatClient"/> wskazujący na OpenRouter (OpenAI-compatible).
    /// Bez klucza rejestruje stub — endpoint importu zwróci 503.
    /// </summary>
    public static void AddOpenRouterChatClient(this WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<IChatClient>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var apiKey = config["Ai:OpenRouterApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return new UnavailableChatClient();

            var baseUrl = config["Ai:BaseUrl"] ?? "https://openrouter.ai/api/v1";
            var model = config["Ai:Model"] ?? "google/gemini-3.1-flash-lite";
            var options = new OpenAIClientOptions { Endpoint = new Uri(baseUrl) };
            return new OpenAI.Chat.ChatClient(model, new ApiKeyCredential(apiKey), options)
                .AsIChatClient();
        });
    }
}

/// <summary>Stub gdy brak klucza OpenRouter — GetResponseAsync rzuca jasny wyjątek.</summary>
public sealed class UnavailableChatClient : IChatClient
{
    public const string Message =
        "Brak klucza AI (Ai:OpenRouterApiKey). Ustaw User Secrets lub zmienną Ai__OpenRouterApiKey.";

    public ChatClientMetadata Metadata { get; } = new("unavailable");

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException(Message);

    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException(Message);

    public object? GetService(Type serviceType, object? serviceKey = null) => null;

    public void Dispose() { }
}
