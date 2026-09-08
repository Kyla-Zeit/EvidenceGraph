using System.Text.Json;
using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/cases/{caseId}/analysis")]
public class AnalysisController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IAnalysisServiceClient _analysisClient;
    private readonly IAuditService _audit;

    public AnalysisController(EvidenceGraphDbContext db, IAnalysisServiceClient analysisClient, IAuditService audit)
    {
        _db = db;
        _analysisClient = analysisClient;
        _audit = audit;
    }

    [HttpPost("query")]
    public async Task<ActionResult<AiAnalysisRunDto>> RunQuery(Guid caseId, [FromBody] AnalysisQueryRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        // 1. Collect case chunks for retrieval context
        var chunks = await _db.EvidenceChunks
            .Where(c => c.Evidence != null && c.Evidence.CaseId == caseId)
            .Include(c => c.Evidence)
            .Take(30)
            .Select(c => new EvidenceChunkContext(
                c.Id,
                c.EvidenceId,
                c.Evidence != null ? c.Evidence.EvidenceNumber : "EV-000",
                c.Evidence != null ? c.Evidence.Title : "Evidence",
                c.Text,
                c.ChunkIndex,
                c.PageNumber
            ))
            .ToListAsync();

        // 2. Collect case graph paths
        var rels = await _db.Relationships
            .Where(r => r.CaseId == caseId)
            .Include(r => r.SourceEntity)
            .Include(r => r.TargetEntity)
            .Include(r => r.Evidence)
            .Take(40)
            .Select(r => new GraphPathSync(
                r.SourceEntity != null ? r.SourceEntity.DisplayName : "Entity A",
                r.RelationshipType.ToString(),
                r.TargetEntity != null ? r.TargetEntity.DisplayName : "Entity B",
                r.Evidence != null ? r.Evidence.EvidenceNumber : null
            ))
            .ToListAsync();

        // 3. Collect case timeline events
        var events = await _db.Events
            .Where(e => e.CaseId == caseId)
            .Include(e => e.SourceEvidence)
            .Take(25)
            .Select(e => new EventToCompare(
                e.Id,
                e.Title,
                e.EventType,
                e.StartTime,
                e.EndTime,
                e.TimePrecision.ToString(),
                e.SourceEvidenceId,
                e.SourceEvidence != null ? e.SourceEvidence.EvidenceNumber : null,
                e.Description
            ))
            .ToListAsync();

        var aiReq = new AiAnalysisRequest(caseId, userId, request.Question, chunks, rels, events, request.Provider);
        var aiRes = await _analysisClient.QueryGraphRagAsync(aiReq);

        var run = new AiAnalysisRun
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            Question = request.Question,
            AnswerMarkdown = aiRes.AnswerMarkdown,
            ModelProvider = aiRes.ModelProvider,
            Model = aiRes.Model,
            PromptTemplateVersion = "1.0.0",
            StartedAt = DateTimeOffset.UtcNow.AddMilliseconds(-aiRes.LatencyMs),
            CompletedAt = DateTimeOffset.UtcNow,
            LatencyMs = aiRes.LatencyMs,
            InputTokenEstimate = aiRes.InputTokens,
            OutputTokenEstimate = aiRes.OutputTokens,
            Status = "Completed",
            ConfidenceCategory = aiRes.ConfidenceCategory,
            ConfidenceFactorsJson = JsonSerializer.Serialize(aiRes.ConfidenceFactors),
            CitationsJson = JsonSerializer.Serialize(aiRes.Citations)
        };

        _db.AiAnalysisRuns.Add(run);

        // Store retrieved context items for AI Trace
        int pos = 0;
        foreach (var cit in aiRes.Citations)
        {
            _db.AiRetrievedContexts.Add(new AiRetrievedContext
            {
                Id = Guid.NewGuid(),
                AiRunId = run.Id,
                EvidenceId = cit.EvidenceId,
                ChunkId = cit.ChunkId,
                RetrievalMethod = "GraphRAG",
                RetrievalScore = cit.Confidence,
                Position = pos++
            });
        }

        await _db.SaveChangesAsync();

        await _audit.RecordEventAsync(
            userId: userId,
            action: "AiQueryExecuted",
            resourceType: "AiAnalysisRun",
            resourceId: run.Id.ToString(),
            structuredDetails: new { request.Question, run.ModelProvider, CitationsCount = aiRes.Citations.Count },
            caseId: caseId);

        var citationsDto = aiRes.Citations.Select(c => new AiCitationDto(
            c.CitationKey, c.EvidenceId, c.EvidenceNumber, c.ChunkId, c.PageNumber, c.Snippet, c.Confidence
        )).ToList();

        return Ok(new AiAnalysisRunDto(
            run.Id,
            run.CaseId,
            run.UserId,
            run.Question,
            run.AnswerMarkdown,
            run.ModelProvider,
            run.Model,
            run.PromptTemplateVersion,
            run.StartedAt,
            run.CompletedAt,
            run.LatencyMs,
            run.InputTokenEstimate,
            run.OutputTokenEstimate,
            run.Status,
            run.ConfidenceCategory,
            aiRes.ConfidenceFactors,
            citationsDto,
            citationsDto.Count
        ));
    }

    [HttpGet("runs")]
    public async Task<ActionResult<List<AiAnalysisRunDto>>> GetRuns(Guid caseId)
    {
        var runs = await _db.AiAnalysisRuns
            .Where(r => r.CaseId == caseId)
            .OrderByDescending(r => r.CompletedAt)
            .ToListAsync();

        var dtos = runs.Select(r =>
        {
            var factors = JsonSerializer.Deserialize<AiConfidenceFactors>(r.ConfidenceFactorsJson) ?? new AiConfidenceFactors(new(), new());
            var citations = JsonSerializer.Deserialize<List<AiCitationDto>>(r.CitationsJson) ?? new List<AiCitationDto>();
            return new AiAnalysisRunDto(
                r.Id, r.CaseId, r.UserId, r.Question, r.AnswerMarkdown, r.ModelProvider, r.Model, r.PromptTemplateVersion,
                r.StartedAt, r.CompletedAt, r.LatencyMs, r.InputTokenEstimate, r.OutputTokenEstimate, r.Status,
                r.ConfidenceCategory, factors, citations, citations.Count
            );
        }).ToList();

        return Ok(dtos);
    }
}

public record AnalysisQueryRequest(string Question, string? Provider = null);
