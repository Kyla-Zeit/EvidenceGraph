# ADR-004: Tamper-Evident SHA-256 Audit Trail Hash Chain

## Status
Accepted

## Context
Traditional application logs (such as database rows with auto-increment IDs or flat log files) are susceptible to unauthorized retrospective alteration, deletion, or truncation by malicious insiders or compromised administrative accounts. Forensic platforms require verifiable mathematical proof that historical audit logs have not been manipulated.

## Decision
We implement a **Cryptographic SHA-256 Hash Chain** for all platform audit events:
1. Every audit entry is recorded with a monotonic sequence number, UTC timestamp, acting user ID, action type, resource reference, and canonical JSON payload.
2. The entry hash is computed deterministically: EntryHash_n = SHA256(SequenceNumber || TimestampUtc || UserId || Action || ResourceId || CanonicalJSON || EntryHash_{n-1}).
3. The initial genesis entry links to a constant seed hash (`0000000000000000000000000000000000000000000000000000000000000000`).
4. Any insertion, modification, or deletion of an audit record mathematically breaks the hash chain for all subsequent entries.
5. The API provides a global and per-case verification endpoint (`GET /api/v1/audit/verify`) that iterates from sequence 1 to N, re-computing and verifying all hashes in O(N) time.

## Consequences

### Positive
- **Cryptographic Tamper-Evidence**: Mathematical guarantee of log sequence integrity.
- **Zero Third-Party Blockchain Overhead**: Provides immutability verification without the latency, financial cost, or environmental overhead of public blockchains.
- **Auditor-Friendly**: Auditors can download the complete audit trail and independently verify the SHA-256 hash sequence using standard command-line tools.

### Negative
- Requires deterministic canonical JSON serialization to avoid whitespace or key-ordering discrepancies.
