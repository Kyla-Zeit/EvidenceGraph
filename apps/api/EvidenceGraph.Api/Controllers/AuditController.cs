using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/audit")]
public class AuditController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IAuditService _audit;

    public AuditController(EvidenceGraphDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet("events")]
    public async Task<ActionResult<List<AuditEventDto>>> GetAuditEvents([FromQuery] Guid? caseId, [FromQuery] int take = 100)
    {
        var query = _db.AuditEvents.Include(a => a.User).AsQueryable();
        if (caseId.HasValue)
        {
            query = query.Where(a => a.CaseId == caseId.Value);
        }

        var events = await query
            .OrderByDescending(a => a.SequenceNumber)
            .Take(take)
            .Select(a => new AuditEventDto(
                a.AuditId,
                a.SequenceNumber,
                a.TimestampUtc,
                a.UserId,
                a.User != null ? a.User.DisplayName : null,
                a.CaseId,
                a.EvidenceId,
                a.Action,
                a.ResourceType,
                a.ResourceId,
                a.StructuredDetails,
                a.PreviousHash,
                a.EntryHash
            ))
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("verify")]
    public async Task<ActionResult<AuditVerificationResultDto>> VerifyGlobalAuditChain()
    {
        var (isValid, total, brokenSeq, firstHash, lastHash, msg) = await _audit.VerifyAuditChainAsync(null);

        return Ok(new AuditVerificationResultDto(
            TotalEventsChecked: total,
            IsValid: isValid,
            BrokenSequenceNumber: brokenSeq,
            FirstHash: firstHash,
            LatestHash: lastHash,
            VerifiedAt: DateTimeOffset.UtcNow,
            Status: isValid ? "MATCH" : "INTEGRITY FAILURE",
            Details: msg
        ));
    }

    [HttpGet("cases/{caseId}/verify")]
    public async Task<ActionResult<AuditVerificationResultDto>> VerifyCaseAuditChain(Guid caseId)
    {
        var (isValid, total, brokenSeq, firstHash, lastHash, msg) = await _audit.VerifyAuditChainAsync(caseId);

        return Ok(new AuditVerificationResultDto(
            TotalEventsChecked: total,
            IsValid: isValid,
            BrokenSequenceNumber: brokenSeq,
            FirstHash: firstHash,
            LatestHash: lastHash,
            VerifiedAt: DateTimeOffset.UtcNow,
            Status: isValid ? "MATCH" : "INTEGRITY FAILURE",
            Details: msg
        ));
    }
}
