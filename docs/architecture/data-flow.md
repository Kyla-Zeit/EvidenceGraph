# EvidenceGraph Architecture & Data Flow Specification

## Architectural Overview
EvidenceGraph follows a clean, decoupled microservices architecture with a strict boundary between authoritative data storage (PostgreSQL), derived analytical projections (Neo4j), immutable object storage (MinIO), and presentation (React 19).

```
                      +-----------------------------+
                      |   React 19 + TypeScript     |
                      |   Vite + Cytoscape.js SPA   |
                      +--------------+--------------+
                                     |
                          HTTPS / REST API + JWT
                                     |
                      +--------------v--------------+
                      |   ASP.NET Core 8.0 Web API  |
                      |   (Authoritative System)    |
                      +------+---------------+------+
                             |               |
                 Entity/Rel  |               | Storage Stream
                 Extraction  |               | & Verification
                             |               |
              +--------------v-----+   +-----v---------------+
              | Python 3.11        |   | MinIO S3            |
              | FastAPI Service    |   | Immutable Storage   |
              | (NLP/NER/GraphRAG) |   | (evidence-original) |
              +--------+-----------+   +---------------------+
                       |
             Cypher    | Projection
             Queries   | Sync
                       |
              +--------v-----------+
              | Neo4j 5.x /        |
              | NetworkX Graph     |
              +--------------------+
```

---

## 1. Evidence Ingestion & Cryptographic Hashing Pipeline
1. **Upload Initiation**: Investigator uploads digital artifact via `POST /api/v1/cases/{caseId}/evidence/upload`.
2. **Dual-Digest Streaming**: ASP.NET Core streams byte data simultaneously to MinIO (`evidence-original`) while calculating `SHA-256` and `SHA-512` digests in memory.
3. **Database Commit**: Metadata, object key, digests, acquisition details, and classification are recorded in PostgreSQL.
4. **Audit Hash Link**: An audit event is generated, canonicalized, and linked into the SHA-256 audit hash chain.
5. **Extraction Dispatch**: Asynchronous task triggers Python Analysis Service (`POST /extract/deterministic` and `POST /extract/nlp`).

---

## 2. Entity Resolution & Knowledge Graph Projection
1. **Deterministic Extraction**: Regex extractors parse RFC 5322 emails, E.164 phone numbers, IPv4/IPv6, FQDNs, crypto wallets (BTC/ETH/TRON).
2. **NLP & Entity Resolution**: Named entity recognition extracts Persons and Organizations. RapidFuzz token-sort similarity groups aliases (e.g. "Alex Mercer", "A. Mercer", "Alexander Mercer") into duplicate suggestion clusters.
3. **Graph Projection**: Confirmed and suggested relationships are projected into Neo4j nodes and edges with PostgreSQL identifiers (`EntityId`, `RelationshipId`, `CaseId`).
4. **In-Memory Fallback**: If Neo4j is unavailable, NetworkX constructs an in-memory graph projection ensuring 100% operational uptime.

---

## 3. Citation-Grounded GraphRAG Reasoning Loop
1. **Query Ingestion**: Investigator asks a question (e.g., *"How are Alex Mercer and Jordan Ellis connected?"*).
2. **Graph Context Traversal**: Python service finds shortest paths and subgraphs connecting relevant entities in Neo4j/NetworkX.
3. **Deterministic Chunk Retrieval**: Relational chunks (`[EV-001 §1]`, `[EV-014 §12]`) corresponding to traversed evidence nodes are retrieved.
4. **Prompt Delimitation**: Chunks are wrapped in `<evidence_context>` tags with prompt injection heuristics applied.
5. **Grounded Synthesis**: LLM provider synthesizes answer with mandatory chunk citations (`[EV-xxx §yy]`).
6. **Execution Trace Logging**: Full prompt, latency, tokens, citations, and confidence factor breakdown are persisted in PostgreSQL.
