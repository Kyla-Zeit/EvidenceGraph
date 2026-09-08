using System.ComponentModel.DataAnnotations;
using EvidenceGraph.Core.Enums;

namespace EvidenceGraph.Core.Entities;

public class Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    public EntityType EntityType { get; set; } = EntityType.Person;

    [Required]
    [MaxLength(256)]
    public string CanonicalValue { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string DisplayName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public EntityStatus Status { get; set; } = EntityStatus.Extracted;

    public double Confidence { get; set; } = 1.0;

    [MaxLength(128)]
    public string CreatedBy { get; set; } = "System"; // "System", "Analyst", "NLP"

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid? ConfirmedByUserId { get; set; }
    public ApplicationUser? ConfirmedByUser { get; set; }
    public DateTimeOffset? ConfirmedAt { get; set; }

    // Navigation
    public ICollection<EntityMention> Mentions { get; set; } = new List<EntityMention>();
    public ICollection<Relationship> SourceRelationships { get; set; } = new List<Relationship>();
    public ICollection<Relationship> TargetRelationships { get; set; } = new List<Relationship>();
}

public class EntityMention
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EntityId { get; set; }
    public Entity? Entity { get; set; }

    public Guid EvidenceId { get; set; }
    public EvidenceItem? Evidence { get; set; }

    public Guid? ChunkId { get; set; }
    public EvidenceChunk? Chunk { get; set; }

    [Required]
    public string OriginalText { get; set; } = string.Empty;

    [Required]
    public string NormalizedText { get; set; } = string.Empty;

    public int StartOffset { get; set; }
    public int EndOffset { get; set; }

    [MaxLength(64)]
    public string ExtractionMethod { get; set; } = "Deterministic"; // "Deterministic", "NLP", "Manual"

    public double Confidence { get; set; } = 1.0;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Relationship
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    public Guid SourceEntityId { get; set; }
    public Entity? SourceEntity { get; set; }

    public Guid TargetEntityId { get; set; }
    public Entity? TargetEntity { get; set; }

    public RelationshipType RelationshipType { get; set; } = RelationshipType.ASSOCIATED_WITH;

    public RelationshipStatus Status { get; set; } = RelationshipStatus.Extracted;

    public double Confidence { get; set; } = 1.0;

    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }

    public Guid? EvidenceId { get; set; }
    public EvidenceItem? Evidence { get; set; }

    public Guid? ChunkId { get; set; }

    [MaxLength(64)]
    public string ExtractionMethod { get; set; } = "Deterministic";

    public bool AnalystConfirmed { get; set; } = false;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class InvestigativeEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [MaxLength(64)]
    public string EventType { get; set; } = "General"; // "Communication", "Transaction", "Travel", "Login", "Statement"

    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }

    public TimePrecision TimePrecision { get; set; } = TimePrecision.Exact;

    public Guid? SourceEvidenceId { get; set; }
    public EvidenceItem? SourceEvidence { get; set; }

    public Guid? SourceChunkId { get; set; }

    public List<Guid> EntityIds { get; set; } = new();

    [MaxLength(64)]
    public string ExtractionMethod { get; set; } = "Deterministic";

    public double Confidence { get; set; } = 1.0;

    public bool Confirmed { get; set; } = false;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class ContradictionCandidate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;

    public double Confidence { get; set; } = 0.85;

    [MaxLength(32)]
    public string Status { get; set; } = "Flagged"; // "Flagged", "Reviewed", "Dismissed"

    public Guid FirstEventId { get; set; }
    public Guid SecondEventId { get; set; }

    public int? TimeDeltaMinutes { get; set; }

    [MaxLength(128)]
    public string? DistanceEstimate { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class InvestigativeNote
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    public Guid AuthorUserId { get; set; }
    public ApplicationUser? AuthorUser { get; set; }

    public Guid? EvidenceId { get; set; }
    public Guid? EntityId { get; set; }
    public Guid? RelationshipId { get; set; }
    public Guid? EventId { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class InvestigativeHypothesis
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public HypothesisStatus Status { get; set; } = HypothesisStatus.Open;

    public List<Guid> SupportingEvidenceIds { get; set; } = new();
    public List<Guid> ContradictingEvidenceIds { get; set; } = new();
    public List<string> UnresolvedQuestions { get; set; } = new();

    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class AuditEvent
{
    public Guid AuditId { get; set; } = Guid.NewGuid();

    public long SequenceNumber { get; set; }

    public DateTimeOffset TimestampUtc { get; set; } = DateTimeOffset.UtcNow;

    public Guid UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public Guid? CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    public Guid? EvidenceId { get; set; }

    [Required]
    [MaxLength(64)]
    public string Action { get; set; } = string.Empty; // "EvidenceUploaded", "IntegrityVerified", "EntityConfirmed", "GraphRebuilt"

    [Required]
    [MaxLength(64)]
    public string ResourceType { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string ResourceId { get; set; } = string.Empty;

    public string StructuredDetails { get; set; } = "{}";

    [Required]
    [MaxLength(64)]
    public string PreviousHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string EntryHash { get; set; } = string.Empty;
}

public class AiAnalysisRun
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser? User { get; set; }

    [Required]
    public string Question { get; set; } = string.Empty;

    public string AnswerMarkdown { get; set; } = string.Empty;

    [MaxLength(64)]
    public string ModelProvider { get; set; } = "Mock";

    [MaxLength(64)]
    public string Model { get; set; } = "evidencegraph-mock-v1";

    [MaxLength(32)]
    public string PromptTemplateVersion { get; set; } = "1.0.0";

    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CompletedAt { get; set; } = DateTimeOffset.UtcNow;

    public long LatencyMs { get; set; }
    public int InputTokenEstimate { get; set; }
    public int OutputTokenEstimate { get; set; }

    [MaxLength(32)]
    public string Status { get; set; } = "Completed";

    [MaxLength(32)]
    public string ConfidenceCategory { get; set; } = "High"; // "High", "Moderate", "Low"

    public string ConfidenceFactorsJson { get; set; } = "{}";

    public string CitationsJson { get; set; } = "[]";

    // Navigation
    public ICollection<AiRetrievedContext> RetrievedContexts { get; set; } = new List<AiRetrievedContext>();
}

public class AiRetrievedContext
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AiRunId { get; set; }
    public AiAnalysisRun? AiRun { get; set; }

    public Guid EvidenceId { get; set; }
    public EvidenceItem? Evidence { get; set; }

    public Guid ChunkId { get; set; }
    public EvidenceChunk? Chunk { get; set; }

    [MaxLength(64)]
    public string RetrievalMethod { get; set; } = "GraphRAG"; // "Vector", "Keyword", "GraphPath", "GraphRAG"

    public double RetrievalScore { get; set; }

    public int Position { get; set; }
}
