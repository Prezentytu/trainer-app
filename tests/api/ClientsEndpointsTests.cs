using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class ClientsEndpointsTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public ClientsEndpointsTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    private record ClientDto(int Id, string Name, string? Email, string? Note, int ActivePlans, string? LastSessionOn);
    private record CreatedClient(int Id, string Name, string? Email, string? Note);

    [Fact]
    public async Task GetClients_ReturnsSeededClient()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientDto>>("/api/clients");

        Assert.NotNull(clients);
        var jan = Assert.Single(clients!, c => c.Name == "Jan Kowalski");
        // Seed ma ukończoną sesję — lastSessionOn musi być obecne (ISO data).
        Assert.False(string.IsNullOrWhiteSpace(jan.LastSessionOn));
    }

    [Fact]
    public async Task GetClients_NewClient_HasNullLastSessionOn()
    {
        var post = await _client.PostAsJsonAsync(
            "/api/clients",
            new { name = "Bez sesji", email = (string?)null, note = (string?)null });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var clients = await _client.GetFromJsonAsync<List<ClientDto>>("/api/clients");
        var row = Assert.Single(clients!, c => c.Name == "Bez sesji");
        Assert.Null(row.LastSessionOn);
    }

    [Fact]
    public async Task CreateClient_ThenAppearsInList()
    {
        var input = new { name = "Anna Nowak", email = "anna@example.com", note = "cel: redukcja" };

        var post = await _client.PostAsJsonAsync("/api/clients", input);
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var created = await post.Content.ReadFromJsonAsync<CreatedClient>();
        Assert.NotNull(created);
        Assert.True(created!.Id > 0);
        Assert.Equal("Anna Nowak", created.Name);

        var clients = await _client.GetFromJsonAsync<List<ClientDto>>("/api/clients");
        Assert.Contains(clients!, c => c.Name == "Anna Nowak");
    }

    [Fact]
    public async Task GetClientById_Missing_ReturnsNotFound()
    {
        var res = await _client.GetAsync("/api/clients/999999");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task DeleteClient_ThenGoneFromDetails()
    {
        var post = await _client.PostAsJsonAsync(
            "/api/clients",
            new { name = "Do usunięcia", email = (string?)null, note = (string?)null });
        var created = await post.Content.ReadFromJsonAsync<CreatedClient>();
        Assert.NotNull(created);

        var del = await _client.DeleteAsync($"/api/clients/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var res = await _client.GetAsync($"/api/clients/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
