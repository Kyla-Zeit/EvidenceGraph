# Contributing to EvidenceGraph

Thank you for your interest in contributing to EvidenceGraph!

## Development Philosophy
- **Domain Rigor**: Digital evidence handling requires strict provenance, tamper-evident audit trails, and human-in-the-loop review queues.
- **Explainable & Citation-Grounded AI**: Never allow an AI model to hallucinate facts or produce answers without deep-linkable citations to raw evidence chunks (`[EV-xxx §yy]`).
- **No Mocking of Core Domain Logic**: Mock AI provider is supported for offline use, but evidence hashing, PostgreSQL storage, Neo4j projection, and parsing must use production implementations.
- **Strict Synthetic Data**: Never commit real personal data, leaked credentials, or active infrastructure targets.

## Pull Request Checklist
1. All .NET tests pass: `dotnet test`
2. All Python analysis tests pass: `pytest`
3. Frontend unit & lint pass: `npm run lint && npm run test`
4. End-to-end showcase flow passes: `npx playwright test`
5. Database migrations are generated via EF Core tooling rather than ad-hoc schema modifications.
6. New features include relevant unit/integration tests and architectural notes.
