# EvidenceGraph Security Architecture & Threat Model

## Executive Summary
EvidenceGraph is engineered under the strict operational security assumption that **digital evidence is hostile and untrusted**. The platform is architected to resist data tampering, unauthorized exfiltration, prompt injection attacks, and repudiation in adversarial legal environments.

---

## 1. Security Axioms & Core Tenets
1. **Evidence First. AI Second**: AI models generate hypotheses and citations, never ungrounded facts or binding decisions.
2. **Untrusted Evidence Boundary**: All ingested evidence files (PDFs, emails, images, CSVs) are treated as potential exploit vectors and never executed or evaluated directly in secure runtime contexts.
3. **Cryptographic Immutability**: Evidence records are write-once, and audit logs form a strictly monotonic, forward-linked SHA-256 hash chain.
4. **Principle of Least Privilege**: Granular Role-Based Access Control (RBAC) partitions administrative capabilities from investigative review.

---

## 2. STRIDE Threat Analysis

| STRIDE Category | Specific Threat | Platform Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Adversary impersonates an investigator to manipulate case files. | ASP.NET Core Identity with signed JWTs (HMAC-SHA256 / RSA), configurable token lifetimes, and mandatory role authorization on all mutations. |
| **Tampering** | Rogue actor alters an ingested PDF or replaces an evidence file on disk. | Real-time byte-stream verification (`POST /verify-integrity`) comparing live MinIO S3 streams against immutable database SHA-256 and SHA-512 hashes. Write-once MinIO bucket policies. |
| **Repudiation** | User denies having approved or deleted an entity/relationship. | Monotonically sequenced SHA-256 Audit Trail Hash Chain recording UTC timestamp, User ID, Action, Resource ID, and Canonical JSON payload. Re-verified on demand. |
| **Information Disclosure** | Unauthorized cross-case data leakage between isolated investigations. | Strict multi-tenancy case isolation (`CaseId` partitioning in EF Core DbContext and Neo4j subgraphs). Redaction modes for sensitive PII. |
| **Denial of Service** | Resource exhaustion via massive file upload or cyclic graph queries. | Configurable file upload limits, streaming hash calculation without unbounded memory buffering, and query depth bounding (`maxDepth=5`) on graph path algorithms. |
| **Elevation of Privilege** | Prompt injection attacks hijacking the AI to execute arbitrary tool calls or alter investigative findings. | Multi-layered defense-in-depth: structural XML fencing, heuristic pre-scanning, system prompt isolation, and deterministic citation validation. |

---

## 3. Threat Matrix & Mitigation Verification

### A. Prompt Injection Defense
EvidenceGraph isolates external text inside `<evidence_context id="...">` envelopes. System instructions strictly instruct the model that content inside these envelopes is passive observational data. Pre-execution heuristics flag and quarantine jailbreak patterns.

### B. Audit Trail Hash Chain Mathematics
$$\text{EntryHash}_n = \text{SHA256}(\text{SequenceNumber} \mathbin{\Vert} \text{TimestampUtc} \mathbin{\Vert} \text{UserId} \mathbin{\Vert} \text{Action} \mathbin{\Vert} \text{ResourceId} \mathbin{\Vert} \text{CanonicalJSON} \mathbin{\Vert} \text{EntryHash}_{n-1})$$
Any retroactive database row update invalidates the verification algorithm at $O(N)$ speed.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Permission / Action | Administrator | Investigator | Analyst | ReadOnlyReviewer |
| :--- | :---: | :---: | :---: | :---: |
| Create / Close Cases | Yes | Yes | No | No |
| Ingest Digital Evidence | Yes | Yes | No | No |
| Confirm / Reject Entities & Links | Yes | Yes | No | No |
| Execute GraphRAG Queries | Yes | Yes | Yes | Yes |
| View Link Graph & Timelines | Yes | Yes | Yes | Yes |
| Verify Cryptographic Audit Chain | Yes | Yes | Yes | Yes |
| Manage Users & System Config | Yes | No | No | No |
