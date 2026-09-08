# ADR-007: Human-in-the-Loop Confirmation Lifecycle for Extracted Entities & Relationships

## Status
Accepted

## Context
Automated entity extraction (NLP/NER) and heuristic relationship extraction will inevitably produce false positives, noisy co-occurrences, or misclassified identifiers. Automated systems that directly link suspects without human oversight risk compounding errors across the knowledge graph.

## Decision
We establish a **Strict Human-in-the-Loop (HITL) Confirmation Lifecycle**:
1. All AI/NLP extracted entities and relationships are initially assigned the status `Extracted` or `Suggested`.
2. Unconfirmed entities and relationships are visually distinguished on the Link Graph (dashed lines, opacity, warning badges).
3. Only human investigators with the role `Investigator` or `Administrator` can confirm, reject, or merge entities and relationships.
4. Every confirmation or rejection action generates an authoritative, cryptographically chained audit event recording the investigator's ID, timestamp, and rationale.
5. Graph analytics and export tools allow analysts to toggle filters between *All Hypotheses* vs *Confirmed Evidence Only*.

## Consequences

### Positive
- **Judicial Defensibility**: Eliminates "black box" automated accusations; every confirmed relationship is backed by human review.
- **Error Quarantine**: Prevents erroneous NLP extractions from polluting downstream link analysis and centrality scores.

### Negative
- Requires investigator time to review extraction queues. Facilitated by the Review Queue UI.
