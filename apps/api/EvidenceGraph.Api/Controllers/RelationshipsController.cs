using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Enums;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/cases/{caseId}/relationships")]
public class RelationshipsController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IAuditService _audit;

    public RelationshipsController(EvidenceGraphDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<ActionResult<List<RelationshipDto>>> GetRelationships(Guid caseId)
    {
        var rels = await _db.Relationships
            .Where(r => r.CaseId == caseId)
            .Include(r => r.SourceEntity)
            .Include(r => r.TargetEntity)
            .Include(r => r.Evidence)
            .OrderByDescending(r => r.Confidence)
            .Select(r => new RelationshipDto(
                r.Id,
                r.CaseId,
                r.SourceEntityId,
                r.SourceEntity != null ? r.SourceEntity.DisplayName : "",
                r.SourceEntity != null ? r.SourceEntity.EntityType : EntityType.Person,
                r.TargetEntityId,
                r.TargetEntity != null ? r.TargetEntity.DisplayName : "",
                r.TargetEntity != null ? r.TargetEntity.EntityType : EntityType.Person,
                r.RelationshipType,
                r.Status,
                r.Confidence,
                r.StartTime,
                r.EndTime,
                r.EvidenceId,
                r.Evidence != null ? r.Evidence.EvidenceNumber : null,
                r.ChunkId,
                r.ExtractionMethod,
                r.AnalystConfirmed,
                r.CreatedAt
            ))
            .ToListAsync();

        return Ok(rels);
    }

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult> ConfirmRelationship(Guid caseId, Guid id)
    {
        var rel = await _db.Relationships.FirstOrDefaultAsync(r => r.CaseId == caseId && r.Id == id);
        if (rel == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        rel.Status = RelationshipStatus.Confirmed;
        rel.AnalystConfirmed = true;
        await _db.SaveChangesAsync();

        await _audit.RecordEventAsync(
            userId: userId,
            action: "RelationshipConfirmed",
            resourceType: "Relationship",
            resourceId: rel.Id.ToString(),
            structuredDetails: new { rel.SourceEntityId, rel.TargetEntityId, rel.RelationshipType },
            caseId: caseId);

        return Ok(new { message = "Relationship confirmed", id = rel.Id });
    }
}
