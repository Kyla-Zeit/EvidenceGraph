// EvidenceGraph Shared Types & Domain Contracts

export type UserRole = "Administrator" | "Investigator" | "Analyst" | "ReadOnlyReviewer";

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  badgeOrEmployeeNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

export type CaseStatus = "Open" | "Active" | "Suspended" | "Closed" | "Archived";
export type CasePriority = "Low" | "Medium" | "High" | "Critical";

export interface CreateCaseRequest {
  caseNumber: string;
  title: string;
  description: string;
  priority: CasePriority;
  classification: string;
  jurisdiction: string;
  tags: string[];
}

export interface InvestigationCaseDto {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  classification: string;
  leadInvestigatorId?: string;
  leadInvestigatorName?: string;
  createdAt: string;
  updatedAt: string;
  openedAt: string;
  closedAt?: string;
  jurisdiction: string;
  tags: string[];
  totalEvidenceCount: number;
  totalEntitiesCount: number;
  totalRelationshipsCount: number;
  unresolvedConflictsCount: number;
}

export type EvidenceType =
  | "Document"
  | "Email"
  | "Image"
  | "Audio"
  | "Video"
  | "CallRecord"
  | "MessageExport"
  | "TransactionRecord"
  | "WebCapture"
  | "Report"
  | "Dataset"
  | "Other";

export type ProcessingStatus =
  | "Uploaded"
  | "HashVerified"
  | "SecurityScanning"
  | "Parsing"
  | "TextExtraction"
  | "MetadataExtraction"
  | "EntityExtraction"
  | "RelationshipExtraction"
  | "Embedding"
  | "GraphIndexing"
  | "AwaitingReview"
  | "Complete"
  | "Failed"
  | "Quarantined";

export type ReviewStatus = "Pending" | "UnderReview" | "Approved" | "Flagged" | "Rejected";

export interface EvidenceItemDto {
  id: string;
  caseId: string;
  evidenceNumber: string;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  originalFilename: string;
  storedObjectKey: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  sha512?: string;
  acquiredAt: string;
  uploadedAt: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
  sourceDescription: string;
  collectionMethod: string;
  originalOrDerivative: "Original" | "Derivative";
  parentEvidenceId?: string;
  processingStatus: ProcessingStatus;
  securityClassification: string;
  reviewStatus: ReviewStatus;
  notes?: string;
  isQuarantined: boolean;
  metadataJson?: string;
  extractedText?: string;
}

export interface EvidenceChunkDto {
  id: string;
  evidenceId: string;
  evidenceNumber: string;
  chunkIndex: number;
  pageNumber?: number;
  startOffset: number;
  endOffset: number;
  text: string;
  textHash: string;
  createdAt: string;
}

export type EntityType =
  | "Person"
  | "Organization"
  | "EmailAddress"
  | "PhoneNumber"
  | "Username"
  | "SocialAccount"
  | "Domain"
  | "IPAddress"
  | "URL"
  | "Device"
  | "Vehicle"
  | "Location"
  | "CryptocurrencyWallet"
  | "BankAccount"
  | "FileHash"
  | "OtherIdentifier";

export type EntityStatus = "Extracted" | "Suggested" | "Confirmed" | "Rejected" | "Merged";

export interface EntityDto {
  id: string;
  caseId: string;
  entityType: EntityType;
  canonicalValue: string;
  displayName: string;
  description?: string;
  status: EntityStatus;
  confidence: number;
  createdBy: string;
  createdAt: string;
  confirmedByUserId?: string;
  confirmedAt?: string;
  mentionsCount: number;
  relationshipsCount: number;
}

export interface EntityMentionDto {
  id: string;
  entityId: string;
  evidenceId: string;
  evidenceNumber: string;
  evidenceTitle: string;
  chunkId?: string;
  originalText: string;
  normalizedText: string;
  startOffset: number;
  endOffset: number;
  extractionMethod: "Deterministic" | "NLP" | "AnalystManual";
  confidence: number;
  createdAt: string;
}

export type RelationshipType =
  | "COMMUNICATED_WITH"
  | "SENT_MESSAGE_TO"
  | "CALLED"
  | "EMAILED"
  | "USED"
  | "OWNS"
  | "ASSOCIATED_WITH"
  | "MEMBER_OF"
  | "MENTIONED_IN"
  | "LOCATED_AT"
  | "VISITED"
  | "TRANSACTED_WITH"
  | "RESOLVES_TO"
  | "REGISTERED_TO"
  | "ACCESSED_FROM"
  | "HAS_ATTACHMENT"
  | "SAME_AS"
  | "POSSIBLY_SAME_AS";

export type RelationshipStatus = "Extracted" | "Suggested" | "Confirmed" | "Rejected";

export interface RelationshipDto {
  id: string;
  caseId: string;
  sourceEntityId: string;
  sourceEntityName: string;
  sourceEntityType: EntityType;
  targetEntityId: string;
  targetEntityName: string;
  targetEntityType: EntityType;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  confidence: number;
  startTime?: string;
  endTime?: string;
  evidenceId?: string;
  evidenceNumber?: string;
  chunkId?: string;
  extractionMethod: string;
  analystConfirmed: boolean;
  createdAt: string;
}

export type TimePrecision = "Exact" | "Approximate" | "DateOnly" | "Range" | "Unknown";

export interface InvestigativeEventDto {
  id: string;
  caseId: string;
  title: string;
  description: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  timePrecision: TimePrecision;
  sourceEvidenceId?: string;
  sourceEvidenceNumber?: string;
  sourceChunkId?: string;
  sourceTextSnippet?: string;
  entityIds: string[];
  extractionMethod: string;
  confidence: number;
  confirmed: boolean;
  createdAt: string;
}

export interface ContradictionCandidateDto {
  id: string;
  caseId: string;
  title: string;
  reason: string;
  confidence: number;
  status: "Flagged" | "Reviewed" | "Dismissed";
  firstEventId: string;
  firstEventTitle: string;
  firstEventTime: string;
  firstEvidenceNumber: string;
  firstSnippet: string;
  secondEventId: string;
  secondEventTitle: string;
  secondEventTime: string;
  secondEvidenceNumber: string;
  secondSnippet: string;
  timeDeltaMinutes?: number;
  distanceEstimate?: string;
}

export interface AuditEventDto {
  auditId: string;
  sequenceNumber: number;
  timestampUtc: string;
  userId: string;
  userName?: string;
  caseId?: string;
  evidenceId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  structuredDetails: string;
  previousHash: string;
  entryHash: string;
}

export interface AuditVerificationResultDto {
  totalEventsChecked: number;
  isValid: boolean;
  brokenSequenceNumber?: number;
  firstHash: string;
  latestHash: string;
  verifiedAt: string;
  status: "MATCH" | "INTEGRITY FAILURE";
  details: string;
}

export interface IntegrityVerificationResultDto {
  evidenceId: string;
  evidenceNumber: string;
  originalSha256: string;
  currentSha256: string;
  isMatch: boolean;
  status: "MATCH" | "INTEGRITY FAILURE";
  verifiedAt: string;
  byteLength: number;
}

export interface AiCitationDto {
  citationKey: string; // e.g. "[EV-014 §12]"
  evidenceId: string;
  evidenceNumber: string;
  chunkId: string;
  pageNumber?: number;
  snippet: string;
  confidence: number;
}

export interface AiAnalysisRunDto {
  id: string;
  caseId: string;
  userId: string;
  question: string;
  answerMarkdown: string;
  modelProvider: string;
  model: string;
  promptTemplateVersion: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  inputTokenEstimate: number;
  outputTokenEstimate: number;
  status: "Completed" | "Failed" | "Refused";
  confidenceCategory: "High" | "Moderate" | "Low";
  confidenceFactors: { positive: string[]; negative: string[] };
  citations: AiCitationDto[];
  retrievedContextCount: number;
}

export interface GraphNodeDto {
  id: string;
  label: string;
  entityType: EntityType;
  status: EntityStatus;
  confidence: number;
  isConfirmed: boolean;
  degree?: number;
}

export interface GraphEdgeDto {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  confidence: number;
  isConfirmed: boolean;
  evidenceId?: string;
  evidenceNumber?: string;
}

export interface GraphDataDto {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
}
