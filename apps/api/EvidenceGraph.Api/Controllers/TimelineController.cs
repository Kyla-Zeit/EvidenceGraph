using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Enums;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/cases/{caseId}/timeline")]
public class TimelineController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;

    public TimelineController(EvidenceGraphDbContext db)
    {
        _db = db;
    }

    [HttpGet("events")]
    public async Task<ActionResult<List<InvestigativeEventDto>>> GetEvents(Guid caseId)
    {
        var events = await _db.Events
            .Where(e => e.CaseId == caseId)
            .Include(e => e.SourceEvidence)
            .OrderBy(e => e.StartTime)
            .Select(e => new InvestigativeEventDto(
                e.Id,
                e.CaseId,
                e.Title,
                e.Description,
                e.EventType,
                e.StartTime,
                e.EndTime,
                e.TimePrecision,
                e.SourceEvidenceId,
                e.SourceEvidence != null ? e.SourceEvidence.EvidenceNumber : null,
                e.SourceChunkId,
                e.Description,
                e.EntityIds,
                e.ExtractionMethod,
                e.Confidence,
                e.Confirmed,
                e.CreatedAt
            ))
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("contradictions")]
    public async Task<ActionResult<List<ContradictionCandidateDto>>> GetContradictions(Guid caseId)
    {
        var candidates = await _db.Contradictions
            .Where(c => c.CaseId == caseId)
            .ToListAsync();

        var eventIds = candidates.SelectMany(c => new[] { c.FirstEventId, c.SecondEventId }).Distinct().ToList();
        var events = await _db.Events.Where(e => eventIds.Contains(e.Id)).Include(e => e.SourceEvidence).ToDictionaryAsync(e => e.Id, e => e);

        var result = candidates.Select(c =>
        {
            var first = events.GetValueOrDefault(c.FirstEventId);
            var second = events.GetValueOrDefault(c.SecondEventId);

            return new ContradictionCandidateDto(
                c.Id,
                c.CaseId,
                c.Title,
                c.Reason,
                c.Confidence,
                c.Status,
                c.FirstEventId,
                first?.Title ?? "Event 1",
                first?.StartTime ?? DateTimeOffset.MinValue,
                first?.SourceEvidence?.EvidenceNumber ?? "N/A",
                first?.Description ?? "",
                c.SecondEventId,
                second?.Title ?? "Event 2",
                second?.StartTime ?? DateTimeOffset.MinValue,
                second?.SourceEvidence?.EvidenceNumber ?? "N/A",
                second?.Description ?? "",
                c.TimeDeltaMinutes,
                c.DistanceEstimate
            );
        }).ToList();

        return Ok(result);
    }
}
