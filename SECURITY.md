# Security Policy

## Scope and Intent
**EvidenceGraph** is an educational and portfolio reference platform demonstrating secure digital evidence management, knowledge graph analytics, and citation-grounded AI analysis.

> [!IMPORTANT]
> **Synthetic Data Only**: All bundled evidence, entities, identifiers, communications, transactions, and scenarios are strictly synthetic and fictional. No real personal data or active OSINT collection is performed or bundled.

## Reporting a Vulnerability
If you discover a security vulnerability within EvidenceGraph:
1. Do not open a public issue on GitHub.
2. Report the details confidentially to the maintainers at `security@evidencegraph.local`.
3. Provide a reproduction script, impacted components, and potential remediation steps.

## Core Security Architecture Principles
1. **Evidence First, AI Second**: AI models are untrusted analytical aids and cannot directly alter authoritative evidence records in PostgreSQL.
2. **Immutable Original Evidence**: Original evidence objects stored in MinIO `evidence-original` bucket are write-once. Re-hashing verifies physical integrity against database-stored SHA-256 and SHA-512 digests.
3. **Tamper-Evident Audit Trail**: All system actions append to a cryptographically linked SHA-256 hash-chain:
   $$\text{EntryHash} = \text{SHA256}(\text{CanonicalJSON(Event)} + \text{PreviousHash})$$
4. **Hostile File Handling**: Uploaded files undergo MIME type verification, size bounding, and quarantine status tagging. Active content, macros, and embedded scripts are never executed.
5. **Prompt-Injection Defense**: Documents and user inputs are strictly separated in RAG prompts with delimiter envelopes; document text is treated as passive evidence data rather than system instructions.
6. **Case Isolation & RBAC**: Every analytical query, graph lookup, and AI operation is strictly partitioned by `CaseId` and subject to server-side role validation.
