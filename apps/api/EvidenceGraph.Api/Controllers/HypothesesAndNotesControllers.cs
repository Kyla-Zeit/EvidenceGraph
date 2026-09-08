using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Enums;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/cases/{caseId}/hypotheses")]
public class HypothesesController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;

    public HypothesesController(EvidenceGraphDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<InvestigativeHypothesis>>> GetHypotheses(Guid caseId)
    {
        var list = await _db.Hypotheses.Where(h => h.CaseId == caseId).OrderByDescending(h => h.UpdatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<InvestigativeHypothesis>> CreateHypothesis(Guid caseId, [FromBody] CreateHypothesisReq req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        var hypothesis = new InvestigativeHypothesis
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            Title = req.Title,
            Description = req.Description,
            Status = HypothesisStatus.Open,
            SupportingEvidenceIds = req.SupportingEvidenceIds ?? new(),
            ContradictingEvidenceIds = req.ContradictingEvidenceIds ?? new(),
            UnresolvedQuestions = req.UnresolvedQuestions ?? new(),
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.Hypotheses.Add(hypothesis);
        await _db.SaveChangesAsync();
        return Ok(hypothesis);
    }
}

public record CreateHypothesisReq(string Title, string Description, List<Guid>? SupportingEvidenceIds, List<Guid>? ContradictingEvidenceIds, List<string>? UnresolvedQuestions);

[ApiController]
[Route("api/v1/cases/{caseId}/notes")]
public class NotesController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;

    public NotesController(EvidenceGraphDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<InvestigativeNote>>> GetNotes(Guid caseId)
    {
        var list = await _db.Notes.Where(n => n.CaseId == caseId).Include(n => n.AuthorUser).OrderByDescending(n => n.CreatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<InvestigativeNote>> CreateNote(Guid caseId, [FromBody] CreateNoteReq req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        var note = new InvestigativeNote
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            AuthorUserId = userId,
            EvidenceId = req.EvidenceId,
            EntityId = req.EntityId,
            RelationshipId = req.RelationshipId,
            EventId = req.EventId,
            Content = req.Content,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.Notes.Add(note);
        await _db.SaveChangesAsync();
        return Ok(note);
    }
}

public record CreateNoteReq(string Content, Guid? EvidenceId, Guid? EntityId, Guid? RelationshipId, Guid? EventId);
