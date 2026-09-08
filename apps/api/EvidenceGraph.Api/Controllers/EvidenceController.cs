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
[Route("api/v1/cases/{caseId}/evidence")]
public class EvidenceController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IStorageService _storage;
    private readonly IAuditService _audit;
    private readonly IEvidenceIntegrityService _integrityService;
    private readonly IAnalysisServiceClient _analysisClient;

    public EvidenceController(
        EvidenceGraphDbContext db,
        IStorageService storage,
        IAuditService audit,
        IEvidenceIntegrityService integrityService,
        IAnalysisServiceClient analysisClient)
    {
        _db = db;
        _storage = storage;
        _audit = audit;
        _integrityService = integrityService;
        _analysisClient = analysisClient;
    }

    [HttpGet]
    public async Task<ActionResult<List<EvidenceItemDto>>> GetEvidenceList(Guid caseId)
    {
        var items = await _db.EvidenceItems
            .Where(e => e.CaseId == caseId)
            .Include(e => e.UploadedByUser)
            .OrderBy(e => e.EvidenceNumber)
            .Select(e => new EvidenceItemDto(
                e.Id,
                e.CaseId,
                e.EvidenceNumber,
                e.Title,
                e.Description,
                e.EvidenceType,
                e.OriginalFilename,
                e.StoredObjectKey,
                e.MimeType,
                e.FileSize,
                e.Sha256,
                e.Sha512,
                e.AcquiredAt,
                e.UploadedAt,
                e.UploadedByUserId,
                e.UploadedByUser != null ? e.UploadedByUser.DisplayName : null,
                e.SourceDescription,
                e.CollectionMethod,
                e.OriginalOrDerivative,
                e.ParentEvidenceId,
                e.ProcessingStatus,
                e.SecurityClassification,
                e.ReviewStatus,
                e.Notes,
                e.IsQuarantined,
                e.MetadataJson,
                e.ExtractedText
            ))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EvidenceItemDto>> GetEvidenceById(Guid caseId, Guid id)
    {
        var e = await _db.EvidenceItems
            .Include(x => x.UploadedByUser)
            .FirstOrDefaultAsync(x => x.CaseId == caseId && x.Id == id);

        if (e == null) return NotFound();

        return Ok(new EvidenceItemDto(
            e.Id,
            e.CaseId,
            e.EvidenceNumber,
            e.Title,
            e.Description,
            e.EvidenceType,
            e.OriginalFilename,
            e.StoredObjectKey,
            e.MimeType,
            e.FileSize,
            e.Sha256,
            e.Sha512,
            e.AcquiredAt,
            e.UploadedAt,
            e.UploadedByUserId,
            e.UploadedByUser?.DisplayName,
            e.SourceDescription,
            e.CollectionMethod,
            e.OriginalOrDerivative,
            e.ParentEvidenceId,
            e.ProcessingStatus,
            e.SecurityClassification,
            e.ReviewStatus,
            e.Notes,
            e.IsQuarantined,
            e.MetadataJson,
            e.ExtractedText
        ));
    }

    [HttpPost("{id}/verify-integrity")]
    public async Task<ActionResult<IntegrityVerificationResultDto>> VerifyIntegrity(Guid caseId, Guid id)
    {
        var evidence = await _db.EvidenceItems.FirstOrDefaultAsync(e => e.CaseId == caseId && e.Id == id);
        if (evidence == null) return NotFound();

        var (isMatch, origSha, currSha, size, status) = await _integrityService.VerifyEvidenceIntegrityAsync(id);

        return Ok(new IntegrityVerificationResultDto(
            EvidenceId: evidence.Id,
            EvidenceNumber: evidence.EvidenceNumber,
            OriginalSha256: origSha,
            CurrentSha256: currSha,
            IsMatch: isMatch,
            Status: status,
            VerifiedAt: DateTimeOffset.UtcNow,
            ByteLength: size
        ));
    }

    [HttpGet("{id}/chunks")]
    public async Task<ActionResult<List<EvidenceChunkDto>>> GetChunks(Guid caseId, Guid id)
    {
        var chunks = await _db.EvidenceChunks
            .Where(c => c.EvidenceId == id)
            .OrderBy(c => c.ChunkIndex)
            .Select(c => new EvidenceChunkDto(
                c.Id,
                c.EvidenceId,
                c.Evidence != null ? c.Evidence.EvidenceNumber : "",
                c.ChunkIndex,
                c.PageNumber,
                c.StartOffset,
                c.EndOffset,
                c.Text,
                c.TextHash,
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(chunks);
    }
}
