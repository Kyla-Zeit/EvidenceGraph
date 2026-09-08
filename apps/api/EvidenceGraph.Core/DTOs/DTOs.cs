using EvidenceGraph.Core.Enums;
using EvidenceGraph.Core.Interfaces;

namespace EvidenceGraph.Core.DTOs;

public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, UserDto User);

public record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string BadgeOrEmployeeNumber,
    UserRole Role,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt);

public record CreateCaseRequest(
    string CaseNumber,
    string Title,
    string Description,
    CasePriority Priority,
    string Classification,
    string Jurisdiction,
    List<string>? Tags);

public record UpdateCaseRequest(
    string Title,
    string Description,
    CaseStatus Status,
    CasePriority Priority,
    string Classification,
    string Jurisdiction,
    List<string>? Tags);

public record InvestigationCaseDto(
    Guid Id,
    string CaseNumber,
    string Title,
    string Description,
    CaseStatus Status,
    CasePriority Priority,
    string Classification,
    Guid? LeadInvestigatorId,
    string? LeadInvestigatorName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset OpenedAt,
    DateTimeOffset? ClosedAt,
    string Jurisdiction,
    List<string> Tags,
    int TotalEvidenceCount,
    int TotalEntitiesCount,
    int TotalRelationshipsCount,
    int UnresolvedConflictsCount);

public record EvidenceItemDto(
    Guid Id,
    Guid CaseId,
    string EvidenceNumber,
    string Title,
    string Description,
    EvidenceType EvidenceType,
    string OriginalFilename,
    string StoredObjectKey,
    string MimeType,
    long FileSize,
    string Sha256,
    string? Sha512,
    DateTimeOffset AcquiredAt,
    DateTimeOffset UploadedAt,
    Guid UploadedByUserId,
    string? UploadedByUserName,
    string SourceDescription,
    string CollectionMethod,
    string OriginalOrDerivative,
    Guid? ParentEvidenceId,
    ProcessingStatus ProcessingStatus,
    string SecurityClassification,
    ReviewStatus ReviewStatus,
    string? Notes,
    bool IsQuarantined,
    string? MetadataJson,
    string? ExtractedText);

public record EvidenceChunkDto(
    Guid Id,
    Guid EvidenceId,
    string EvidenceNumber,
    int ChunkIndex,
    int? PageNumber,
    int StartOffset,
    int EndOffset,
    string Text,
    string TextHash,
    DateTimeOffset CreatedAt);

public record EntityDto(
    Guid Id,
    Guid CaseId,
    EntityType EntityType,
    string CanonicalValue,
    string DisplayName,
    string? Description,
    EntityStatus Status,
    double Confidence,
    string CreatedBy,
    DateTimeOffset CreatedAt,
    Guid? ConfirmedByUserId,
    DateTimeOffset? ConfirmedAt,
    int MentionsCount,
    int RelationshipsCount);

public record EntityMentionDto(
    Guid Id,
    Guid EntityId,
    Guid EvidenceId,
    string EvidenceNumber,
    string EvidenceTitle,
    Guid? ChunkId,
    string OriginalText,
    string NormalizedText,
    int StartOffset,
    int EndOffset,
    string ExtractionMethod,
    double Confidence,
    DateTimeOffset CreatedAt);

public record RelationshipDto(
    Guid Id,
    Guid CaseId,
    Guid SourceEntityId,
    string SourceEntityName,
    EntityType SourceEntityType,
    Guid TargetEntityId,
    string TargetEntityName,
    EntityType TargetEntityType,
    RelationshipType RelationshipType,
    RelationshipStatus Status,
    double Confidence,
    DateTimeOffset? StartTime,
    DateTimeOffset? EndTime,
    Guid? EvidenceId,
    string? EvidenceNumber,
    Guid? ChunkId,
    string ExtractionMethod,
    bool AnalystConfirmed,
    DateTimeOffset CreatedAt);

public record InvestigativeEventDto(
    Guid Id,
    Guid CaseId,
    string Title,
    string Description,
    string EventType,
    DateTimeOffset StartTime,
    DateTimeOffset? EndTime,
    TimePrecision TimePrecision,
    Guid? SourceEvidenceId,
    string? SourceEvidenceNumber,
    Guid? SourceChunkId,
    string? SourceTextSnippet,
    List<Guid> EntityIds,
    string ExtractionMethod,
    double Confidence,
    bool Confirmed,
    DateTimeOffset CreatedAt);

public record ContradictionCandidateDto(
    Guid Id,
    Guid CaseId,
    string Title,
    string Reason,
    double Confidence,
    string Status,
    Guid FirstEventId,
    string FirstEventTitle,
    DateTimeOffset FirstEventTime,
    string FirstEvidenceNumber,
    string FirstSnippet,
    Guid SecondEventId,
    string SecondEventTitle,
    DateTimeOffset SecondEventTime,
    string SecondEvidenceNumber,
    string SecondSnippet,
    int? TimeDeltaMinutes,
    string? DistanceEstimate);

public record AuditEventDto(
    Guid AuditId,
    long SequenceNumber,
    DateTimeOffset TimestampUtc,
    Guid UserId,
    string? UserName,
    Guid? CaseId,
    Guid? EvidenceId,
    string Action,
    string ResourceType,
    string ResourceId,
    string StructuredDetails,
    string PreviousHash,
    string EntryHash);

public record AuditVerificationResultDto(
    int TotalEventsChecked,
    bool IsValid,
    long? BrokenSequenceNumber,
    string FirstHash,
    string LatestHash,
    DateTimeOffset VerifiedAt,
    string Status,
    string Details);

public record IntegrityVerificationResultDto(
    Guid EvidenceId,
    string EvidenceNumber,
    string OriginalSha256,
    string CurrentSha256,
    bool IsMatch,
    string Status,
    DateTimeOffset VerifiedAt,
    long ByteLength);

public record AiCitationDto(
    string CitationKey,
    Guid EvidenceId,
    string EvidenceNumber,
    Guid ChunkId,
    int? PageNumber,
    string Snippet,
    double Confidence);

public record AiAnalysisRunDto(
    Guid Id,
    Guid CaseId,
    Guid UserId,
    string Question,
    string AnswerMarkdown,
    string ModelProvider,
    string Model,
    string PromptTemplateVersion,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    long LatencyMs,
    int InputTokenEstimate,
    int OutputTokenEstimate,
    string Status,
    string ConfidenceCategory,
    AiConfidenceFactors ConfidenceFactors,
    List<AiCitationDto> Citations,
    int RetrievedContextCount);
public record GraphNodeDto
{
    public string Id { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public EntityType EntityType { get; init; }
    public EntityStatus Status { get; init; }
    public double Confidence { get; init; }
    public bool IsConfirmed { get; init; }
    public int Degree { get; init; }
}

public record GraphEdgeDto
{
    public string Id { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public string Target { get; init; } = string.Empty;
    public RelationshipType RelationshipType { get; init; }
    public RelationshipStatus Status { get; init; }
    public double Confidence { get; init; }
    public bool IsConfirmed { get; init; }
    public string? EvidenceId { get; init; }
    public string? EvidenceNumber { get; init; }
}

public record GraphDataDto
{
    public List<GraphNodeDto> Nodes { get; init; } = new();
    public List<GraphEdgeDto> Edges { get; init; } = new();
}
