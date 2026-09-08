# Operation Northstar (Case EG-2026-0042) Investigative Dossier

## 1. Executive Case Summary
- **Case Number**: `EG-2026-0042`
- **Case Title**: Operation Northstar: Multi-Jurisdictional Financial Fraud & Shell Network
- **Classification**: LAW ENFORCEMENT SENSITIVE (LES) / UNCLASSIFIED SYNTHETIC
- **Lead Investigator**: Marcus Brody (Badge INV-784)
- **Jurisdiction**: Cross-Border Financial Crimes Task Force
- **Scope**: 50 Distinct Digital Evidence Items (EV-001 through EV-050) spanning emails, phone call logs, bank statements, server logs, crypto ledgers, flight manifests, and corporate registries.

---

## 2. Key Target Entities

| Entity ID | Display Name | Type | Canonical Identifier | Role / Profile |
| :--- | :--- | :--- | :--- | :--- |
| `ENT-001` | Alex Mercer | Person | `alex.mercer` | Primary Target, Principal Organizer |
| `ENT-002` | Jordan Ellis | Person | `jordan.ellis` | Secondary Target, Financial Intermediary |
| `ENT-003` | Elena Rostova | Person | `elena.rostova` | Nominee Director, Shell Officer |
| `ENT-004` | Northstar Holdings LLC | Organization | `northstar-holdings-llc` | Primary Offshore Shell Entity (Delaware) |
| `ENT-005` | Meridian Trade Capital | Organization | `meridian-trade-capital` | Secondary Operating Entity (Cyprus) |
| `ENT-006` | +1-555-019-2834 | PhoneNumber | `+15550192834` | Burner Mobile (Shared by Mercer & Ellis) |
| `ENT-007` | +1-555-014-9982 | PhoneNumber | `+15550149982` | Encrypted Line |
| `ENT-008` | alex.m@northstar-example.test | EmailAddress | `alex.m@northstar-example.test` | Primary Corporate Email |
| `ENT-009` | j.ellis@meridian-trade.test | EmailAddress | `j.ellis@meridian-trade.test` | Financial Transfer Email |
| `ENT-010` | 198.51.100.42 | IPAddress | `198.51.100.42` | Command & Control / VPN Endpoint |
| `ENT-011` | 1bc1q9x8p2v7k4m3n5w6t8r0y1z2u3v4w5x6y7z8 | CryptocurrencyWallet | `1bc1q9x...` | Primary Bitcoin Seizure Target |
| `ENT-012` | 0x71C...B489 | CryptocurrencyWallet | `0x71c...` | Secondary Ethereum Staging Wallet |

---

## 3. The 7 Verifiable Discoveries (A through G)

### Discovery A: Direct Communication Link
- **Path**: `Alex Mercer` -> `COMMUNICATED_WITH` -> `Jordan Ellis`
- **Evidence Support**: `EV-001 §1` (Encrypted Chat Log), `EV-014 §2` (Wiretap Call Detail Record).
- **Forensic Verification**: Call placed on 2026-02-14 at 09:30 UTC lasting 14 minutes.

### Discovery B: Hidden Multi-Hop Asset Transfer
- **Path**: `Alex Mercer` -> `OWNS` -> `Northstar Holdings LLC` -> `TRANSACTED_WITH` -> `Meridian Trade Capital` -> `TRANSFERRED_FUNDS_TO` -> `Cryptocurrency Wallet (1bc1q9x...)`
- **Evidence Support**: `EV-005 §2`, `EV-012 §1`, `EV-028 §1`.
- **Graph Verification**: Shortest path query in Cytoscape/Neo4j resolves in 4 hops.

### Discovery C: Shared Burner Infrastructure
- **Path**: `Alex Mercer` -> `USED` -> `+1-555-019-2834` <- `USED` <- `Jordan Ellis`
- **Evidence Support**: `EV-003 §1` (Hotel Check-in Registry) and `EV-022 §1` (Rental Vehicle Contract) both list identical phone number `+1-555-019-2834`.

### Discovery D: Nominee Corporate Cloaking
- **Path**: `Elena Rostova` -> `MEMBER_OF` -> `Northstar Holdings LLC`
- **Evidence Support**: `EV-008 §1` (Delaware Incorporation Filing). Power of attorney granted secretly to Alex Mercer in `EV-031 §3`.

### Discovery E: VPN / Command Node Attribution
- **Path**: `Alex Mercer` -> `ACCESSED_FROM` -> `198.51.100.42` -> `HOSTED_DOMAIN` -> `northstar-example.test`
- **Evidence Support**: `EV-019 §1` (Server Access Log) with matching timestamp and session cookie.

### Discovery F: Timestamped Alibi Contradiction
- **The Conflict**:
  - `EV-017 §1` (Sworn Witness Interview): Alex Mercer claims he was continuously at his private residence on 2026-02-18 from 13:00 to 15:00 UTC.
  - `EV-033 §1` (ATM Transaction Log): Alex Mercer's debit card was physically used at Zurich Central Station ATM on 2026-02-18 at 13:47 UTC with CCTV confirmation.
- **Timeline Engine Detection**: Flagged with high confidence (Delta: 47 minutes, Distance: 850 km).

### Discovery G: Multi-Hop Crypto Laundering Trace
- **Path**: Stolen Corporate Funds ($2.4M) -> USD Wire -> Exchange Deposit -> BTC Conversion -> Mixer Output (`1bc1q9x...`).
- **Evidence Support**: `EV-028 §1`, `EV-040 §2`, `EV-049 §1`.
