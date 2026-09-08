using System.Text;
using EvidenceGraph.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EvidenceGraph.Tests;

public class EvidenceHashingAndIntegrityTests
{
    private readonly StorageService _storageService;

    public EvidenceHashingAndIntegrityTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"MINIO_ORIGINAL_BUCKET", "test-evidence-original"},
            {"MINIO_DERIVED_BUCKET", "test-evidence-derived"},
            {"LOCAL_STORAGE_PATH", Path.Combine(Path.GetTempPath(), "EvidenceGraphTests", Guid.NewGuid().ToString())}
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _storageService = new StorageService(configuration, NullLogger<StorageService>.Instance);
    }

    [Fact]
    public async Task CalculateHashes_ProducesDeterministicSha256AndSha512()
    {
        // Arrange
        var testContent = "CONFIDENTIAL EVIDENTIARY RECORD #EV-001 - Operation Northstar";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(testContent));

        // Act
        var (sha256, sha512, size) = await _storageService.CalculateHashesAndSizeAsync(stream);

        // Assert
        sha256.Should().NotBeNullOrEmpty();
        sha256.Length.Should().Be(64);
        sha512.Should().NotBeNullOrEmpty();
        sha512.Length.Should().Be(128);
        size.Should().Be(Encoding.UTF8.GetBytes(testContent).Length);

        // Re-calculating with same bytes must produce identical hashes
        using var stream2 = new MemoryStream(Encoding.UTF8.GetBytes(testContent));
        var (sha256_2, _, _) = await _storageService.CalculateHashesAndSizeAsync(stream2);
        sha256_2.Should().Be(sha256);
    }

    [Fact]
    public async Task UploadOriginal_Immutability_ThrowsIfKeyAlreadyExists()
    {
        // Arrange
        var testContent = "Original evidence payload";
        using var stream1 = new MemoryStream(Encoding.UTF8.GetBytes(testContent));
        var objectKey = "case-1/original-evidence.eml";

        // Act
        await _storageService.UploadOriginalAsync(objectKey, stream1, "message/rfc822");

        // Assert: attempt to overwrite must throw InvalidOperationException
        using var stream2 = new MemoryStream(Encoding.UTF8.GetBytes("Tampered payload"));
        Func<Task> act = async () => await _storageService.UploadOriginalAsync(objectKey, stream2, "message/rfc822");
        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
