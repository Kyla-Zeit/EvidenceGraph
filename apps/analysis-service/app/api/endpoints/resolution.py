from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.resolution.matcher import suggest_entity_duplicates

router = APIRouter()

class EntityCompareItem(BaseModel):
    id: str
    entity_type: str
    canonical_value: str
    display_name: str
    shared_identifiers: Optional[List[str]] = []

class ResolutionRequest(BaseModel):
    case_id: str
    entities: List[EntityCompareItem]

class DuplicateSuggestion(BaseModel):
    entity_a_id: str
    entity_b_id: str
    similarity_score: float
    matching_factors: List[str]
    recommended_action: str

class ResolutionResponse(BaseModel):
    suggestions: List[DuplicateSuggestion]

@router.post("/resolution/suggest", response_model=ResolutionResponse)
async def suggest_duplicates(req: ResolutionRequest):
    entity_dicts = [e.model_dump() for e in req.entities]
    suggestions = suggest_entity_duplicates(entity_dicts)
    return ResolutionResponse(suggestions=[DuplicateSuggestion(**s) for s in suggestions])
