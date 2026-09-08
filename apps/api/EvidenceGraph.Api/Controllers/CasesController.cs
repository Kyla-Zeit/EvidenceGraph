using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/cases")]
public class CasesController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IAuditService _audit;

    public CasesController(
        EvidenceGraphDbContext db,
        IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    // =========================================================
    // GET: /api/v1/cases
    // Returns all investigation cases as DTOs.
    // =========================================================
    [HttpGet]
    public async Task<ActionResult<List<InvestigationCaseDto>>> GetCases()
    {
        var cases = await _db.Cases
            .Include(c => c.LeadInvestigator)
            .Include(c => c.EvidenceItems)
            .Include(c => c.Entities)
            .Include(c => c.Relationships)
            .Include(c => c.Contradictions)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var dtos = cases.Select(c => new InvestigationCaseDto(
            c.Id,
            c.CaseNumber,
            c.Title,
            c.Description,
            c.Status,
            c.Priority,
            c.Classification,
            c.LeadInvestigatorId,
            c.LeadInvestigator != null
                ? c.LeadInvestigator.DisplayName
                : null,
            c.CreatedAt,
            c.UpdatedAt,
            c.OpenedAt,
            c.ClosedAt,
            c.Jurisdiction,
            c.Tags,
            c.EvidenceItems.Count,
            c.Entities.Count,
            c.Relationships.Count,
            c.Contradictions.Count(x => x.Status == "Flagged")
        )).ToList();

        return Ok(dtos);
    }

    // =========================================================
    // GET: /api/v1/cases/{id}
    // Returns one investigation case as a DTO.
    // =========================================================
    [HttpGet("{id}")]
    public async Task<ActionResult<InvestigationCaseDto>> GetCaseById(Guid id)
    {
        var c = await _db.Cases
            .Include(x => x.LeadInvestigator)
            .Include(x => x.EvidenceItems)
            .Include(x => x.Entities)
            .Include(x => x.Relationships)
            .Include(x => x.Contradictions)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c == null)
        {
            return NotFound();
        }

        var dto = new InvestigationCaseDto(
            c.Id,
            c.CaseNumber,
            c.Title,
            c.Description,
            c.Status,
            c.Priority,
            c.Classification,
            c.LeadInvestigatorId,
            c.LeadInvestigator?.DisplayName,
            c.CreatedAt,
            c.UpdatedAt,
            c.OpenedAt,
            c.ClosedAt,
            c.Jurisdiction,
            c.Tags,
            c.EvidenceItems.Count,
            c.Entities.Count,
            c.Relationships.Count,
            c.Contradictions.Count(x => x.Status == "Flagged")
        );

        return Ok(dto);
    }

    // =========================================================
    // POST: /api/v1/cases
    // Creates a new investigation case.
    //
    // IMPORTANT:
    // We return an InvestigationCaseDto instead of returning the
    // raw Entity Framework entity. Returning the EF entity caused
    // JSON serialization to follow circular navigation properties:
    //
    // Case -> LeadInvestigator -> Cases -> LeadInvestigator -> ...
    //
    // which resulted in HTTP 500 even though PostgreSQL had already
    // successfully created the case.
    // =========================================================
    [HttpPost]
    public async Task<ActionResult<InvestigationCaseDto>> CreateCase(
        [FromBody] CreateCaseRequest request)
    {
        // Get the authenticated investigator from the JWT.
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);

        Guid.TryParse(userIdStr, out var userId);

        // Development/demo fallback.
        // Normally the authenticated JWT should always provide this ID.
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();

            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        var now = DateTimeOffset.UtcNow;

        var newCase = new InvestigationCase
        {
            Id = Guid.NewGuid(),
            CaseNumber = request.CaseNumber,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Classification = request.Classification,
            Jurisdiction = request.Jurisdiction,
            Tags = request.Tags ?? new List<string>(),

            LeadInvestigatorId = userId,

            OpenedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Save the new case to PostgreSQL.
        _db.Cases.Add(newCase);
        await _db.SaveChangesAsync();

        // Record the creation in the audit trail.
        await _audit.RecordEventAsync(
            userId: userId,
            action: "CaseCreated",
            resourceType: "InvestigationCase",
            resourceId: newCase.Id.ToString(),
            structuredDetails: new
            {
                newCase.CaseNumber,
                newCase.Title
            },
            caseId: newCase.Id
        );

        // Retrieve the investigator name for the DTO.
        var leadInvestigator = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        // Return a clean DTO.
        // New cases have no evidence/entities/relationships/conflicts yet.
        var dto = new InvestigationCaseDto(
            newCase.Id,
            newCase.CaseNumber,
            newCase.Title,
            newCase.Description,
            newCase.Status,
            newCase.Priority,
            newCase.Classification,
            newCase.LeadInvestigatorId,
            leadInvestigator?.DisplayName,
            newCase.CreatedAt,
            newCase.UpdatedAt,
            newCase.OpenedAt,
            newCase.ClosedAt,
            newCase.Jurisdiction,
            newCase.Tags,
            0,
            0,
            0,
            0
        );

        return CreatedAtAction(
            nameof(GetCaseById),
            new { id = newCase.Id },
            dto
        );
    }
}