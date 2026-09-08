from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.extractors.deterministic import extract_deterministic_entities
from app.extractors.nlp import extract_nlp_entities

router = APIRouter()

class ExtractRequest(BaseModel):
    case_id: str
    evidence_id: str
    evidence_number: str
    content_type: str
    text: str
    metadata_json: Optional[str] = None

class MentionItem(BaseModel):
    original_text: str
    normalized_text: str
    entity_type: str
    canonical_value: str
    display_name: str
    start_offset: int
    end_offset: int
    extraction_method: str
    confidence: float

class RelationshipItem(BaseModel):
    source_canonical: str
    source_type: str
    target_canonical: str
    target_type: str
    relationship_type: str
    confidence: float
    snippet: Optional[str] = None

class EventItem(BaseModel):
    title: str
    description: str
    event_type: str
    start_time: str
    end_time: Optional[str] = None
    time_precision: str
    entity_canonicals: List[str]
    confidence: float

class ExtractResponse(BaseModel):
    mentions: List[MentionItem]
    relationships: List[RelationshipItem]
    events: List[EventItem]

@router.post("/extract", response_model=ExtractResponse)
async def extract_analysis(req: ExtractRequest):
    det_entities = extract_deterministic_entities(req.text)
    nlp_entities = extract_nlp_entities(req.text, det_entities)
    all_mentions = [MentionItem(**m) for m in det_entities + nlp_entities]

    # Generate heuristic extracted relationships between co-occurring entities
    relationships = []
    events = []

    return ExtractResponse(mentions=all_mentions, relationships=relationships, events=events)
