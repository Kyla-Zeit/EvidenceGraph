// EvidenceGraph Neo4j Schema Constraints & Indexes
CREATE CONSTRAINT unique_entity_key IF NOT EXISTS
FOR (e:Entity) REQUIRE (e.caseId, e.id) IS UNIQUE;

CREATE INDEX entity_case_type_idx IF NOT EXISTS
FOR (e:Entity) ON (e.caseId, e.entityType);

CREATE INDEX entity_canonical_val_idx IF NOT EXISTS
FOR (e:Entity) ON (e.canonicalValue);

CREATE CONSTRAINT unique_evidence_key IF NOT EXISTS
FOR (ev:Evidence) REQUIRE (ev.caseId, ev.id) IS UNIQUE;

CREATE INDEX relationship_case_type_idx IF NOT EXISTS
FOR ()-[r:RELATIONSHIP]-() ON (r.caseId, r.type);
