using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Infrastructure.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace EvidenceGraph.Tests;

public class ApiEndpointsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private static readonly string DbName = "IntegrationTestingDb_" + Guid.NewGuid();
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public ApiEndpointsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<EvidenceGraphDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<EvidenceGraphDbContext>(options =>
                {
                    options.UseInMemoryDatabase(DbName);
                });
            });
        });
    }

    [Fact]
    public async Task Login_WithSeededInvestigator_ReturnsJwtToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var req = new LoginRequest("investigator@evidencegraph.local", "Password123!");

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", req);

        // Assert
        response.EnsureSuccessStatusCode();
        var authResult = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOpts);
        authResult.Should().NotBeNull();
        authResult!.Token.Should().NotBeNullOrEmpty();
        authResult.User.Email.Should().Be("investigator@evidencegraph.local");
        authResult.User.Role.Should().Be(Core.Enums.UserRole.Investigator);
    }

    [Fact]
    public async Task GetCases_ReturnsOperationNorthstar()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/cases");

        // Assert
        response.EnsureSuccessStatusCode();
        var cases = await response.Content.ReadFromJsonAsync<List<InvestigationCaseDto>>(JsonOpts);
        cases.Should().NotBeNull();
        cases.Should().Contain(c => c.CaseNumber == "EG-2026-0042" && c.Title == "Operation Northstar");
    }

    [Fact]
    public async Task GetAuditVerify_ReturnsMatch()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/audit/verify");

        // Assert
        response.EnsureSuccessStatusCode();
        var verify = await response.Content.ReadFromJsonAsync<AuditVerificationResultDto>(JsonOpts);
        verify.Should().NotBeNull();
        verify!.Status.Should().Be("MATCH");
        verify.IsValid.Should().BeTrue();
    }
}
