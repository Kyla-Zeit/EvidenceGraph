# ADR-002: Dual-Store Architecture (PostgreSQL Authoritative Record vs Neo4j Link Graph)

## Status
Accepted

## Context
Investigative analysis demands two fundamentally distinct computational paradigms:
1. **Relational System of Record**: Strict schema enforcement, ACID transactional guarantees, foreign-key integrity, and immutable audit logs.
2. **Graph Analytics Engine**: High-performance multi-hop link traversal, shortest path discovery between disparate suspect nodes, cycle detection, and centrality scoring (betweenness, degree).

Attempting to force graph queries into relational joins results in recursive Common Table Expressions (CTEs) that do not scale past 3-4 hops, while relying solely on a graph database violates forensic provenance and auditability standards.

## Decision
We implement a **Dual-Store Architecture**:
1. **PostgreSQL** serves as the authoritative source of truth.
2. **Neo4j** (with an in-memory NetworkX fallback for standalone or air-gapped deployments) acts as a read-optimized, derived analytical projection.
3. Every entity and relationship record in Neo4j maintains an exact 1:1 correlation with PostgreSQL entity and relationship IDs (`EntityId`, `RelationshipId`, `CaseId`).
4. Synchronization is driven by the backend Web API upon entity/relationship lifecycle events (extraction, confirmation, merger) and on-demand via the Graph Rebuild API.

## Consequences

### Positive
- **Best-of-Both-Worlds**: Uncompromised legal compliance and forensic integrity in PostgreSQL combined with sub-millisecond multi-hop graph algorithms in Neo4j/NetworkX.
- **Resilience**: The graph engine can be torn down, upgraded, or rebuilt at any moment without risk of data loss.
- **Graceful Degradation**: If Neo4j is unreachable, the Python Analysis Service seamlessly falls back to NetworkX in-memory graph projections.

### Negative
- Requires maintaining projection synchronization logic. Handled cleanly through centralized service boundaries (`AnalysisServiceClient`).
