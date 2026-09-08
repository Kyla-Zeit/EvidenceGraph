using System.ComponentModel.DataAnnotations;
using EvidenceGraph.Core.Enums;

namespace EvidenceGraph.Core.Entities;

public class ApplicationUser
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string BadgeOrEmployeeNumber { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Investigator;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? LastLoginAt { get; set; }

    // Navigation
    public ICollection<InvestigationCase> LeadCases { get; set; } = new List<InvestigationCase>();
    public ICollection<EvidenceItem> UploadedEvidence { get; set; } = new List<EvidenceItem>();
    public ICollection<AuditEvent> AuditEvents { get; set; } = new List<AuditEvent>();
}

public class InvestigationCase
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(64)]
    public string CaseNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public CaseStatus Status { get; set; } = CaseStatus.Active;

    public CasePriority Priority { get; set; } = CasePriority.Medium;

    [MaxLength(128)]
    public string Classification { get; set; } = "Cybercrime";

    public Guid? LeadInvestigatorId { get; set; }
    public ApplicationUser? LeadInvestigator { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset OpenedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ClosedAt { get; set; }

    [MaxLength(128)]
    public string Jurisdiction { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new();

    // Navigation
    public ICollection<EvidenceItem> EvidenceItems { get; set; } = new List<EvidenceItem>();
    public ICollection<Entity> Entities { get; set; } = new List<Entity>();
    public ICollection<Relationship> Relationships { get; set; } = new List<Relationship>();
    public ICollection<InvestigativeEvent> Events { get; set; } = new List<InvestigativeEvent>();
    public ICollection<ContradictionCandidate> Contradictions { get; set; } = new List<ContradictionCandidate>();
    public ICollection<InvestigativeNote> Notes { get; set; } = new List<InvestigativeNote>();
    public ICollection<InvestigativeHypothesis> Hypotheses { get; set; } = new List<InvestigativeHypothesis>();
    public ICollection<AuditEvent> AuditEvents { get; set; } = new List<AuditEvent>();
    public ICollection<AiAnalysisRun> AiRuns { get; set; } = new List<AiAnalysisRun>();
}

public class EvidenceItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CaseId { get; set; }
    public InvestigationCase? Case { get; set; }

    [Required]
    [MaxLength(64)]
    public string EvidenceNumber { get; set; } = string.Empty; // e.g. "EV-001"

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public EvidenceType EvidenceType { get; set; } = EvidenceType.Document;

    [MaxLength(256)]
    public string OriginalFilename { get; set; } = string.Empty;

    [MaxLength(512)]
    public string StoredObjectKey { get; set; } = string.Empty;

    [MaxLength(128)]
    public string MimeType { get; set; } = "application/octet-stream";

    public long FileSize { get; set; }

    [Required]
    [MaxLength(64)]
    public string Sha256 { get; set; } = string.Empty;

    [MaxLength(128)]
    public string? Sha512 { get; set; }

    public DateTimeOffset AcquiredAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid UploadedByUserId { get; set; }
    public ApplicationUser? UploadedByUser { get; set; }

    public string SourceDescription { get; set; } = string.Empty;
    public string CollectionMethod { get; set; } = string.Empty;

    [MaxLength(32)]
    public string OriginalOrDerivative { get; set; } = "Original";

    public Guid? ParentEvidenceId { get; set; }
    public EvidenceItem? ParentEvidence { get; set; }
    public ICollection<EvidenceItem> Derivatives { get; set; } = new List<EvidenceItem>();

    public ProcessingStatus ProcessingStatus { get; set; } = ProcessingStatus.Uploaded;

    [MaxLength(64)]
    public string SecurityClassification { get; set; } = "RESTRICTED-LE";

    public ReviewStatus ReviewStatus { get; set; } = ReviewStatus.Pending;

    public string? Notes { get; set; }

    public bool IsQuarantined { get; set; } = false;

    public string? MetadataJson { get; set; }

    public string? ExtractedText { get; set; }

    // Navigation
    public ICollection<EvidenceChunk> Chunks { get; set; } = new List<EvidenceChunk>();
    public ICollection<EntityMention> Mentions { get; set; } = new List<EntityMention>();
    public ICollection<Relationship> ProvenanceRelationships { get; set; } = new List<Relationship>();
    public ICollection<InvestigativeEvent> ProvenanceEvents { get; set; } = new List<InvestigativeEvent>();
}

public class EvidenceChunk
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EvidenceId { get; set; }
    public EvidenceItem? Evidence { get; set; }

    public int ChunkIndex { get; set; }

    public int? PageNumber { get; set; }

    public int StartOffset { get; set; }
    public int EndOffset { get; set; }

    public string Text { get; set; } = string.Empty;

    [MaxLength(64)]
    public string TextHash { get; set; } = string.Empty; // SHA-256 of text chunk

    [MaxLength(32)]
    public string EmbeddingStatus { get; set; } = "Pending";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ICollection<EntityMention> Mentions { get; set; } = new List<EntityMention>();
    public ICollection<AiRetrievedContext> RetrievedInRuns { get; set; } = new List<AiRetrievedContext>();
}
