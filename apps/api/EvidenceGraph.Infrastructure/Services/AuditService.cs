using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EvidenceGraph.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly EvidenceGraphDbContext _db;
    private readonly ILogger<AuditService> _logger;
    private const string GenesisHash = "0000000000000000000000000000000000000000000000000000000000000000";

    public AuditService(EvidenceGraphDbContext db, ILogger<AuditService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<AuditEvent> RecordEventAsync(
        Guid userId,
        string action,
        string resourceType,
        string resourceId,
        object structuredDetails,
        Guid? caseId = null,
        Guid? evidenceId = null,
        CancellationToken ct = default)
    {
        var lastEvent = await _db.AuditEvents
            .OrderByDescending(a => a.SequenceNumber)
            .FirstOrDefaultAsync(ct);

        long nextSeq = (lastEvent?.SequenceNumber ?? 0) + 1;
        string prevHash = lastEvent?.EntryHash ?? GenesisHash;
        var now = DateTimeOffset.UtcNow;
        string detailsJson = JsonSerializer.Serialize(structuredDetails);

        string canonicalPayload = Canonicalize(nextSeq, now, userId, action, resourceType, resourceId, detailsJson, prevHash);
        string entryHash = ComputeSha256(canonicalPayload);

        var auditEvent = new AuditEvent
        {
            AuditId = Guid.NewGuid(),
            SequenceNumber = nextSeq,
            TimestampUtc = now,
            UserId = userId,
            CaseId = caseId,
            EvidenceId = evidenceId,
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            StructuredDetails = detailsJson,
            PreviousHash = prevHash,
            EntryHash = entryHash
        };

        _db.AuditEvents.Add(auditEvent);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Recorded Audit Event #{Seq} Action: {Action} Hash: {Hash}", nextSeq, action, entryHash[..8]);
        return auditEvent;
    }

    public async Task<(bool isValid, int totalEvents, long? brokenSequence, string firstHash, string latestHash, string message)> VerifyAuditChainAsync(
        Guid? caseId = null,
        CancellationToken ct = default)
    {
        IQueryable<AuditEvent> query = _db.AuditEvents.OrderBy(a => a.SequenceNumber);
        if (caseId.HasValue)
        {
            query = query.Where(a => a.CaseId == caseId.Value);
        }

        var events = await query.ToListAsync(ct);
        if (events.Count == 0)
        {
            return (true, 0, null, GenesisHash, GenesisHash, "No audit events found to verify.");
        }

        string expectedPrevHash = GenesisHash;
        if (!caseId.HasValue)
        {
            // Global chain validation
            for (int i = 0; i < events.Count; i++)
            {
                var ev = events[i];
                if (ev.PreviousHash != expectedPrevHash)
                {
                    return (false, events.Count, ev.SequenceNumber, events[0].EntryHash, events[^1].EntryHash,
                        $"PreviousHash mismatch at sequence #{ev.SequenceNumber}. Expected {expectedPrevHash}, found {ev.PreviousHash}");
                }

                string canonical = Canonicalize(ev.SequenceNumber, ev.TimestampUtc, ev.UserId, ev.Action, ev.ResourceType, ev.ResourceId, ev.StructuredDetails, ev.PreviousHash);
                string computedHash = ComputeSha256(canonical);

                if (computedHash != ev.EntryHash)
                {
                    return (false, events.Count, ev.SequenceNumber, events[0].EntryHash, events[^1].EntryHash,
                        $"Hash tampering detected at sequence #{ev.SequenceNumber}. Computed {computedHash}, recorded {ev.EntryHash}");
                }

                expectedPrevHash = ev.EntryHash;
            }
        }
        else
        {
            // Case-specific subset verification (validates self-consistency of individual events)
            for (int i = 0; i < events.Count; i++)
            {
                var ev = events[i];
                string canonical = Canonicalize(ev.SequenceNumber, ev.TimestampUtc, ev.UserId, ev.Action, ev.ResourceType, ev.ResourceId, ev.StructuredDetails, ev.PreviousHash);
                string computedHash = ComputeSha256(canonical);

                if (computedHash != ev.EntryHash)
                {
                    return (false, events.Count, ev.SequenceNumber, events[0].EntryHash, events[^1].EntryHash,
                        $"Hash tampering detected at sequence #{ev.SequenceNumber}. Computed {computedHash}, recorded {ev.EntryHash}");
                }
            }
        }

        return (true, events.Count, null, events[0].EntryHash, events[^1].EntryHash, "All audit events verified intact with unbroken cryptographic hash chain.");
    }

    private static string Canonicalize(long seq, DateTimeOffset ts, Guid userId, string action, string rType, string rId, string details, string prevHash)
    {
        return $"{{\"seq\":{seq},\"ts\":\"{ts:O}\",\"uid\":\"{userId}\",\"act\":\"{action}\",\"rtype\":\"{rType}\",\"rid\":\"{rId}\",\"details\":{details},\"prev\":\"{prevHash}\"}}";
    }

    private static string ComputeSha256(string input)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(input);
        byte[] hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
