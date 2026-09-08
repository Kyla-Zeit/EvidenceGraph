import pytest
from app.rag.engine import rag_engine

@pytest.mark.asyncio
async def test_rag_query_generates_citations():
    chunks = [
        {
            "chunk_id": "c1",
            "evidence_id": "ev1",
            "evidence_number": "EV-001",
            "title": "Email Invoice",
            "text": "Email from admin@northstar-example.test with recovery phone +1-555-0192 referencing Alex Mercer.",
            "chunk_index": 0,
            "page_number": 1
        },
        {
            "chunk_id": "c2",
            "evidence_id": "ev2",
            "evidence_number": "EV-023",
            "title": "CDR Records",
            "text": "Phone call record between +1-555-0192 and Jordan Ellis (+1-555-0184).",
            "chunk_index": 0,
            "page_number": 1
        }
    ]

    res = await rag_engine.query(
        case_id="case-1",
        user_id="user-1",
        question="How are Alex Mercer and Jordan Ellis connected?",
        chunks=chunks,
        graph_paths=[],
        events=[]
    )

    assert res["model_provider"] == "DeterministicMock"
    assert len(res["citations"]) >= 2
    assert "[EV-001 §1]" in res["answer_markdown"] or "[EV-023 §1]" in res["answer_markdown"]
    assert res["confidence_category"] == "High"
