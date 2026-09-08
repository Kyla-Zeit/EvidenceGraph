# ADR-003: MinIO S3-Compatible Object Storage with Write-Once Immutability

## Status
Accepted

## Context
Digital evidence files (PDFs, disk images, emails, CCTV captures, bank statements) must remain pristinely unaltered from the exact moment of acquisition. Any post-upload modification, overwriting, or silent corruption invalidates chain of custody in judicial proceedings.

## Decision
We utilize **MinIO S3-Compatible Object Storage** configured with distinct operational buckets and write-once semantics:
1. `evidence-original`: Immutable bucket holding raw, unprocessed evidence payloads. Write-once, read-only policy. No update or overwrite APIs are exposed.
2. `evidence-derived`: Bucket holding processed derivatives (OCR text files, extracted frames, normalized CSV exports).
3. Streaming SHA-256 and SHA-512 cryptographic digests are computed synchronously in memory during ingestion before committing the object key to PostgreSQL.
4. Physical integrity can be verified on demand (`POST /api/v1/cases/{caseId}/evidence/{id}/verify-integrity`), streaming the stored object directly from MinIO to verify current byte-stream hashes against the original database record.

## Consequences

### Positive
- **Forensic Pristineness**: Ingestion guarantees exact bit-for-bit preservation of original media.
- **Verification on Demand**: Instantaneous detection of bit rot, unauthorized storage tampering, or file replacement.
- **S3 Standard Compatibility**: Seamless migration path to AWS S3 Object Lock (WORM - Write Once Read Many) or Azure Immutable Blob Storage in enterprise cloud deployments.

### Negative
- Requires storage capacity for original files plus extracted derivative artifacts.
