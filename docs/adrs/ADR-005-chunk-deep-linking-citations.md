# ADR-005: Deterministic Chunk Deep Linking for GraphRAG Citations

## Status
Accepted

## Context
Large Language Models (LLMs) used in investigative intelligence frequently suffer from hallucinations, vague generalizations, or ungrounded assertions. In legal and forensic analysis, an unsubstantiated AI claim is inadmissible and actively hazardous to an investigation.

## Decision
We enforce **Deterministic Chunk Deep-Linking**:
1. All ingested text and parsed evidence documents are partitioned into deterministic chunks (500-1000 characters with 100 character overlap), indexed by a 0-based sequence `chunkIndex` and tagged with a SHA-256 content digest `textHash`.
2. GraphRAG retrievals pull explicit chunk records from the PostgreSQL/Neo4j index.
3. The AI reasoning engine is strictly constrained to cite evidence exclusively through bracketed chunk references matching the grammar `[EV-xxx §yy]` (e.g., `[EV-014 §12]`).
4. The frontend UI parses citation tags into interactive clickable badges that deep-link directly into the exact highlighted chunk offset in the Evidence Detail view.
5. AI analysis runs record a complete, immutable execution trace including prompt template version, model parameters, retrieved context chunks, citations, and confidence factor breakdowns.

## Consequences

### Positive
- **Explainable, Grounded AI**: Every fact stated by the AI points directly to the underlying raw evidence text.
- **Human Verification**: Investigators can inspect the exact sentence and forensic chunk supporting each claim in one click.
- **Hallucination Suppression**: Restricting output to cited facts drastically reduces generative confabulation.

### Negative
- Document parsing and chunking overhead during ingestion; fully offset by instant deep-linkability.
