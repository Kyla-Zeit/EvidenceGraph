using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EvidenceGraph.Infrastructure.Services;

public class EvidenceIntegrityService : IEvidenceIntegrityService
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IStorageService _storage;
    private readonly IAuditService _audit;
    private readonly ILogger<EvidenceIntegrityService> _logger;

    public EvidenceIntegrityService(
        EvidenceGraphDbContext db,
        IStorageService storage,
        IAuditService audit,
        ILogger<EvidenceIntegrityService> logger)
    {
        _db = db;
        _storage = storage;
        _audit = audit;
        _logger = logger;
    }

    public async Task<(bool isMatch, string originalSha256, string currentSha256, long size, string status)> VerifyEvidenceIntegrityAsync(
        Guid evidenceId,
        CancellationToken ct = default)
    {
        var evidence = await _db.EvidenceItems.FindAsync(new object[] { evidenceId }, ct);
        if (evidence == null)
        {
            throw new KeyNotFoundException($"Evidence item {evidenceId} not found.");
        }

        using var stream = await _storage.GetOriginalAsync(evidence.StoredObjectKey, ct);
        var (currentSha256, _, currentSize) = await _storage.CalculateHashesAndSizeAsync(stream, ct);

        bool isMatch = string.Equals(evidence.Sha256, currentSha256, StringComparison.OrdinalIgnoreCase);
        string status = isMatch ? "MATCH" : "INTEGRITY FAILURE";

        _logger.LogInformation("Integrity verification for evidence {EvidenceNumber} ({Id}): Status={Status}",
            evidence.EvidenceNumber, evidence.Id, status);

        // Record verification audit event
        await _audit.RecordEventAsync(
            userId: evidence.UploadedByUserId,
            action: "EvidenceIntegrityVerified",
            resourceType: "EvidenceItem",
            resourceId: evidence.Id.ToString(),
            structuredDetails: new
            {
                EvidenceNumber = evidence.EvidenceNumber,
                OriginalSha256 = evidence.Sha256,
                CurrentSha256 = currentSha256,
                Result = status,
                IsMatch = isMatch,
                FileSize = currentSize
            },
            caseId: evidence.CaseId,
            evidenceId: evidence.Id,
            ct: ct);

        return (isMatch, evidence.Sha256, currentSha256, currentSize, status);
    }
}
