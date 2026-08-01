using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TrainerApp.Api.Tests;

public class MeasurementsTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public MeasurementsTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Measurements_CrudForOwnedClient()
    {
        var clients = await _client.GetFromJsonAsync<List<ClientRow>>("/api/clients");
        var jan = clients!.First(c => c.Name == "Jan Kowalski");

        var listRes = await _client.GetAsync($"/api/clients/{jan.Id}/measurements");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var initial = await listRes.Content.ReadFromJsonAsync<List<MeasurementRow>>();
        Assert.NotNull(initial);

        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var post = await _client.PostAsJsonAsync($"/api/clients/{jan.Id}/measurements", new
        {
            measuredOn = today,
            weightKg = 81.5,
            waistCm = 84.0,
        });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        var created = await post.Content.ReadFromJsonAsync<IdRow>();
        Assert.NotNull(created);

        var listAfter = await _client.GetFromJsonAsync<List<MeasurementRow>>($"/api/clients/{jan.Id}/measurements");
        Assert.Contains(listAfter!, m => m.Id == created!.Id && m.WeightKg == 81.5);

        var del = await _client.DeleteAsync($"/api/measurements/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);
    }

    [Fact]
    public async Task PortalMeasurement_PostForDemoToken()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var post = await _client.PostAsJsonAsync("/api/portal/demo-jan-kowalski/measurements", new
        {
            measuredOn = today,
            weightKg = 80.0,
        });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var list = await _client.GetFromJsonAsync<List<MeasurementRow>>("/api/portal/demo-jan-kowalski/measurements");
        Assert.NotNull(list);
        Assert.Contains(list!, m => m.WeightKg == 80.0);
    }

    private record ClientRow(int Id, string Name);
    private record MeasurementRow(int Id, int ClientId, string MeasuredOn, double? WeightKg, double? WaistCm);
    private record IdRow(int Id);
}
