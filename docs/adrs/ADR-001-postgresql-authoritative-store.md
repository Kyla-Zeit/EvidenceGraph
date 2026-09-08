# ADR-001: PostgreSQL as Authoritative System of Record

## Status
Accepted

## Context
In digital forensics, investigative intelligence, and legal proceedings, data integrity, strict ACID guarantees, granular relational constraints, and verifiable provenance are foundational requirements. A forensic platform cannot rely on eventually consistent, schema-less, or specialized graph databases as the primary source of legal truth. 

If a graph database experiences index corruption, node desynchronization, or data loss, the system must possess the capability to deterministically reconstruct the complete investigative knowledge graph directly from an unassailable relational baseline.

## Decision
We establish **PostgreSQL 16** (managed via EF Core 8.0 on ASP.NET Core) as the **single authoritative system of record** for EvidenceGraph:
1. All digital evidence metadata, forensic hashes (SHA-256 / SHA-512), chain of custody events, user identities, roles, investigative cases, extracted entities, relationships, timeline events, and tamper-evident audit logs are persistently stored in PostgreSQL.
2. Neo4j and in-memory graph structures are strictly treated as **ephemeral derived projections**.
3. Deleting or rebuilding the graph database has zero effect on the legal integrity or persistence of case data; the graph projection can be re-synchronized idempotently via API endpoints (`POST /api/v1/cases/{caseId}/graph/rebuild`).

## Consequences

### Positive
- **Guaranteed Consistency & ACID Compliance**: Relational constraints, cascading rules, and transaction boundaries prevent orphan entities or ungrounded claims.
- **Auditability**: Complete historical change tracking and cryptographic hash chains are anchored in relational tables with foreign-key constraints.
- **Disaster Recovery**: Simple, industry-standard pg_dump backups protect the authoritative state of the entire platform.

### Negative
- Multi-hop path finding and centrality queries on large datasets can become complex in pure SQL; this is mitigated by projecting verified relationships into the Neo4j analysis graph.
