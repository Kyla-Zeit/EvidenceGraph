using System.Security.Cryptography;
using EvidenceGraph.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EvidenceGraph.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly string _storageBasePath;
    private readonly string _originalBucket;
    private readonly string _derivedBucket;
    private readonly ILogger<StorageService> _logger;

    public StorageService(IConfiguration config, ILogger<StorageService> logger)
    {
        _logger = logger;
        _originalBucket = config["MINIO_ORIGINAL_BUCKET"] ?? "evidence-original";
        _derivedBucket = config["MINIO_DERIVED_BUCKET"] ?? "evidence-derived";

        var baseDir = config["LOCAL_STORAGE_PATH"] ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "storage");
        _storageBasePath = baseDir;

        Directory.CreateDirectory(Path.Combine(_storageBasePath, _originalBucket));
        Directory.CreateDirectory(Path.Combine(_storageBasePath, _derivedBucket));
    }

    public async Task<string> UploadOriginalAsync(string objectKey, Stream stream, string contentType, CancellationToken ct = default)
    {
        var targetPath = Path.Combine(_storageBasePath, _originalBucket, objectKey);
        var dir = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

        if (File.Exists(targetPath))
        {
            throw new InvalidOperationException($"Original evidence is write-once and immutable. Object key '{objectKey}' already exists.");
        }

        using var fileStream = new FileStream(targetPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, ct);
        _logger.LogInformation("Stored original evidence object {ObjectKey} in bucket {Bucket}", objectKey, _originalBucket);
        return $"{_originalBucket}/{objectKey}";
    }

    public async Task<string> UploadDerivedAsync(string objectKey, Stream stream, string contentType, CancellationToken ct = default)
    {
        var targetPath = Path.Combine(_storageBasePath, _derivedBucket, objectKey);
        var dir = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

        using var fileStream = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, ct);
        _logger.LogInformation("Stored derived artifact object {ObjectKey} in bucket {Bucket}", objectKey, _derivedBucket);
        return $"{_derivedBucket}/{objectKey}";
    }

    public Task<Stream> GetOriginalAsync(string objectKey, CancellationToken ct = default)
    {
        var targetPath = Path.Combine(_storageBasePath, _originalBucket, objectKey);
        if (!File.Exists(targetPath))
        {
            throw new FileNotFoundException($"Original evidence object '{objectKey}' not found.", targetPath);
        }

        Stream fs = new FileStream(targetPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(fs);
    }

    public Task<Stream> GetDerivedAsync(string objectKey, CancellationToken ct = default)
    {
        var targetPath = Path.Combine(_storageBasePath, _derivedBucket, objectKey);
        if (!File.Exists(targetPath))
        {
            throw new FileNotFoundException($"Derived evidence object '{objectKey}' not found.", targetPath);
        }

        Stream fs = new FileStream(targetPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(fs);
    }

    public Task<bool> ExistsOriginalAsync(string objectKey, CancellationToken ct = default)
    {
        var targetPath = Path.Combine(_storageBasePath, _originalBucket, objectKey);
        return Task.FromResult(File.Exists(targetPath));
    }

    public async Task<(string sha256, string sha512, long size)> CalculateHashesAndSizeAsync(Stream stream, CancellationToken ct = default)
    {
        if (stream.CanSeek) stream.Position = 0;

        using var sha256 = SHA256.Create();
        using var sha512 = SHA512.Create();

        byte[] buffer = new byte[81920];
        long totalBytes = 0;
        int bytesRead;

        while ((bytesRead = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
        {
            sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
            sha512.TransformBlock(buffer, 0, bytesRead, null, 0);
            totalBytes += bytesRead;
        }

        sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
        sha512.TransformFinalBlock(Array.Empty<byte>(), 0, 0);

        if (stream.CanSeek) stream.Position = 0;

        string sha256Hex = Convert.ToHexString(sha256.Hash!).ToLowerInvariant();
        string sha512Hex = Convert.ToHexString(sha512.Hash!).ToLowerInvariant();

        return (sha256Hex, sha512Hex, totalBytes);
    }
}
