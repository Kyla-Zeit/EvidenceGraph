using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Enums;

namespace EvidenceGraph.Core.Interfaces;

public interface IStorageService
{
    Task<string> UploadOriginalAsync(string objectKey, Stream stream, string contentType, CancellationToken ct = default);
    Task<string> UploadDerivedAsync(string objectKey, Stream stream, string contentType, CancellationToken ct = default);
    Task<Stream> GetOriginalAsync(string objectKey, CancellationToken ct = default);
    Task<Stream> GetDerivedAsync(string objectKey, CancellationToken ct = default);
    Task<bool> ExistsOriginalAsync(string objectKey, CancellationToken ct = default);
    Task<(string sha256, string sha512, long size)> CalculateHashesAndSizeAsync(Stream stream, CancellationToken ct = default);
}

public interface IAuditService
{
    Task<AuditEvent> RecordEventAsync(
        Guid userId,
        string action,
        string resourceType,
        string resourceId,
        object structuredDetails,
        Guid? caseId = null,
        Guid? evidenceId = null,
        CancellationToken ct = default);

    Task<(bool isValid, int totalEvents, long? brokenSequence, string firstHash, string latestHash, string message)> VerifyAuditChainAsync(
        Guid? caseId = null,
        CancellationToken ct = default);
}

public interface IEvidenceIntegrityService
{
    Task<(bool isMatch, string originalSha256, string currentSha256, long size, string status)> VerifyEvidenceIntegrityAsync(
        Guid evidenceId,
        CancellationToken ct = default);
}

public interface IAnalysisServiceClient
{
    Task<AnalysisExtractResponse> ExtractAsync(AnalysisExtractRequest request, CancellationToken ct = default);
    Task<EntityResolutionResponse> SuggestDuplicatesAsync(EntityResolutionRequest request, CancellationToken ct = default);
    Task<TimelineContradictionsResponse> CheckContradictionsAsync(TimelineContradictionsRequest request, CancellationToken ct = default);
    Task<GraphRebuildResponse> RebuildCaseGraphAsync(GraphRebuildRequest request, CancellationToken ct = default);
    Task<GraphPathResponse> FindConnectionAsync(Guid caseId, Guid sourceEntityId, Guid targetEntityId, int maxDepth = 5, CancellationToken ct = default);
    Task<GraphAnalyticsResponse> GetAnalyticsAsync(Guid caseId, CancellationToken ct = default);
    Task<AiAnalysisResponse> QueryGraphRagAsync(AiAnalysisRequest request, CancellationToken ct = default);
}

// Request / Response records for Analysis Client
public record AnalysisExtractRequest(Guid CaseId, Guid EvidenceId, string EvidenceNumber, string ContentType, string Text, string? MetadataJson);
public record ExtractedMentionItem(string OriginalText, string NormalizedText, string EntityType, string CanonicalValue, string DisplayName, int StartOffset, int EndOffset, string ExtractionMethod, double Confidence);
public record ExtractedRelationshipItem(string SourceCanonical, string SourceType, string TargetCanonical, string TargetType, string RelationshipType, double Confidence, string? Snippet);
public record ExtractedEventItem(string Title, string Description, string EventType, string StartTime, string? EndTime, string TimePrecision, List<string> EntityCanonicals, double Confidence);
public record AnalysisExtractResponse(List<ExtractedMentionItem> Mentions, List<ExtractedRelationshipItem> Relationships, List<ExtractedEventItem> Events);

public record EntityResolutionRequest(Guid CaseId, List<EntityToCompare> Entities);
public record EntityToCompare(Guid Id, string EntityType, string CanonicalValue, string DisplayName, List<string> SharedIdentifiers);
public record DuplicateSuggestionItem(Guid EntityAId, Guid EntityBId, double SimilarityScore, List<string> MatchingFactors, string RecommendedAction);
public record EntityResolutionResponse(List<DuplicateSuggestionItem> Suggestions);

public record TimelineContradictionsRequest(Guid CaseId, List<EventToCompare> Events);
public record EventToCompare(Guid Id, string Title, string EventType, DateTimeOffset StartTime, DateTimeOffset? EndTime, string TimePrecision, Guid? SourceEvidenceId, string? SourceEvidenceNumber, string? Snippet);
public record ContradictionItem(Guid FirstEventId, Guid SecondEventId, string Title, string Reason, double Confidence, int? TimeDeltaMinutes, string? DistanceEstimate);
public record TimelineContradictionsResponse(List<ContradictionItem> Contradictions);

public record GraphRebuildRequest(Guid CaseId, List<GraphNodeSyncItem> Nodes, List<GraphEdgeSyncItem> Edges);
public record GraphNodeSyncItem(Guid Id, string Label, string EntityType, string CanonicalValue, string DisplayName, string Status, double Confidence, bool IsConfirmed);
public record GraphEdgeSyncItem(Guid Id, Guid SourceId, Guid TargetId, string RelationshipType, string Status, double Confidence, bool IsConfirmed, Guid? EvidenceId, string? EvidenceNumber);
public record GraphRebuildResponse(bool Success, int NodesProjected, int RelationshipsProjected, string Message);

public record GraphPathResponse(bool Found, List<Guid> NodePath, List<GraphEdgeSyncItem> EdgePath, int PathLength);
public record GraphAnalyticsResponse(int NodeCount, int EdgeCount, double Density, List<BridgeEntityItem> BridgeEntities, List<CentralEntityItem> TopCentralEntities);
public record BridgeEntityItem(Guid EntityId, string DisplayName, string EntityType, double Betweenness);
public record CentralEntityItem(Guid EntityId, string DisplayName, string EntityType, int Degree);

public record AiAnalysisRequest(Guid CaseId, Guid UserId, string Question, List<EvidenceChunkContext> Chunks, List<GraphPathSync> GraphPaths, List<EventToCompare> Events, string? Provider = null);
public record EvidenceChunkContext(Guid ChunkId, Guid EvidenceId, string EvidenceNumber, string Title, string Text, int ChunkIndex, int? PageNumber);
public record GraphPathSync(string SourceLabel, string Relationship, string TargetLabel, string? EvidenceNumber);
public record AiCitationItem(string CitationKey, Guid EvidenceId, string EvidenceNumber, Guid ChunkId, int? PageNumber, string Snippet, double Confidence);
public record AiConfidenceFactors(List<string> Positive, List<string> Negative);
public record AiAnalysisResponse(string AnswerMarkdown, string ModelProvider, string Model, string ConfidenceCategory, AiConfidenceFactors ConfidenceFactors, List<AiCitationItem> Citations, long LatencyMs, int InputTokens, int OutputTokens);
