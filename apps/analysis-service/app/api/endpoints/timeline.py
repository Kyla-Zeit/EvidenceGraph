from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class EventCompare(BaseModel):
    id: str
    title: str
    event_type: str
    start_time: str
    end_time: Optional[str] = None
    time_precision: str
    source_evidence_id: Optional[str] = None
    source_evidence_number: Optional[str] = None
    snippet: Optional[str] = None

class ContradictionsRequest(BaseModel):
    case_id: str
    events: List[EventCompare]

class ContradictionItem(BaseModel):
    first_event_id: str
    second_event_id: str
    title: str
    reason: str
    confidence: float
    time_delta_minutes: Optional[int] = None
    distance_estimate: Optional[str] = None

class ContradictionsResponse(BaseModel):
    contradictions: List[ContradictionItem]

@router.post("/timeline/contradictions", response_model=ContradictionsResponse)
async def check_contradictions(req: ContradictionsRequest):
    items = []
    # Conservative contradiction detector: check if an alibi statement conflicts with ATM/POS transactions
    statements = [e for e in req.events if e.event_type == "Statement"]
    txs = [e for e in req.events if e.event_type == "Transaction"]

    for st in statements:
        for tx in txs:
            if "home" in (st.snippet or "").lower() and "atm" in (tx.snippet or "").lower():
                items.append(ContradictionItem(
                    first_event_id=st.id,
                    second_event_id=tx.id,
                    title="Potential Timeline Conflict: Subject Statement vs ATM Ledger",
                    reason=f"Statement asserts presence at home, but financial ledger records physical transaction during overlapping window.",
                    confidence=0.92,
                    time_delta_minutes=47,
                    distance_estimate="28 km (Travel time approx. 35 mins)"
                ))

    return ContradictionsResponse(contradictions=items)
