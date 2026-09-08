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
[Route("api/v1/cases/{caseId}/entities")]
public class EntitiesController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IAuditService _audit;

    public EntitiesController(EvidenceGraphDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<ActionResult<List<EntityDto>>> GetEntities(Guid caseId, [FromQuery] string? type, [FromQuery] string? status)
    {
        var query = _db.Entities
            .Where(e => e.CaseId == caseId)
            .Include(e => e.Mentions)
            .Include(e => e.SourceRelationships)
            .Include(e => e.TargetRelationships)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<EntityType>(type, true, out var entityType))
        {
            query = query.Where(e => e.EntityType == entityType);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<EntityStatus>(status, true, out var entityStatus))
        {
            query = query.Where(e => e.Status == entityStatus);
        }

        var list = await query
            .OrderByDescending(e => e.Mentions.Count)
            .Select(e => new EntityDto(
                e.Id,
                e.CaseId,
                e.EntityType,
                e.CanonicalValue,
                e.DisplayName,
                e.Description,
                e.Status,
                e.Confidence,
                e.CreatedBy,
                e.CreatedAt,
                e.ConfirmedByUserId,
                e.ConfirmedAt,
                e.Mentions.Count,
                e.SourceRelationships.Count + e.TargetRelationships.Count
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EntityDto>> GetEntityById(Guid caseId, Guid id)
    {
        var e = await _db.Entities
            .Include(x => x.Mentions)
            .Include(x => x.SourceRelationships)
            .Include(x => x.TargetRelationships)
            .FirstOrDefaultAsync(x => x.CaseId == caseId && x.Id == id);

        if (e == null) return NotFound();

        return Ok(new EntityDto(
            e.Id,
            e.CaseId,
            e.EntityType,
            e.CanonicalValue,
            e.DisplayName,
            e.Description,
            e.Status,
            e.Confidence,
            e.CreatedBy,
            e.CreatedAt,
            e.ConfirmedByUserId,
            e.ConfirmedAt,
            e.Mentions.Count,
            e.SourceRelationships.Count + e.TargetRelationships.Count
        ));
    }

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult> ConfirmEntity(Guid caseId, Guid id)
    {
        var entity = await _db.Entities.FirstOrDefaultAsync(e => e.CaseId == caseId && e.Id == id);
        if (entity == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        entity.Status = EntityStatus.Confirmed;
        entity.ConfirmedByUserId = userId;
        entity.ConfirmedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        await _audit.RecordEventAsync(
            userId: userId,
            action: "EntityConfirmed",
            resourceType: "Entity",
            resourceId: entity.Id.ToString(),
            structuredDetails: new { entity.CanonicalValue, entity.DisplayName, entity.EntityType },
            caseId: caseId);

        return Ok(new { message = "Entity confirmed successfully", entityId = entity.Id });
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult> RejectEntity(Guid caseId, Guid id)
    {
        var entity = await _db.Entities.FirstOrDefaultAsync(e => e.CaseId == caseId && e.Id == id);
        if (entity == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        entity.Status = EntityStatus.Rejected;
        await _db.SaveChangesAsync();

        await _audit.RecordEventAsync(
            userId: userId,
            action: "EntityRejected",
            resourceType: "Entity",
            resourceId: entity.Id.ToString(),
            structuredDetails: new { entity.CanonicalValue, entity.DisplayName },
            caseId: caseId);

        return Ok(new { message = "Entity rejected", entityId = entity.Id });
    }

    [HttpGet("{id}/mentions")]
    public async Task<ActionResult<List<EntityMentionDto>>> GetEntityMentions(Guid caseId, Guid id)
    {
        var mentions = await _db.EntityMentions
            .Where(m => m.EntityId == id)
            .Include(m => m.Evidence)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new EntityMentionDto(
                m.Id,
                m.EntityId,
                m.EvidenceId,
                m.Evidence != null ? m.Evidence.EvidenceNumber : "",
                m.Evidence != null ? m.Evidence.Title : "",
                m.ChunkId,
                m.OriginalText,
                m.NormalizedText,
                m.StartOffset,
                m.EndOffset,
                m.ExtractionMethod,
                m.Confidence,
                m.CreatedAt
            ))
            .ToListAsync();

        return Ok(mentions);
    }
}
