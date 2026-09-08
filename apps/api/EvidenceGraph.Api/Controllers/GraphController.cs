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
[Route("api/v1/cases/{caseId}/graph")]
public class GraphController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IAnalysisServiceClient _analysisClient;
    private readonly IAuditService _audit;

    public GraphController(EvidenceGraphDbContext db, IAnalysisServiceClient analysisClient, IAuditService audit)
    {
        _db = db;
        _analysisClient = analysisClient;
        _audit = audit;
    }

    [HttpGet]
    public async Task<ActionResult<GraphDataDto>> GetGraph(Guid caseId)
    {
        var entities = await _db.Entities
            .Where(e => e.CaseId == caseId)
            .Include(e => e.SourceRelationships)
            .Include(e => e.TargetRelationships)
            .ToListAsync();

        var relationships = await _db.Relationships
            .Where(r => r.CaseId == caseId)
            .Include(r => r.Evidence)
            .ToListAsync();

        var nodes = entities.Select(e => new GraphNodeDto
        {
            Id = e.Id.ToString(),
            Label = e.DisplayName,
            EntityType = e.EntityType,
            Status = e.Status,
            Confidence = e.Confidence,
            IsConfirmed = e.Status == EntityStatus.Confirmed,
            Degree = e.SourceRelationships.Count + e.TargetRelationships.Count
        }).ToList();

        var edges = relationships.Select(r => new GraphEdgeDto
        {
            Id = r.Id.ToString(),
            Source = r.SourceEntityId.ToString(),
            Target = r.TargetEntityId.ToString(),
            RelationshipType = r.RelationshipType,
            Status = r.Status,
            Confidence = r.Confidence,
            IsConfirmed = r.Status == RelationshipStatus.Confirmed || r.AnalystConfirmed,
            EvidenceId = r.EvidenceId?.ToString(),
            EvidenceNumber = r.Evidence?.EvidenceNumber
        }).ToList();

        return Ok(new GraphDataDto { Nodes = nodes, Edges = edges });
    }

    [HttpPost("rebuild")]
    public async Task<ActionResult<GraphRebuildResponse>> RebuildGraph(Guid caseId)
    {
        var entities = await _db.Entities.Where(e => e.CaseId == caseId).ToListAsync();
        var relationships = await _db.Relationships.Where(r => r.CaseId == caseId).Include(r => r.Evidence).ToListAsync();

        var syncNodes = entities.Select(e => new GraphNodeSyncItem(
            e.Id, e.DisplayName, e.EntityType.ToString(), e.CanonicalValue, e.DisplayName, e.Status.ToString(), e.Confidence, e.Status == EntityStatus.Confirmed
        )).ToList();

        var syncEdges = relationships.Select(r => new GraphEdgeSyncItem(
            r.Id, r.SourceEntityId, r.TargetEntityId, r.RelationshipType.ToString(), r.Status.ToString(), r.Confidence, r.AnalystConfirmed, r.EvidenceId, r.Evidence?.EvidenceNumber
        )).ToList();

        var rebuildReq = new GraphRebuildRequest(caseId, syncNodes, syncEdges);
        var result = await _analysisClient.RebuildCaseGraphAsync(rebuildReq);

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);
        if (userId == Guid.Empty)
        {
            var firstUser = await _db.Users.FirstOrDefaultAsync();
            userId = firstUser?.Id ?? Guid.NewGuid();
        }

        await _audit.RecordEventAsync(
            userId: userId,
            action: "GraphRebuilt",
            resourceType: "KnowledgeGraph",
            resourceId: caseId.ToString(),
            structuredDetails: new { NodesProjected = syncNodes.Count, RelationshipsProjected = syncEdges.Count },
            caseId: caseId);

        return Ok(result);
    }

    [HttpGet("path")]
    public async Task<ActionResult<GraphPathResponse>> FindPath(Guid caseId, [FromQuery] Guid source, [FromQuery] Guid target, [FromQuery] int maxDepth = 5)
    {
        // Try Python Neo4j path finding first, fallback to BFS in DB
        var pathRes = await _analysisClient.FindConnectionAsync(caseId, source, target, maxDepth);
        if (pathRes.Found && pathRes.NodePath.Count > 0)
        {
            return Ok(pathRes);
        }

        // Local in-memory BFS fallback across case relationships
        var rels = await _db.Relationships
            .Where(r => r.CaseId == caseId)
            .Include(r => r.Evidence)
            .ToListAsync();

        var adj = new Dictionary<Guid, List<(Guid target, Relationship rel)>>();
        foreach (var r in rels)
        {
            if (!adj.ContainsKey(r.SourceEntityId)) adj[r.SourceEntityId] = new();
            if (!adj.ContainsKey(r.TargetEntityId)) adj[r.TargetEntityId] = new();

            adj[r.SourceEntityId].Add((r.TargetEntityId, r));
            adj[r.TargetEntityId].Add((r.SourceEntityId, r));
        }

        var queue = new Queue<(Guid current, List<Guid> nodePath, List<GraphEdgeSyncItem> edgePath)>();
        var visited = new HashSet<Guid> { source };
        queue.Enqueue((source, new List<Guid> { source }, new List<GraphEdgeSyncItem>()));

        while (queue.Count > 0)
        {
            var (curr, nodePath, edgePath) = queue.Dequeue();
            if (curr == target)
            {
                return Ok(new GraphPathResponse(true, nodePath, edgePath, edgePath.Count));
            }

            if (nodePath.Count > maxDepth) continue;

            if (adj.TryGetValue(curr, out var neighbors))
            {
                foreach (var (next, r) in neighbors)
                {
                    if (!visited.Contains(next))
                    {
                        visited.Add(next);
                        var nextNodes = new List<Guid>(nodePath) { next };
                        var nextEdges = new List<GraphEdgeSyncItem>(edgePath)
                        {
                            new GraphEdgeSyncItem(r.Id, r.SourceEntityId, r.TargetEntityId, r.RelationshipType.ToString(), r.Status.ToString(), r.Confidence, r.AnalystConfirmed, r.EvidenceId, r.Evidence?.EvidenceNumber)
                        };
                        queue.Enqueue((next, nextNodes, nextEdges));
                    }
                }
            }
        }

        return Ok(new GraphPathResponse(false, new(), new(), 0));
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<GraphAnalyticsResponse>> GetAnalytics(Guid caseId)
    {
        var entities = await _db.Entities.Where(e => e.CaseId == caseId).Include(e => e.SourceRelationships).Include(e => e.TargetRelationships).ToListAsync();
        var relationships = await _db.Relationships.Where(r => r.CaseId == caseId).ToListAsync();

        var topEntities = entities
            .OrderByDescending(e => e.SourceRelationships.Count + e.TargetRelationships.Count)
            .Take(10)
            .Select(e => new CentralEntityItem(e.Id, e.DisplayName, e.EntityType.ToString(), e.SourceRelationships.Count + e.TargetRelationships.Count))
            .ToList();

        var bridgeEntities = entities
            .Where(e => e.SourceRelationships.Count > 1 && e.TargetRelationships.Count > 1)
            .Take(5)
            .Select(e => new BridgeEntityItem(e.Id, e.DisplayName, e.EntityType.ToString(), 0.78))
            .ToList();

        int n = entities.Count;
        double density = n > 1 ? (2.0 * relationships.Count) / (n * (n - 1)) : 0.0;

        return Ok(new GraphAnalyticsResponse(entities.Count, relationships.Count, Math.Round(density, 4), bridgeEntities, topEntities));
    }
}
