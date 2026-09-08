namespace EvidenceGraph.Core.Enums;

public enum UserRole
{
    Administrator,
    Investigator,
    Analyst,
    ReadOnlyReviewer
}

public enum CaseStatus
{
    Open,
    Active,
    Suspended,
    Closed,
    Archived
}

public enum CasePriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum EvidenceType
{
    Document,
    Email,
    Image,
    Audio,
    Video,
    CallRecord,
    MessageExport,
    TransactionRecord,
    WebCapture,
    Report,
    Dataset,
    Other
}

public enum ProcessingStatus
{
    Uploaded,
    HashVerified,
    SecurityScanning,
    Parsing,
    TextExtraction,
    MetadataExtraction,
    EntityExtraction,
    RelationshipExtraction,
    Embedding,
    GraphIndexing,
    AwaitingReview,
    Complete,
    Failed,
    Quarantined
}

public enum ReviewStatus
{
    Pending,
    UnderReview,
    Approved,
    Flagged,
    Rejected
}

public enum EntityType
{
    Person,
    Organization,
    EmailAddress,
    PhoneNumber,
    Username,
    SocialAccount,
    Domain,
    IPAddress,
    URL,
    Device,
    Vehicle,
    Location,
    CryptocurrencyWallet,
    BankAccount,
    FileHash,
    OtherIdentifier
}

public enum EntityStatus
{
    Extracted,
    Suggested,
    Confirmed,
    Rejected,
    Merged
}

public enum RelationshipType
{
    COMMUNICATED_WITH,
    SENT_MESSAGE_TO,
    CALLED,
    EMAILED,
    USED,
    OWNS,
    ASSOCIATED_WITH,
    MEMBER_OF,
    MENTIONED_IN,
    LOCATED_AT,
    VISITED,
    TRANSACTED_WITH,
    RESOLVES_TO,
    REGISTERED_TO,
    ACCESSED_FROM,
    HAS_ATTACHMENT,
    SAME_AS,
    POSSIBLY_SAME_AS
}

public enum RelationshipStatus
{
    Extracted,
    Suggested,
    Confirmed,
    Rejected
}

public enum TimePrecision
{
    Exact,
    Approximate,
    DateOnly,
    Range,
    Unknown
}

public enum HypothesisStatus
{
    Open,
    Supported,
    Weakened,
    Rejected,
    Resolved
}
