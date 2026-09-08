# AGENTS.md - Agent Operating Guidelines for EvidenceGraph

This repository implements **EvidenceGraph**, an AI-assisted digital evidence and investigative intelligence platform.

## Key Directives for AI Agents
1. **Authoritative vs Derived Stores**:
   - PostgreSQL (`apps/api`) is the sole authoritative system of record for users, cases, evidence, chunks, entities, confirmed items, events, audit logs, and AI runs.
   - Neo4j (`apps/analysis-service`) is a derived analytical graph projection. All graph data must be completely rebuildable from PostgreSQL on demand.
2. **Evidence Integrity & Provenance**:
   - Original evidence objects in MinIO (`evidence-original`) are write-once and immutable.
   - All entity mentions and relationships must track their evidence provenance (`EvidenceId`, `ChunkId`, character offsets).
3. **Audit Trail Cryptographic Chain**:
   - Application audit events append to a verifiable SHA-256 hash-chain:
     `EntryHash = SHA256(canonical JSON representation + PreviousHash)`.
4. **Human-in-the-Loop AI & Entity Resolution**:
   - AI outputs and NLP extractions are suggestions.
   - Never auto-merge ambiguous entities without human analyst confirmation.
   - High graph centrality / degree denotes network prominence, never guilt or culpability.
5. **Testing & Code Quality**:
   - Maintain C# nullable reference safety and clean architecture in `apps/api`.
   - Maintain Pydantic v2 validation and typed endpoints in `apps/analysis-service`.
   - Maintain strict TypeScript and component modularity in `apps/web`.
   - Ensure tests are run and passing after every phase.
