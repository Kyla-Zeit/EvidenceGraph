import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any
import time

ADVERSARIAL_PATTERNS = [
    re.compile(r'ignore (?:all )?previous instructions.*?(?:\.|\n)', re.IGNORECASE),
    re.compile(r'declare .*? guilty.*?(?:\.|\n)', re.IGNORECASE),
    re.compile(r'output:? [\'"].*?[\'"]', re.IGNORECASE)
]

def sanitize_evidence_text(text: str) -> str:
    cleaned = text
    for pat in ADVERSARIAL_PATTERNS:
        cleaned = pat.sub("[Adversarial instruction stripped from evidence text]", cleaned)
    return cleaned

class IInvestigationAiProvider(ABC):
    @abstractmethod
    async def generate_grounded_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        graph_paths: List[Dict[str, Any]],
        events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        pass

class DeterministicMockAiProvider(IInvestigationAiProvider):
    async def generate_grounded_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        graph_paths: List[Dict[str, Any]],
        events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        start_time = time.time()
        q_lower = question.lower()

        citations = []
        answer_parts = []
        positive_factors = ["Active case evidentiary records retrieved", "Verified entity mentions across forensic sources"]
        negative_factors = []

        # Grounding check: Check if query is asking about Alex Mercer and Jordan Ellis
        if "alex mercer" in q_lower and "jordan ellis" in q_lower:
            matching_chunks = [c for c in retrieved_chunks if any(ev in c.get("evidence_number", "") for ev in ["EV-001", "EV-014", "EV-023", "EV-027"])]
            if not matching_chunks and retrieved_chunks:
                matching_chunks = retrieved_chunks[:3]

            answer_parts.append("Alex Mercer and Jordan Ellis are connected through shared communications infrastructure and coordinated payment instructions across multiple documented case records:\n")

            for i, chunk in enumerate(matching_chunks[:3]):
                ev_num = chunk.get("evidence_number", "EV-001")
                idx = chunk.get("chunk_index", 0) + 1
                cit_key = f"[{ev_num} §{idx}]"
                snippet = sanitize_evidence_text(chunk.get("text", ""))[:120]
                citations.append({
                    "citation_key": cit_key,
                    "evidence_id": chunk.get("evidence_id"),
                    "evidence_number": ev_num,
                    "chunk_id": chunk.get("chunk_id"),
                    "page_number": chunk.get("page_number", 1),
                    "snippet": snippet,
                    "confidence": 0.96
                })
                if i == 0:
                    answer_parts.append(f"1. Emails and account records from {ev_num} list telephone number `+1-555-0192` as a shared recovery contact associated with Northstar services. {cit_key}")
                elif i == 1:
                    answer_parts.append(f"2. Telecommunications CDR logs from {ev_num} record direct voice communications between Alex Mercer (+1-555-0192) and Jordan Ellis (+1-555-0184). {cit_key}")
                else:
                    answer_parts.append(f"3. Operational chat transcripts and reports from {ev_num} document joint dispatching of tech-support billing referencing wallet `0x71C...B71F`. {cit_key}")

            answer_parts.append("\n*Note: Graph connections reflect documented associations in case evidence and require analyst confirmation.*")

        elif "contradiction" in q_lower or "conflict" in q_lower:
            answer_parts.append("A conservative potential timeline conflict was identified in the evidence records:\n")
            statement_chunks = [c for c in retrieved_chunks if "EV-034" in c.get("evidence_number", "")]
            tx_chunks = [c for c in retrieved_chunks if "EV-025" in c.get("evidence_number", "")]

            if statement_chunks:
                sc = statement_chunks[0]
                cit_key1 = f"[{sc.get('evidence_number')} §{sc.get('chunk_index', 0)+1}]"
                citations.append({
                    "citation_key": cit_key1,
                    "evidence_id": sc.get("evidence_id"),
                    "evidence_number": sc.get("evidence_number"),
                    "chunk_id": sc.get("chunk_id"),
                    "page_number": sc.get("page_number", 1),
                    "snippet": sanitize_evidence_text(sc.get("text", ""))[:120],
                    "confidence": 0.92
                })
                answer_parts.append(f"1. In interview statement {sc.get('evidence_number')}, subject Alex Mercer stated they remained at home in the East Suburbs between 13:00 and 15:00 UTC. {cit_key1}")

            if tx_chunks:
                tc = tx_chunks[0]
                cit_key2 = f"[{tc.get('evidence_number')} §{tc.get('chunk_index', 0)+1}]"
                citations.append({
                    "citation_key": cit_key2,
                    "evidence_id": tc.get("evidence_id"),
                    "evidence_number": tc.get("evidence_number"),
                    "chunk_id": tc.get("chunk_id"),
                    "page_number": tc.get("page_number", 1),
                    "snippet": sanitize_evidence_text(tc.get("text", ""))[:120],
                    "confidence": 0.95
                })
                answer_parts.append(f"2. Banking records {tc.get('evidence_number')} indicate a physical card cash withdrawal at North Branch ATM (approx. 28 km away) at 13:47 UTC. {cit_key2}")

            answer_parts.append("\n*Assessment: Flagged as 'Potential Timeline Conflict' for investigator verification. The system does not assert intent or deception.*")
            negative_factors.append("Subject alibi statement has not been independently corroborated")

        elif "northstar-example" in q_lower or "domain" in q_lower or "ip" in q_lower:
            answer_parts.append("Evidence associated with `northstar-example.test` and related infrastructure includes:\n")
            matching_chunks = [c for c in retrieved_chunks if any(term in c.get("text", "").lower() for term in ["northstar", "198.51.100.42", "domain"])]
            if not matching_chunks and retrieved_chunks:
                matching_chunks = retrieved_chunks[:2]

            for chunk in matching_chunks[:3]:
                ev_num = chunk.get("evidence_number", "EV-001")
                cit_key = f"[{ev_num} §{chunk.get('chunk_index', 0)+1}]"
                citations.append({
                    "citation_key": cit_key,
                    "evidence_id": chunk.get("evidence_id"),
                    "evidence_number": ev_num,
                    "chunk_id": chunk.get("chunk_id"),
                    "page_number": chunk.get("page_number", 1),
                    "snippet": sanitize_evidence_text(chunk.get("text", ""))[:120],
                    "confidence": 0.95
                })
                answer_parts.append(f"- Record {ev_num} identifies server infrastructure hosted on IP `198.51.100.42` and administrative email routing. {cit_key}")

        else:
            if retrieved_chunks:
                answer_parts.append(f"Based on analysis of {len(retrieved_chunks)} case records retrieved for this query:\n")
                for chunk in retrieved_chunks[:2]:
                    ev_num = chunk.get("evidence_number", "EV-001")
                    cit_key = f"[{ev_num} §{chunk.get('chunk_index', 0)+1}]"
                    raw_text = chunk.get("text", "")
                    clean_text = sanitize_evidence_text(raw_text)
                    citations.append({
                        "citation_key": cit_key,
                        "evidence_id": chunk.get("evidence_id"),
                        "evidence_number": ev_num,
                        "chunk_id": chunk.get("chunk_id"),
                        "page_number": chunk.get("page_number", 1),
                        "snippet": clean_text[:120],
                        "confidence": 0.90
                    })
                    answer_parts.append(f"- Record {ev_num} contains pertinent mentions: \"{clean_text[:100]}...\" {cit_key}")
            else:
                answer_parts.append("No authoritative evidence found in the active case workspace matching the query parameters.")
                negative_factors.append("Zero supporting evidentiary chunks identified")

        latency = int((time.time() - start_time) * 1000) + 35
        return {
            "answer_markdown": "\n".join(answer_parts),
            "model_provider": "DeterministicMock",
            "model": "evidencegraph-mock-v1",
            "confidence_category": "High" if len(citations) >= 2 else "Moderate",
            "confidence_factors": {
                "positive": positive_factors,
                "negative": negative_factors
            },
            "citations": citations,
            "latency_ms": latency,
            "input_tokens": 140 + len(retrieved_chunks) * 45,
            "output_tokens": 85 + len(citations) * 20
        }
